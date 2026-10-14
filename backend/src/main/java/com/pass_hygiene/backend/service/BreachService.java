package com.pass_hygiene.backend.service;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Service
public class BreachService {

    private final RestClient client;

    public BreachService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(4));
        factory.setReadTimeout(Duration.ofSeconds(6));
        this.client = RestClient.builder()
                .requestFactory(factory)
                .baseUrl("https://api.pwnedpasswords.com")
                .defaultHeader("Add-Padding", "true")
                .defaultHeader("User-Agent", "SafeKey-Academic-Campaign")
                .build();
    }

    public String range(String prefix) {
        return client.get().uri("/range/{prefix}", prefix).retrieve().body(String.class);
    }
}
