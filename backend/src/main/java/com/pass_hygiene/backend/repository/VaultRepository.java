package com.pass_hygiene.backend.repository;

import com.pass_hygiene.backend.entity.VaultAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VaultRepository extends JpaRepository<VaultAccount, Long> {
    Optional<VaultAccount> findByUsername(String username);
    boolean existsByUsername(String username);
}
