package com.noordisplay.controller;

import com.noordisplay.service.AladhanService;
import com.noordisplay.service.DisplayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/display")
@RequiredArgsConstructor
public class DisplayController {

    private final DisplayService displayService;
    private final AladhanService aladhanService;

    /** Public endpoint — the Next.js display page polls this on load */
    @GetMapping("/{slug}")
    public ResponseEntity<Map<String, Object>> getDisplayData(@PathVariable String slug) {
        return ResponseEntity.ok(displayService.getDisplayData(slug));
    }

    /** Admin triggers a manual prayer time sync */
    @PostMapping("/{slug}/sync-prayers")
    public ResponseEntity<Void> syncPrayers(@PathVariable String slug) {
        var masjid = displayService.getMasjid(slug);
        aladhanService.syncMasjid(masjid);
        return ResponseEntity.ok().build();
    }
}
