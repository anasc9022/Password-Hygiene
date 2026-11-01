package com.pass_hygiene.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.pass_hygiene.backend.dto.Dto;
import com.pass_hygiene.backend.entity.VaultAccount;
import com.pass_hygiene.backend.repository.VaultRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VaultService {

    private static final Duration SESSION_TTL = Duration.ofMinutes(30);
    private static final Duration LOCKOUT = Duration.ofMinutes(5);
    private static final int MAX_FAILS = 5;

    private record Session(String username, Instant expires) {
    }

    private static final class Attempts {
        int fails;
        Instant lockedUntil = Instant.EPOCH;
    }

    private final VaultRepository repo;
    private final byte[] pepper;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    public VaultService(VaultRepository repo, @Value("${safekey.pepper:dev-only-change-me}") String pepper) {
        this.repo = repo;
        this.pepper = pepper.getBytes(StandardCharsets.UTF_8);
    }

    public void register(Dto.RegisterRequest r) {
        String u = norm(r.username);
        if (repo.existsByUsername(u)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is taken.");
        try {
            repo.save(new VaultAccount(u, r.salt, sha256(r.authKey)));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is taken.");
        }
    }

    /**
     * Unknown users get a deterministic fake salt so the endpoint does not reveal which usernames exist.
     */
    public String salt(String username) {
        String u = norm(username);
        return repo.findByUsername(u).map(VaultAccount::getSalt).orElseGet(() -> fakeSalt(u));
    }

    public Dto.VaultSession login(Dto.LoginRequest r) {
        String u = norm(r.username);
        if (attempts.size() > 10_000) attempts.clear();
        Attempts a = attempts.computeIfAbsent(u, k -> new Attempts());
        synchronized (a) {
            if (Instant.now().isBefore(a.lockedUntil)) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again later.");
            }
            VaultAccount acc = repo.findByUsername(u).orElse(null);
            boolean ok = acc != null && MessageDigest.isEqual(
                    sha256(r.authKey).getBytes(StandardCharsets.UTF_8), acc.getAuthHash().getBytes(StandardCharsets.UTF_8));
            if (!ok) {
                if (++a.fails >= MAX_FAILS) {
                    a.fails = 0;
                    a.lockedUntil = Instant.now().plus(LOCKOUT);
                }
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password.");
            }
            a.fails = 0;
            byte[] raw = new byte[32];
            random.nextBytes(raw);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
            sessions.put(token, new Session(u, Instant.now().plus(SESSION_TTL)));
            return new Dto.VaultSession(token, acc.getIv(), acc.getCiphertext(), acc.getVersion());
        }
    }

    @Transactional
    public Dto.SaveResponse save(String authHeader, Dto.VaultPayload p) {
        VaultAccount acc = repo.findByUsername(requireUser(authHeader))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired."));
        if (acc.getVersion() != p.version) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vault changed elsewhere. Unlock again.");
        }
        acc.update(p.iv, p.blob);
        return new Dto.SaveResponse(acc.getVersion());
    }

    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) sessions.remove(authHeader.substring(7));
    }

    private String requireUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing session.");
        }
        String token = authHeader.substring(7);
        Session s = sessions.get(token);
        if (s == null || Instant.now().isAfter(s.expires())) {
            sessions.remove(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired.");
        }
        return s.username();
    }

    private static String norm(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }

    private static String sha256(String text) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private String fakeSalt(String username) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(pepper, "HmacSHA256"));
            byte[] h = mac.doFinal(username.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(Arrays.copyOf(h, 16));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
