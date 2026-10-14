package com.pass_hygiene.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

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
}
