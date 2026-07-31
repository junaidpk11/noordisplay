package com.noordisplay.service;

import com.noordisplay.entity.ScheduledSlot;
import com.noordisplay.repository.MasjidRepository;
import com.noordisplay.repository.ScheduledSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentSchedulerService {

    private final MasjidRepository       masjidRepository;
    private final ScheduledSlotRepository slotRepository;
    private final SimpMessagingTemplate   messaging;

    /**
     * Runs every 60 seconds.
     * For each masjid, finds all currently-active slots and broadcasts them
     * to /topic/schedule/{slug} so connected displays can react immediately.
     */
    @Scheduled(fixedRate = 60_000)
    public void tick() {
        LocalTime now   = LocalTime.now();
        LocalDate today = LocalDate.now();
        int dayOfWeek   = today.getDayOfWeek().getValue() % 7; // 0=Sun … 6=Sat

        masjidRepository.findAll().forEach(masjid -> {
            List<ScheduledSlot> active = slotRepository
                .findActiveNow(masjid.getId(), now, today)
                .stream()
                .filter(s -> s.getRepeatDays().contains(String.valueOf(dayOfWeek)))
                .toList();

            List<Map<String, Object>> payload = active.stream().map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id",       s.getId().toString());
                m.put("name",     s.getName());
                m.put("type",     s.getSlotType());
                m.put("message",  s.getMessage());
                m.put("imageUrl", s.getImageUrl());
                return m;
            }).toList();

            messaging.convertAndSend(
                "/topic/schedule/" + masjid.getSlug(),
                Map.of("activeSlots", payload, "timestamp", now.toString())
            );
        });
    }

    /** Called by the REST API to get current active slots for a masjid. */
    public List<ScheduledSlot> getActiveNow(UUID masjidId) {
        LocalTime now   = LocalTime.now();
        LocalDate today = LocalDate.now();
        int dayOfWeek   = today.getDayOfWeek().getValue() % 7;
        return slotRepository.findActiveNow(masjidId, now, today)
            .stream()
            .filter(s -> s.getRepeatDays().contains(String.valueOf(dayOfWeek)))
            .toList();
    }
}
