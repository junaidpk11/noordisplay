package com.noordisplay.repository;

import com.noordisplay.entity.ScheduledSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface ScheduledSlotRepository extends JpaRepository<ScheduledSlot, UUID> {

    List<ScheduledSlot> findByMasjidIdOrderBySortOrderAscCreatedAtAsc(UUID masjidId);

    /** Find slots that are active right now for a given masjid */
    @Query("""
        SELECT s FROM ScheduledSlot s
        WHERE s.masjid.id = :masjidId
          AND s.active = true
          AND s.startTime <= :now
          AND s.endTime   >  :now
          AND (s.dateFrom  IS NULL OR s.dateFrom  <= :today)
          AND (s.dateUntil IS NULL OR s.dateUntil >= :today)
    """)
    List<ScheduledSlot> findActiveNow(UUID masjidId, LocalTime now, LocalDate today);
}
