package kr.co.kalpa.pcms.domain.system;

import kr.co.kalpa.pcms.domain.calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SystemController {

    private final CalendarService calendarService;

    @Value("${spring.application.version:0.0.1}")
    private String version;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "ok", "version", version));
    }
}
