package kr.co.kalpa.pcms.domain.diary;
import kr.co.kalpa.pcms.domain.diary.service.DiaryService;
import kr.co.kalpa.pcms.domain.diary.dto.DiaryDto;
import kr.co.kalpa.pcms.domain.diary.dto.DiarySearchDto;

import jakarta.validation.Valid;
import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/diary")
@Slf4j
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Long>> register(
            @RequestPart("diary") @Valid DiaryDto diaryDto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        log.info("register diary: {}", diaryDto);
        Long id = diaryService.register(diaryDto, files);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<DiaryDto> get(@PathVariable Long id) {
        log.info("get diary: {}", id);
        return ResponseEntity.ok(diaryService.get(id));
    }

    @GetMapping("/date/{ymd}")
    public ResponseEntity<DiaryDto> getByYmd(@PathVariable String ymd) {
        log.info("get diary by ymd: {}", ymd);
        DiaryDto diaryDto = diaryService.getByYmd(ymd);
        if (diaryDto != null) {
            return ResponseEntity.ok(diaryDto);
        } else {
            return ResponseEntity.noContent().build();
        }
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> modify(
            @RequestPart("diary") @Valid DiaryDto diaryDto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        log.info("modify diary: {}", diaryDto);
        diaryService.modify(diaryDto, files);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable Long id) {
        log.info("remove diary: {}", id);
        diaryService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @GetMapping(produces = "application/json")
    public ResponseEntity<PageResponseDto<DiaryDto>> getList(DiarySearchDto searchDto) {
        log.info("getList diary: {}", searchDto);
        return ResponseEntity.ok(diaryService.getList(searchDto));
    }
}
