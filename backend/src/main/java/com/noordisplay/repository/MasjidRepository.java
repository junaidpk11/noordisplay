package com.noordisplay.repository;

import com.noordisplay.entity.Masjid;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface MasjidRepository extends JpaRepository<Masjid, UUID> {
    Optional<Masjid> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
