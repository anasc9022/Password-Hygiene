package com.pass_hygiene.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
public class Pledge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(nullable = false, length = 700)
    private String commitments;

    private Instant createdAt = Instant.now();

    protected Pledge() {
    }

    public Pledge(String nickname, String commitments) {
        this.nickname = nickname;
        this.commitments = commitments;
    }

    public Long getId() {
        return id;
    }

    public String getNickname() {
        return nickname;
    }

    public String getCommitments() {
        return commitments;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
