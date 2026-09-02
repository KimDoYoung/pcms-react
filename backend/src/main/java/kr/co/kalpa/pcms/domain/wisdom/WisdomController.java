package kr.co.kalpa.pcms.domain.wisdom;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.wisdom.dto.WisdomDto;
import kr.co.kalpa.pcms.domain.wisdom.dto.WisdomSearchDto;
import kr.co.kalpa.pcms.domain.wisdom.service.WisdomService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "Wisdom", description = "격언/명언 관리 API")
@RestController
@RequestMapping("/wisdom")
@Slf4j
@RequiredArgsConstructor
public class WisdomController {

    private final WisdomService wisdomService;

    @Operation(summary = "격언 목록 조회 (페이징, 검색)")
    @GetMapping
    public ResponseEntity<PageResponseDto<WisdomDto>> getList(WisdomSearchDto searchDto) {
        return ResponseEntity.ok(wisdomService.getList(searchDto));
    }

    @Operation(summary = "격언 단건 조회")
    @GetMapping("/{id}")
    public ResponseEntity<WisdomDto> get(@PathVariable String id) {
        return ResponseEntity.ok(wisdomService.get(id));
    }

    @Operation(summary = "격언 등록")
    @PostMapping
    public ResponseEntity<Map<String, String>> register(@RequestBody WisdomDto dto) {
        String id = wisdomService.register(dto);
        return ResponseEntity.ok(Map.of("id", id, "result", "success"));
    }

    @Operation(summary = "격언 수정")
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> modify(@PathVariable String id, @RequestBody WisdomDto dto) {
        dto.setId(id);
        wisdomService.modify(dto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @Operation(summary = "격언 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable String id) {
        wisdomService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @Operation(summary = "등록된 도메인 목록 조회")
    @GetMapping("/domains")
    public ResponseEntity<List<String>> getDomains() {
        return ResponseEntity.ok(wisdomService.getDomains());
    }

    @Operation(summary = "등록된 카테고리 목록 조회 (도메인별 선택 가능)")
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories(@RequestParam(required = false) String domain) {
        return ResponseEntity.ok(wisdomService.getCategories(domain));
    }

    @Operation(summary = "격언 ID 중복 여부 확인")
    @GetMapping("/check-id/{id}")
    public ResponseEntity<Map<String, Boolean>> checkId(@PathVariable String id) {
        boolean exists = wisdomService.existsById(id);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @Operation(summary = "랜덤 격언 조회 (KimsWeb 등 활용)")
    @GetMapping("/random")
    public ResponseEntity<WisdomDto> getRandom(
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String contextTrigger
    ) {
        return ResponseEntity.ok(wisdomService.getRandom(domain, category, contextTrigger));
    }
}
