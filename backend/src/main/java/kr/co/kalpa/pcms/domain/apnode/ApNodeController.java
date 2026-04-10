package kr.co.kalpa.pcms.domain.apnode;
import kr.co.kalpa.pcms.domain.apnode.service.ApNodeService;
import kr.co.kalpa.pcms.domain.apnode.dto.ApNodeDto;
import kr.co.kalpa.pcms.domain.apnode.dto.DirectoryCreateDto;
import kr.co.kalpa.pcms.domain.apnode.dto.FileDownloadDto;
import kr.co.kalpa.pcms.domain.apnode.dto.LinkCreateDto;
import kr.co.kalpa.pcms.domain.apnode.dto.NodeMoveDto;
import kr.co.kalpa.pcms.domain.apnode.dto.NodeRenameDto;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/apnode")
@Slf4j
@RequiredArgsConstructor
public class ApNodeController {

    private final ApNodeService apNodeService;

    @Value("${apnode.file.base-dir}")
    private String apnodeBaseDir;

    @GetMapping(produces = "application/json")
    public ResponseEntity<List<ApNodeDto>> listRoots() {
        return ResponseEntity.ok(apNodeService.listRoots());
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<ApNodeDto>> listChildren(@PathVariable String id) {
        return ResponseEntity.ok(apNodeService.listChildren(id));
    }

    @GetMapping("/{id}/path")
    public ResponseEntity<List<ApNodeDto>> getPath(@PathVariable String id) {
        return ResponseEntity.ok(apNodeService.getPath(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApNodeDto> getNode(@PathVariable String id) {
        return ResponseEntity.ok(apNodeService.getNode(id));
    }

    @PostMapping("/directories")
    public ResponseEntity<ApNodeDto> createDirectory(@Valid @RequestBody DirectoryCreateDto dto) {
        log.info("createDirectory: {}", dto.getName());
        return ResponseEntity.ok(apNodeService.createDirectory(dto));
    }

    @PostMapping("/files")
    public ResponseEntity<ApNodeDto> uploadFile(
            @RequestParam(required = false) String parentId,
            @RequestParam("file") MultipartFile file) throws IOException {
        log.info("uploadFile: {}, parentId={}", file.getOriginalFilename(), parentId);
        return ResponseEntity.ok(apNodeService.uploadFile(parentId, file));
    }

    @PostMapping("/links")
    public ResponseEntity<ApNodeDto> createLink(@Valid @RequestBody LinkCreateDto dto) {
        log.info("createLink: {} → {}", dto.getName(), dto.getTargetId());
        return ResponseEntity.ok(apNodeService.createLink(dto));
    }

    @PutMapping("/{id}/rename")
    public ResponseEntity<ApNodeDto> rename(
            @PathVariable String id,
            @Valid @RequestBody NodeRenameDto dto) {
        log.info("rename: {} → {}", id, dto.getName());
        return ResponseEntity.ok(apNodeService.rename(id, dto));
    }

    @PutMapping("/{id}/move")
    public ResponseEntity<ApNodeDto> move(
            @PathVariable String id,
            @RequestBody NodeMoveDto dto) {
        log.info("move: {} → parentId={}", id, dto.getTargetParentId());
        return ResponseEntity.ok(apNodeService.move(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id) {
        log.info("delete: {}", id);
        apNodeService.delete(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable String id) {
        FileDownloadDto info = apNodeService.getFileForDownload(id);
        Resource resource = new FileSystemResource(Paths.get(apnodeBaseDir, info.getSavedPath()));

        String encodedName = URLEncoder.encode(info.getOriginalName(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        String contentType = info.getContentType() != null ? info.getContentType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .body(resource);
    }
}
