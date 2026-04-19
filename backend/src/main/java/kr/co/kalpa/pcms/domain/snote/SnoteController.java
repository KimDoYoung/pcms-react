package kr.co.kalpa.pcms.domain.snote;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.snote.dto.SnoteDto;
import kr.co.kalpa.pcms.domain.snote.dto.SnoteSearchDto;
import kr.co.kalpa.pcms.domain.snote.service.SnoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/snote")
@Slf4j
@RequiredArgsConstructor
public class SnoteController {

    private final SnoteService snoteService;

    @GetMapping
    public ResponseEntity<PageResponseDto<SnoteDto>> getList(SnoteSearchDto searchDto) {
        return ResponseEntity.ok(snoteService.getList(searchDto));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<SnoteDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(snoteService.get(id));
    }

    /**
     * passhint.txt에서 랜덤 hint:password 쌍을 반환한다.
     * 비밀번호를 따로 설정하지 않을 때 클라이언트가 기본값으로 사용한다.
     */
    @GetMapping("/random-hint")
    public ResponseEntity<Map<String, String>> randomHint() throws IOException {
        ClassPathResource resource = new ClassPathResource("data/passhint.txt");
        List<String> lines;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            lines = reader.lines()
                    .filter(l -> l.contains(":") && !l.startsWith("#"))
                    .collect(Collectors.toList());
        }
        if (lines.isEmpty()) {
            return ResponseEntity.ok(Map.of("hint", "기본힌트", "password", "defaultpass"));
        }
        String line = lines.get(new Random().nextInt(lines.size()));
        String[] parts = line.split(":", 2);
        return ResponseEntity.ok(Map.of("hint", parts[0].trim(), "password", parts[1].trim()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Long>> register(@RequestBody SnoteDto dto) {
        Long id = snoteService.register(dto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> modify(@PathVariable Long id, @RequestBody SnoteDto dto) {
        dto.setId(id);
        snoteService.modify(dto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable Long id) {
        snoteService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }
}
