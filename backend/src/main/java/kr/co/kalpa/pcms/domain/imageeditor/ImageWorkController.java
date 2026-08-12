package kr.co.kalpa.pcms.domain.imageeditor;

import kr.co.kalpa.pcms.domain.imageeditor.dto.ImageWorkListDto;
import kr.co.kalpa.pcms.domain.imageeditor.dto.ImageWorkUpsertDto;
import kr.co.kalpa.pcms.domain.imageeditor.service.ImageWorkService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/image-work")
@Slf4j
@RequiredArgsConstructor
public class ImageWorkController {

    private final ImageWorkService imageWorkService;

    @GetMapping
    public ResponseEntity<ImageWorkListDto> getList() {
        return ResponseEntity.ok(imageWorkService.getList());
    }

    @PostMapping
    public ResponseEntity<Map<String, Long>> upsert(@RequestBody @Valid ImageWorkUpsertDto dto) {
        log.info("upsert image-work: id={}, title={}", dto.getId(), dto.getTitle());
        Long id = imageWorkService.upsert(dto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        log.info("remove image-work: id={}", id);
        imageWorkService.remove(id);
        return ResponseEntity.ok().build();
    }
}
