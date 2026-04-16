package kr.co.kalpa.pcms.domain.jangbi;
import kr.co.kalpa.pcms.domain.jangbi.service.JangbiService;
import kr.co.kalpa.pcms.domain.jangbi.dto.JangbiDto;
import kr.co.kalpa.pcms.domain.jangbi.dto.JangbiSearchDto;

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
@RequestMapping("/jangbi")
@Slf4j
@RequiredArgsConstructor
public class JangbiController {

    private final JangbiService jangbiService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Long>> register(
            @RequestPart("jangbi") @Valid JangbiDto jangbiDto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        log.info("register jangbi: {}", jangbiDto);
        Long id = jangbiService.register(jangbiDto, files);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<JangbiDto> get(@PathVariable Long id) {
        log.info("get jangbi: {}", id);
        return ResponseEntity.ok(jangbiService.get(id));
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> modify(
            @RequestPart("jangbi") @Valid JangbiDto jangbiDto,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        log.info("modify jangbi: {}", jangbiDto);
        jangbiService.modify(jangbiDto, files);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable Long id) {
        log.info("remove jangbi: {}", id);
        jangbiService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @GetMapping(produces = "application/json")
    public ResponseEntity<PageResponseDto<JangbiDto>> getList(JangbiSearchDto searchDto) {
        log.info("getList jangbi: {}", searchDto);
        return ResponseEntity.ok(jangbiService.getList(searchDto));
    }
}
