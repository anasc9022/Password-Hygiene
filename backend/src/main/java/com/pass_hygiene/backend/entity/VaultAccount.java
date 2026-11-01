package com.pass_hygiene.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Stores only what the server needs: a public salt, a hash of the auth key, and opaque ciphertext.
 */
@Entity
@Table(name = "vault_account", uniqueConstraints = @UniqueConstraint(columnNames = "username"))
public class VaultAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String username;

    @Column(nullable = false, length = 32)
    private String salt;

    @Column(nullable = false, length = 64)
    private String authHash;

    @Column(length = 32)
    private String iv;

    @Column(name = "ciphertext", columnDefinition = "TEXT")
    private String ciphertext;

    private long version;
    private Instant updatedAt = Instant.now();

    protected VaultAccount() {
    }

    public VaultAccount(String username, String salt, String authHash) {
        this.username = username;
        this.salt = salt;
        this.authHash = authHash;
    }

    public void update(String iv, String ciphertext) {
        this.iv = iv;
        this.ciphertext = ciphertext;
        this.version++;
        this.updatedAt = Instant.now();
    }

    public String getSalt() {
        return salt;
    }

    public String getAuthHash() {
        return authHash;
    }

    public String getIv() {
        return iv;
    }

    public String getCiphertext() {
        return ciphertext;
    }

    public long getVersion() {
        return version;
    }
}
