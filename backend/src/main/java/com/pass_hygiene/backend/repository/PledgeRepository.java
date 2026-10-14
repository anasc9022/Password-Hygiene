package com.pass_hygiene.backend.repository;

import com.pass_hygiene.backend.entity.Pledge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PledgeRepository extends JpaRepository<Pledge, Long> {
    List<Pledge> findTop6ByOrderByCreatedAtDesc();
}
