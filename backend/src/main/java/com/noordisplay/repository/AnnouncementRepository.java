package com.noordisplay.repository;

import com.noordisplay.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {
    List<Announcement> findByMasjidIdOrderBySortOrderAsc(UUID masjidId);

    @Query("""
        SELECT a FROM Announcement a
        WHERE a.masjid.id = :masjidId
          AND a.active = true
          AND (a.startsAt IS NULL OR a.startsAt <= :today)
          AND (a.endsAt   IS NULL OR a.endsAt   >= :today)
        ORDER BY a.sortOrder ASC
    """)
    List<Announcement> findActiveForToday(UUID masjidId, LocalDate today);
}
