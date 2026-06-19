package kr.co.kalpa.pcms.domain.dailylog;

import kr.co.kalpa.pcms.domain.dailylog.dto.DailyLogDto;
import kr.co.kalpa.pcms.domain.dailylog.service.DailyLogService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/daily-logs")
@Slf4j
@RequiredArgsConstructor
public class DailyLogController {

    private final DailyLogService dailyLogService;

    @PostMapping
    public ResponseEntity<Map<String, Long>> register(@RequestBody @Valid DailyLogDto dailyLogDto) {
        log.info("register dailyLog: {}", dailyLogDto);
        Long id = dailyLogService.register(dailyLogDto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> modify(@PathVariable Long id, @RequestBody @Valid DailyLogDto dailyLogDto) {
        log.info("modify dailyLog: {}", dailyLogDto);
        dailyLogDto.setId(id);
        dailyLogService.modify(dailyLogDto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        log.info("remove dailyLog: {}", id);
        dailyLogService.remove(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/range/{startYmd}/{endYmd}")
    public ResponseEntity<List<DailyLogDto>> getByRange(@PathVariable String startYmd, @PathVariable String endYmd) {
        return ResponseEntity.ok(dailyLogService.getByRange(startYmd, endYmd));
    }
}
