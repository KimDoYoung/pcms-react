package kr.co.kalpa.pcms.domain.system;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.kalpa.pcms.domain.calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SystemController {

    private final CalendarService calendarService;
    private final ObjectMapper objectMapper;

    @Value("${spring.application.version:0.0.1}")
    private String version;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "ok", "version", version));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory() {
        try {
            ClassPathResource resource = new ClassPathResource("data/history.json");
            if (!resource.exists()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            List<Map<String, Object>> history = objectMapper.readValue(
                    resource.getInputStream(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );
            return ResponseEntity.ok(history);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
