package com.noordisplay.service;

import com.noordisplay.entity.Masjid;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentSchedulerService {

    private final MasjidRepository masjidRepository;
    private final ScheduledSlotRepository slotRepository;
    private final SimpMessagingTemplate messaging;
    private final MasjidTimeService masjidTimeService;

    @Scheduled(fixedRate = 60_000)
    public void tick() {
        masjidRepository.findAll().forEach(masjid -> {
            LocalTime now = masjidTimeService.localTime(masjid);
            LocalDate today = masjidTimeService.localDate(masjid);
            int dayOfWeek = today.getDayOfWeek().getValue() % 7;

            List<ScheduledSlot> active = findActive(masjid, now, today, dayOfWeek);
            List<Map<String, Object>> payload = active.stream().map(slot -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", slot.getId().toString());
                item.put("name", slot.getName());
                item.put("type", slot.getSlotType());
                item.put("message", slot.getMessage());
                item.put("imageUrl", slot.getImageUrl());
                return item;
            }).toList();

            messaging.convertAndSend(
                "/topic/schedule/" + masjid.getSlug(),
                Map.of("activeSlots", payload, "timestamp", now.toString())
            );
        });
    }

    public List<ScheduledSlot> getActiveNow(UUID masjidId) {
        Masjid masjid = masjidRepository.findById(masjidId)
            .orElseThrow(() -> new RuntimeException("Masjid not found: " + masjidId));
        LocalTime now = masjidTimeService.localTime(masjid);
        LocalDate today = masjidTimeService.localDate(masjid);
        int dayOfWeek = today.getDayOfWeek().getValue() % 7;
        return findActive(masjid, now, today, dayOfWeek);
    }

    private List<ScheduledSlot> findActive(
        Masjid masjid,
        LocalTime now,
        LocalDate today,
        int dayOfWeek
    ) {
        return slotRepository.findActiveNow(masjid.getId(), now, today)
            .stream()
            .filter(slot -> slot.getRepeatDays() != null)
            .filter(slot -> slot.getRepeatDays().contains(String.valueOf(dayOfWeek)))
            .toList();
    }
}
