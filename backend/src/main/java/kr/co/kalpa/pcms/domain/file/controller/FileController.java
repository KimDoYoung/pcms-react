package kr.co.kalpa.pcms.domain.file.controller;

import kr.co.kalpa.pcms.domain.file.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/files")
@Slf4j
@RequiredArgsConstructor
public class FileController {

    private final FileUploadService fileUploadService;

    @PostMapping(value = "/editor-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadEditorImage(@RequestParam("file") MultipartFile file) {
        log.info("🚀 [FileController] 단일 에디터 이미지 업로드 요청: file={}, size={}", file.getOriginalFilename(), file.getSize());
        String url = fileUploadService.uploadEditorImage(file);
        log.info("✅ [FileController] 단일 에디터 이미지 업로드 완료, 반환 URL: {}", url);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
