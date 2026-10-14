package com.pass_hygiene.backend.controller;

import com.pass_hygiene.backend.dto.Dto;
import com.pass_hygiene.backend.entity.Pledge;
import com.pass_hygiene.backend.repository.PledgeRepository;
import com.pass_hygiene.backend.service.BreachService;
import com.pass_hygiene.backend.service.ContentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CampaignController {

    private final ContentService content;
    private final BreachService breach;
    private final PledgeRepository pledges;

    public CampaignController(ContentService content, BreachService breach, PledgeRepository pledges) {
        this.content = content;
        this.breach = breach;
        this.pledges = pledges;
    }

    @GetMapping("/tips")
    public List<Dto.Tip> tips() {
        return content.tips();
    }

    @GetMapping("/quiz")
    public List<Dto.QuizItem> quiz() {
        return content.quiz();
    }

    @PostMapping("/quiz/submit")
    public Dto.QuizResult submit(@RequestBody Dto.QuizSubmission submission) {
        return content.grade(submission.answers);
    }

    @PostMapping("/pledges")
    @ResponseStatus(HttpStatus.CREATED)
    public Dto.PledgeView pledge(@Valid @RequestBody Dto.PledgeRequest request) {
        Pledge saved = pledges.save(new Pledge(request.nickname.trim(), String.join("|", request.commitments)));
        return view(saved);
    }

    @GetMapping("/stats")
    public Dto.Stats stats() {
        return new Dto.Stats(pledges.count(), pledges.findTop6ByOrderByCreatedAtDesc().stream().map(this::view).toList());
    }

    @GetMapping(value = "/breach/range/{prefix}", produces = "text/plain")
    public ResponseEntity<String> range(@PathVariable String prefix) {
        if (!prefix.matches("^[0-9A-Fa-f]{5}$")) {
            return ResponseEntity.badRequest().body("Prefix must be exactly 5 hex characters.");
        }
        try {
            return ResponseEntity.ok(breach.range(prefix.toUpperCase()));
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Breach service is unavailable.");
        }
    }

    private Dto.PledgeView view(Pledge p) {
        return new Dto.PledgeView(p.getNickname(), p.getCommitments().split("\\|").length);
    }
}
