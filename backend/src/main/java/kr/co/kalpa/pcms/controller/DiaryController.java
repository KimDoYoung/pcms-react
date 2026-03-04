package kr.co.kalpa.pcms.controller;

import kr.co.kalpa.pcms.dto.DiaryDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.diary.DiarySearchDto;
import kr.co.kalpa.pcms.service.DiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/diary")
@Slf4j
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;

    @PostMapping
    public ResponseEntity<Map<String, Long>> register(@Valid @RequestBody DiaryDto diaryDto) {
        log.info("register diary: {}", diaryDto);
        Long id = diaryService.register(diaryDto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiaryDto> get(@PathVariable("id") Long id) {
        log.info("get diary: {}", id);
        DiaryDto diaryDto = diaryService.get(id);
        return ResponseEntity.ok(diaryDto);
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> modify(@Valid @RequestBody DiaryDto diaryDto) {
        log.info("modify diary: {}", diaryDto);
        diaryService.modify(diaryDto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable("id") Long id) {
        log.info("remove diary: {}", id);
        diaryService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @GetMapping
    public ResponseEntity<PageResponseDto<DiaryDto>> getList(DiarySearchDto searchDto) {
        log.info("getList diary: {}", searchDto);
        PageResponseDto<DiaryDto> response = diaryService.getList(searchDto);
        return ResponseEntity.ok(response);
    }
}