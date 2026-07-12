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
        log.info("[Khutbah] Creating realtime session for slug={} lang={}", slug, lang);
        Map<String, Object> session = khutbahService.createRealtimeSession(lang);
        if (session.containsKey("error")) {
            log.error("[Khutbah] Session creation failed: {}", session.get("error"));
        } else {
            log.info("[Khutbah] Session created successfully for slug={}", slug);
        }
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{slug}/transcript")
    public ResponseEntity<Void> relayTranscript(
            @PathVariable String slug,
            @RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        String lang = body.getOrDefault("lang", "en");
        if (!text.isBlank()) {
            log.info("[Khutbah] Relay → slug={} lang={} text='{}'",
                slug, lang, text.length() > 60 ? text.substring(0, 60) + "..." : text);
            khutbahService.broadcastTranscript(slug, text, lang);
            log.info("[Khutbah] Broadcast sent → /topic/khutbah/{}", slug);
        } else {
            log.warn("[Khutbah] Empty relay text for slug={} — nothing broadcast", slug);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{slug}/start")
    public ResponseEntity<Void> start(@PathVariable String slug) {
        log.info("[Khutbah] ▶ START for slug={}", slug);
        khutbahService.setKhutbahMode(slug, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{slug}/stop")
    public ResponseEntity<Void> stop(@PathVariable String slug) {
        log.info("[Khutbah] ⏹ STOP for slug={}", slug);
        khutbahService.setKhutbahMode(slug, false);
        return ResponseEntity.ok().build();
    }
}
