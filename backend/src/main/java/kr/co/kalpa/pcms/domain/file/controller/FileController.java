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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.List;
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

    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file) {
        try {
            CmsFile saved = fileUploadService.uploadMedia(file);
            return ResponseEntity.ok(Map.of(
                "fileId", saved.getFileId(),
                "orgFileName", saved.getOrgFileName(),
                "mimeType", saved.getMimeType() != null ? saved.getMimeType() : "",
                "fileSize", saved.getFileSize()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/media")
    public ResponseEntity<List<CmsFile>> getMediaFiles(@RequestParam("type") String type) {
        String prefix = "audio".equalsIgnoreCase(type) ? "audio/" : "video/";
        return ResponseEntity.ok(fileUploadService.getMediaFiles(prefix));
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId) {
        fileUploadService.deleteAttachments(List.of(fileId));
        return ResponseEntity.noContent().build();
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
