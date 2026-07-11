package com.noordisplay.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KhutbahTranslationService {

    private final RestTemplate          restTemplate;
    private final SimpMessagingTemplate messaging;
    private final ObjectMapper          mapper = new ObjectMapper();

    @Value("${app.openai.api-key:}")
    private String openAiKey;

    @jakarta.annotation.PostConstruct
    public void logKeyStatus() {
        if (openAiKey == null || openAiKey.isBlank()) {
            log.warn("⚠️  OPENAI_API_KEY is NOT set.");
        } else {
            log.info("✓ OPENAI_API_KEY loaded ({} chars)", openAiKey.length());
        }
    }

    /**
     * Creates a short-lived client secret for a WebRTC translation session.
     * The browser uses this to connect directly to OpenAI's Realtime Translation API.
     * The secret expires quickly so it's safe to send to the browser.
     */
    public Map<String, Object> createRealtimeSession(String targetLang) {
        if (openAiKey == null || openAiKey.isBlank()) {
            return Map.of("error", "OPENAI_API_KEY not configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(openAiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "session", Map.of(
                "model", "gpt-realtime-translate",
                "audio", Map.of(
                    "output", Map.of("language", targetLang)
                )
            )
        );

        try {
            ResponseEntity<String> res = restTemplate.postForEntity(
                "https://api.openai.com/v1/realtime/translations/client_secrets",
                new HttpEntity<>(body, headers),
                String.class
            );
            JsonNode node = mapper.readTree(res.getBody());
            log.info("Created realtime translation session for lang={}", targetLang);
            return mapper.convertValue(node, Map.class);
        } catch (HttpClientErrorException e) {
            log.error("OpenAI rejected the request: status={} body={}",
                e.getStatusCode(), e.getResponseBodyAsString());
            return Map.of(
                "error", "OpenAI error " + e.getStatusCode(),
                "details", e.getResponseBodyAsString()
            );
        } catch (Exception e) {
            log.error("Failed to create realtime session: {}", e.getMessage(), e);
            return Map.of("error", e.getMessage());
        }
    }

    /** Broadcast a transcript delta to all connected TV displays */
    public void broadcastTranscript(String slug, String text, String lang) {
        messaging.convertAndSend("/topic/khutbah/" + slug, Map.of(
            "translated", text,
            "lang", lang
        ));
    }

    /** Notify displays to enter/exit khutbah mode */
    public void setKhutbahMode(String slug, boolean on) {
        messaging.convertAndSend("/topic/khutbah-mode/" + slug, Map.of("active", on));
        log.info("Khutbah mode {} for {}", on ? "ON" : "OFF", slug);
    }
}
