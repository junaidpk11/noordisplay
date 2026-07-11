package com.noordisplay.repository;

import com.noordisplay.entity.PrayerTimes;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface PrayerTimesRepository extends JpaRepository<PrayerTimes, UUID> {
    Optional<PrayerTimes> findByMasjidIdAndPrayerDate(UUID masjidId, LocalDate date);
}
