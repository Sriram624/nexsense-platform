package com.nexsense.reading;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ReadingRepository extends JpaRepository<Reading, Long> {
    List<Reading> findTop100ByDevice_IdOrderByRecordedAtDesc(String deviceId);
}
