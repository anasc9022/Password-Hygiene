package com.pass_hygiene.backend.service;

import com.pass_hygiene.backend.dto.Dto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ContentService {

    private record Q(int id, String text, List<String> options, int answer, String why) {
    }

    private static final List<Dto.Tip> TIPS = List.of(
            new Dto.Tip("Passwords", "Length beats complexity", "A passphrase of four or more random words is easier to remember and harder to crack than a short, symbol-heavy password."),
            new Dto.Tip("Passwords", "Never reuse a password", "When one site is breached, attackers try the same credentials everywhere else. A unique password per account contains the damage."),
            new Dto.Tip("Passwords", "Use a password manager", "A manager creates and stores unique passwords, so you only need to remember one strong master passphrase."),
            new Dto.Tip("Accounts", "Turn on multi-factor authentication", "Prefer an authenticator app or hardware key over SMS codes. Start with email and banking."),
            new Dto.Tip("Accounts", "Protect your recovery paths", "Your email inbox can reset almost everything else. Secure it first and keep backup codes offline."),
            new Dto.Tip("Privacy", "Share less, expose less", "Every form field is data someone can lose. Give a service only what it genuinely needs."),
            new Dto.Tip("Privacy", "Review app permissions", "Check location, camera, microphone and contacts access regularly and revoke what an app does not need."),
            new Dto.Tip("Phishing", "Pause before you click", "Urgency is the attacker's favourite tool. Verify the sender and open sites by typing the address yourself."),
            new Dto.Tip("Phishing", "Never share one-time codes", "No genuine support agent will ask for your OTP or password."),
            new Dto.Tip("Devices", "Update and encrypt", "Install updates promptly, lock devices with a strong PIN and turn on full-disk encryption."));

    private static final List<Q> QUESTIONS = List.of(
            new Q(1, "Which password is the hardest to crack?", List.of("P@ssw0rd!", "Summer2024", "maple-orbit-ladder-quiet-47", "qwerty12345"), 2,
                    "Length and randomness matter most. A multi-word passphrase has far more entropy than a common word with substitutions."),
            new Q(2, "You reuse one password on many sites. What is the main risk?", List.of("Slower logins", "One breach exposes all your accounts", "The password expires sooner", "Sites lock you out"), 1,
                    "Credential stuffing replays leaked credentials against other services."),
            new Q(3, "Which second factor is generally the strongest?", List.of("SMS code", "Security question", "Hardware security key", "Birth date"), 2,
                    "Hardware keys resist phishing and SIM-swap attacks that can defeat SMS codes."),
            new Q(4, "A breach-check service using k-anonymity receives only...", List.of("Your full password", "The first 5 characters of its SHA-1 hash", "Your email and password", "Your IP and password"), 1,
                    "Only a short hash prefix leaves your device, so the full password is never revealed."),
            new Q(5, "An email says your account closes in 1 hour unless you log in via its link. You should...", List.of("Click quickly", "Reply with your password", "Open the official site yourself and check", "Forward it to friends"), 2,
                    "Artificial urgency is a phishing signal. Go to the service directly."),
            new Q(6, "Where should you keep many strong passwords?", List.of("A notes file named passwords", "A reputable password manager", "Browser autofill on a shared PC", "Sticky notes on the monitor"), 1,
                    "A manager encrypts your vault and generates unique credentials."));

    public List<Dto.Tip> tips() {
        return TIPS;
    }

    public List<Dto.QuizItem> quiz() {
        return QUESTIONS.stream().map(q -> new Dto.QuizItem(q.id(), q.text(), q.options())).toList();
    }

    public Dto.QuizResult grade(List<Integer> answers) {
        List<Dto.Feedback> feedback = new ArrayList<>();
        int score = 0;
        for (int i = 0; i < QUESTIONS.size(); i++) {
            Q q = QUESTIONS.get(i);
            int given = (answers != null && i < answers.size() && answers.get(i) != null) ? answers.get(i) : -1;
            boolean ok = given == q.answer();
            if (ok) score++;
            feedback.add(new Dto.Feedback(q.id(), ok, q.answer(), q.why()));
        }
        return new Dto.QuizResult(score, QUESTIONS.size(), feedback);
    }
}
