package kr.co.kalpa.pcms.domain.file.controller;

import kr.co.kalpa.pcms.common.config.FileProperties;
import kr.co.kalpa.pcms.domain.file.entity.CmsFile;
import kr.co.kalpa.pcms.domain.file.service.FileMapper;
import kr.co.kalpa.pcms.domain.file.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/files")
@Slf4j
@RequiredArgsConstructor
public class FileController {

    private final FileUploadService fileUploadService;
    private final FileMapper fileMapper;
    private final FileProperties fileProperties;

    @PostMapping(value = "/editor-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadEditorImage(@RequestParam("file") MultipartFile file) {
        String url = fileUploadService.uploadEditorImage(file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/{fileId}/download/{filename:.+}")
    public ResponseEntity<Resource> downloadWithName(@PathVariable Long fileId, @PathVariable String filename) {
        return download(fileId);
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long fileId) {
        CmsFile file = fileMapper.selectFileById(fileId);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(
            Paths.get(fileProperties.getUpload().getAttachFilesDir(), file.getSavedFolder(), file.getPhysicalFileName())
        );
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String encodedName = URLEncoder.encode(file.getOrgFileName(), StandardCharsets.UTF_8).replace("+", "%20");
        String contentType = file.getMimeType() != null ? file.getMimeType() : "application/octet-stream";

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedName)
            .body(resource);
    }
}
