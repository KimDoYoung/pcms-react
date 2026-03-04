package kr.co.kalpa.pcms.controller;

import jakarta.validation.Valid;
import kr.co.kalpa.pcms.dto.JangbiDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.jangbi.JangbiSearchDto;
import kr.co.kalpa.pcms.service.JangbiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/jangbi")
@Slf4j
@RequiredArgsConstructor
public class JangbiController {

    private final JangbiService jangbiService;

    @PostMapping
    public ResponseEntity<Map<String, Long>> register(@Valid @RequestBody JangbiDto jangbiDto) {
        log.info("register jangbi: {}", jangbiDto);
        Long id = jangbiService.register(jangbiDto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JangbiDto> get(@PathVariable Long id) {
        log.info("get jangbi: {}", id);
        return ResponseEntity.ok(jangbiService.get(id));
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> modify(@Valid @RequestBody JangbiDto jangbiDto) {
        log.info("modify jangbi: {}", jangbiDto);
        jangbiService.modify(jangbiDto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable Long id) {
        log.info("remove jangbi: {}", id);
        jangbiService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @GetMapping
    public ResponseEntity<PageResponseDto<JangbiDto>> getList(JangbiSearchDto searchDto) {
        log.info("getList jangbi: {}", searchDto);
        return ResponseEntity.ok(jangbiService.getList(searchDto));
    }
}
