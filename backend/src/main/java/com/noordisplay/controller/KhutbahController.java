package com.noordisplay.controller;

import com.noordisplay.service.KhutbahTranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/khutbah")
@RequiredArgsConstructor
@Slf4j
public class KhutbahController {

    private final KhutbahTranslationService khutbahService;

    @PostMapping("/{slug}/session")
    public ResponseEntity<Map<String, Object>> createSession(
            @PathVariable String slug,
            @RequestBody Map<String, String> body) {
        String lang = body.getOrDefault("language", "en");
        Map<String, Object> session = khutbahService.createRealtimeSession(lang);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{slug}/transcript")
    public ResponseEntity<Void> relayTranscript(
            @PathVariable String slug,
            @RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        String lang = body.getOrDefault("lang", "en");
        log.info("Relay received for {}: lang={} text='{}'", slug, lang, text);
        if (!text.isBlank()) {
            khutbahService.broadcastTranscript(slug, text, lang);
            log.info("Broadcast sent to /topic/khutbah/{}", slug);
        } else {
            log.warn("Relay text was blank — nothing broadcast");
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{slug}/start")
    public ResponseEntity<Void> start(@PathVariable String slug) {
        khutbahService.setKhutbahMode(slug, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{slug}/stop")
    public ResponseEntity<Void> stop(@PathVariable String slug) {
        khutbahService.setKhutbahMode(slug, false);
        return ResponseEntity.ok().build();
    }
}
