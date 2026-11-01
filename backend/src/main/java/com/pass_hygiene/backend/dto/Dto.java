package com.pass_hygiene.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public final class Dto {

    private Dto() {
    }

    public record Tip(String category, String title, String body) {
    }

    public record QuizItem(int id, String question, List<String> options) {
    }

    public record Feedback(int id, boolean correct, int correctIndex, String explanation) {
    }

    public record QuizResult(int score, int total, List<Feedback> feedback) {
    }

    public record PledgeView(String nickname, int commitments) {
    }

    public record Stats(long pledges, List<PledgeView> recent) {
    }

    public static class QuizSubmission {
        public List<Integer> answers;
    }

    public static class PledgeRequest {
        @NotBlank
        @Size(max = 30)
        public String nickname;

        @NotEmpty
        @Size(max = 10)
        public List<@NotBlank @Size(max = 60) String> commitments;
    }

    // ---- Vault (zero-knowledge) ----
    public record SaltResponse(String salt) {
    }

    public record VaultSession(String token, String iv, String blob, long version) {
    }

    public record SaveResponse(long version) {
    }

    public static class RegisterRequest {
        @NotBlank
        @Pattern(regexp = "^[A-Za-z0-9_.@+-]{3,64}$")
        public String username;
        @NotBlank
        @Size(min = 24, max = 24)   // 16 random bytes, base64
        public String salt;
        @NotBlank
        @Size(min = 44, max = 44)   // 32-byte derived auth key, base64
        public String authKey;
    }

    public static class LoginRequest {
        @NotBlank
        @Pattern(regexp = "^[A-Za-z0-9_.@+-]{3,64}$")
        public String username;
        @NotBlank
        @Size(min = 44, max = 44)
        public String authKey;
    }

    public static class VaultPayload {
        @NotBlank
        @Size(max = 32)
        public String iv;
        @NotBlank
        @Size(max = 1_000_000)
        public String blob;
        public long version;
    }
}
