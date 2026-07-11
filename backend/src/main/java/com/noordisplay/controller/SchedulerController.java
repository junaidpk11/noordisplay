package com.noordisplay.controller;

import com.noordisplay.entity.Masjid;
import com.noordisplay.entity.ScheduledSlot;
import com.noordisplay.repository.MasjidRepository;
import com.noordisplay.repository.ScheduledSlotRepository;
import com.noordisplay.service.ContentSchedulerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/scheduler")
@RequiredArgsConstructor
public class SchedulerController {

    private final ScheduledSlotRepository slotRepository;
    private final MasjidRepository        masjidRepository;
    private final ContentSchedulerService schedulerService;

    @GetMapping("/masjid/{masjidId}")
    public List<ScheduledSlot> getAll(@PathVariable UUID masjidId) {
        return slotRepository.findByMasjidIdOrderBySortOrderAscCreatedAtAsc(masjidId);
    }

    @GetMapping("/masjid/{masjidId}/active-now")
    public List<ScheduledSlot> getActiveNow(@PathVariable UUID masjidId) {
        return schedulerService.getActiveNow(masjidId);
    }

    @PostMapping("/masjid/{masjidId}")
    public ResponseEntity<ScheduledSlot> create(
            @PathVariable UUID masjidId,
            @RequestBody ScheduledSlot payload) {
        Masjid masjid = masjidRepository.findById(masjidId)
            .orElseThrow(() -> new RuntimeException("Masjid not found"));
        payload.setMasjid(masjid);
        payload.setCreatedAt(Instant.now());
        if (payload.getActive() == null) payload.setActive(true);
        if (payload.getSortOrder() == null) payload.setSortOrder(0);
        return ResponseEntity.ok(slotRepository.save(payload));
    }

    @PutMapping("/{slotId}")
    public ResponseEntity<ScheduledSlot> update(
            @PathVariable UUID slotId,
            @RequestBody ScheduledSlot payload) {
        return slotRepository.findById(slotId).map(s -> {
            s.setName(payload.getName());
            s.setSlotType(payload.getSlotType());
            s.setStartTime(payload.getStartTime());
            s.setEndTime(payload.getEndTime());
            s.setRepeatDays(payload.getRepeatDays());
            s.setDateFrom(payload.getDateFrom());
            s.setDateUntil(payload.getDateUntil());
            s.setMessage(payload.getMessage());
            s.setImageUrl(payload.getImageUrl());
            s.setActive(payload.getActive());
            s.setSortOrder(payload.getSortOrder());
            return ResponseEntity.ok(slotRepository.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{slotId}/toggle")
    public ResponseEntity<ScheduledSlot> toggle(@PathVariable UUID slotId) {
        return slotRepository.findById(slotId).map(s -> {
            s.setActive(!Boolean.TRUE.equals(s.getActive()));
            return ResponseEntity.ok(slotRepository.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{slotId}")
    public ResponseEntity<Void> delete(@PathVariable UUID slotId) {
        slotRepository.deleteById(slotId);
        return ResponseEntity.noContent().build();
    }
}
