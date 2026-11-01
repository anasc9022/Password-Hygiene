package com.pass_hygiene.backend.controller;

import com.pass_hygiene.backend.dto.Dto;
import com.pass_hygiene.backend.service.VaultService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vault")
public class VaultController {

    private final VaultService vault;

    public VaultController(VaultService vault) { this.vault = vault; }

    @GetMapping("/salt/{username}")
    public Dto.SaltResponse salt(@PathVariable String username) { return new Dto.SaltResponse(vault.salt(username)); }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody Dto.RegisterRequest request) { vault.register(request); }

    @PostMapping("/login")
    public Dto.VaultSession login(@Valid @RequestBody Dto.LoginRequest request) { return vault.login(request); }

    @PutMapping
    public Dto.SaveResponse save(@RequestHeader(value = "Authorization", required = false) String auth,
                                 @Valid @RequestBody Dto.VaultPayload payload) {
        return vault.save(auth, payload);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = "Authorization", required = false) String auth) { vault.logout(auth); }
}
