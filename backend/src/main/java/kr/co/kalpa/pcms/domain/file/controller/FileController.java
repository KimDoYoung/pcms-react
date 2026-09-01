package kr.co.kalpa.pcms.domain.file.controller;

import kr.co.kalpa.pcms.common.config.FileProperties;
import kr.co.kalpa.pcms.domain.file.entity.CmsFile;
import kr.co.kalpa.pcms.domain.file.service.FileMapper;
import kr.co.kalpa.pcms.domain.file.service.FileUploadService;
import kr.co.kalpa.pcms.domain.file.service.PdfService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/files")
@Slf4j
@RequiredArgsConstructor
public class FileController {

    private final FileUploadService fileUploadService;
    private final FileMapper fileMapper;
    private final FileProperties fileProperties;
    private final PdfService pdfService;


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

    // 미디어 파일 이름 변경 (orgFileName만 DB 업데이트, 물리 파일명 UUID 불변)
    @PatchMapping("/{fileId}/rename")
    public ResponseEntity<?> renameFile(@PathVariable Long fileId, @RequestBody Map<String, String> body) {
        String newName = body.get("newName");
        if (newName == null || newName.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("새 파일명은 필수입니다.");
        }
        if (newName.contains("..") || newName.contains("/") || newName.contains("\\")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("잘못된 파일명 형식입니다.");
        }

        CmsFile file = fileMapper.selectFileById(fileId);
        if (file == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("존재하지 않는 파일입니다.");
        }

        // 원본 확장자 보존
        String oldName = file.getOrgFileName();
        String ext = "";
        int dotIdx = oldName.lastIndexOf('.');
        if (dotIdx > 0) ext = oldName.substring(dotIdx);

        // 사용자가 확장자를 입력한 경우 제거 후 원본 확장자 부착
        String baseName = newName.trim();
        int newDot = baseName.lastIndexOf('.');
        if (newDot > 0) {
            String tempExt = baseName.substring(newDot).toLowerCase();
            if (tempExt.equals(ext.toLowerCase())) {
                baseName = baseName.substring(0, newDot);
            }
        }

        String finalName = baseName + ext;
        fileMapper.updateOrgFileName(fileId, finalName);
        return ResponseEntity.ok(Map.of("orgFileName", finalName));
    }

    // 마크다운 ZIP 내보내기
    @PostMapping("/markdown-export")
    public void exportMarkdownZip(@RequestBody Map<String, String> body, HttpServletResponse response) throws IOException {
        String content = body.getOrDefault("content", "");
        String filename = body.getOrDefault("filename", "document");

        // 마크다운에서 /files/{fileId}/download/ 패턴 이미지 URL 추출
        Pattern imgPattern = Pattern.compile("!\\[([^\\]]*)\\]\\(([^)]+)\\)");
        Pattern fileIdPattern = Pattern.compile("/files/(\\d+)/download/");
        Matcher matcher = imgPattern.matcher(content);

        List<long[]> fileIdList = new ArrayList<>();   // [fileId]
        List<String> origUrls = new ArrayList<>();

        while (matcher.find()) {
            String url = matcher.group(2);
            Matcher fidMatcher = fileIdPattern.matcher(url);
            if (fidMatcher.find()) {
                long fid = Long.parseLong(fidMatcher.group(1));
                fileIdList.add(new long[]{fid});
                origUrls.add(url);
            }
        }

        // 마크다운 내 URL을 상대경로로 치환
        String rewrittenContent = content;
        List<String> imageNames = new ArrayList<>();
        for (int i = 0; i < fileIdList.size(); i++) {
            long fid = fileIdList.get(i)[0];
            CmsFile cmsFile = fileMapper.selectFileById(fid);
            if (cmsFile != null) {
                String imgName = cmsFile.getOrgFileName();
                imageNames.add(imgName);
                rewrittenContent = rewrittenContent.replace(origUrls.get(i), "images/" + imgName);
            } else {
                imageNames.add(null);
            }
        }

        // ZIP 응답 설정
        String safeFilename = URLEncoder.encode(filename + ".zip", StandardCharsets.UTF_8).replace("+", "%20");
        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + safeFilename);

        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
            // .md 파일
            ZipEntry mdEntry = new ZipEntry(filename + ".md");
            zos.putNextEntry(mdEntry);
            zos.write(rewrittenContent.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // 이미지 파일들
            for (int i = 0; i < fileIdList.size(); i++) {
                String imgName = imageNames.get(i);
                if (imgName == null) continue;
                long fid = fileIdList.get(i)[0];
                CmsFile cmsFile = fileMapper.selectFileById(fid);
                if (cmsFile == null) continue;

                Path physPath = Paths.get(
                    fileProperties.getUpload().getAttachFilesDir(),
                    cmsFile.getSavedFolder(),
                    cmsFile.getPhysicalFileName()
                );
                File imgFile = physPath.toFile();
                if (!imgFile.exists()) continue;

                ZipEntry imgEntry = new ZipEntry("images/" + imgName);
                zos.putNextEntry(imgEntry);
                try (FileInputStream fis = new FileInputStream(imgFile)) {
                    byte[] buf = new byte[4096];
                    int len;
                    while ((len = fis.read(buf)) > 0) zos.write(buf, 0, len);
                }
                zos.closeEntry();
            }
            zos.flush();
        } catch (IOException e) {
            log.error("markdown-export ZIP 생성 실패: {}", e.getMessage());
        }
    }

    // 마크다운 ZIP 가져오기
    @PostMapping(value = "/markdown-import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importMarkdownZip(@RequestParam("file") MultipartFile zipFile) {
        if (zipFile.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ZIP 파일이 비어있습니다.");
        }

        String uuid = UUID.randomUUID().toString().replace("-", "");
        Path tempDirPath = Paths.get(System.getProperty("java.io.tmpdir"), "md_import_" + uuid);
        File tempDir = tempDirPath.toFile();

        try {
            Files.createDirectories(tempDirPath);
            File savedZip = new File(tempDir, "upload.zip");
            // transferTo 는 Tomcat 구현체에 따라 실패할 수 있으므로 스트림으로 직접 저장
            try (java.io.InputStream is = zipFile.getInputStream();
                 java.io.FileOutputStream fos = new java.io.FileOutputStream(savedZip)) {
                byte[] buf = new byte[8192];
                int len;
                while ((len = is.read(buf)) > 0) fos.write(buf, 0, len);
            }
            unzipFile(savedZip, tempDir);
            unzipFile(savedZip, tempDir);

            // .md 파일 찾기
            String markdownContent = null;
            File mdFile = findFileByExt(tempDir, ".md");
            if (mdFile != null) {
                markdownContent = Files.readString(mdFile.toPath(), StandardCharsets.UTF_8);
            }
            if (markdownContent == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ZIP 안에 .md 파일이 없습니다.");
            }

            // images/ 디렉토리 이미지 업로드 후 URL 치환
            File imagesDir = new File(tempDir, "images");
            if (imagesDir.exists() && imagesDir.isDirectory()) {
                File[] images = imagesDir.listFiles();
                if (images != null) {
                    for (File img : images) {
                        if (!img.isFile()) continue;
                        try {
                            // uploadEditorImage는 MultipartFile 인터페이스를 받으므로 FileSystemResource로 래핑
                            String mimeType = Files.probeContentType(img.toPath());
                            if (mimeType == null) mimeType = "application/octet-stream";
                            String uploadedUrl = fileUploadService.uploadEditorImageFromFile(img, mimeType);
                            markdownContent = markdownContent.replace("images/" + img.getName(), uploadedUrl);
                        } catch (Exception e) {
                            log.warn("이미지 업로드 실패 ({}): {}", img.getName(), e.getMessage());
                        }
                    }
                }
            }

            return ResponseEntity.ok(Map.of("content", markdownContent));
        } catch (Exception e) {
            log.error("markdown-import 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ZIP 처리 중 오류: " + e.getMessage());
        } finally {
            deleteDirectory(tempDir);
        }
    }

    // HTML to PDF 변환 (Gotenberg 연동)
    @PostMapping("/pdf-convert")
    public ResponseEntity<?> convertToPdf(@RequestBody Map<String, String> body) {
        String html = body.get("html");
        String filename = body.getOrDefault("filename", "document.pdf");

        if (html == null || html.isBlank()) {
            return ResponseEntity.badRequest().body("HTML 내용이 비어있습니다.");
        }

        if (!filename.toLowerCase().endsWith(".pdf")) {
            filename += ".pdf";
        }

        try {
            byte[] pdfBytes = pdfService.convertHtmlToPdf(html);
            String encodedName = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("PDF 변환 요청 실패: filename={}, error={}", filename, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("PDF 변환 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 파일 업로드 기반 PDF 변환 (Office, HTML, Markdown, Text, Image 등)
    @PostMapping(value = "/pdf-convert/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> convertUploadedFileToPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "landscape", defaultValue = "false") boolean landscape) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("업로드된 파일이 비어있습니다.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String baseName = originalName;
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx > 0) {
            baseName = originalName.substring(0, dotIdx);
        }
        String targetPdfName = baseName + ".pdf";

        try {
            byte[] pdfBytes = pdfService.convertFileToPdf(file, landscape);
            String encodedName = URLEncoder.encode(targetPdfName, StandardCharsets.UTF_8).replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("파일 PDF 변환 요청 실패: filename={}, error={}", originalName, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("파일 PDF 변환 중 오류가 발생했습니다: " + e.getMessage());
        }
    }



    private void unzipFile(File zipFile, File destDir) throws IOException {
        try (java.util.zip.ZipFile zf = new java.util.zip.ZipFile(zipFile)) {
            java.util.Enumeration<? extends ZipEntry> entries = zf.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                File outFile = new File(destDir, entry.getName());
                // 경로 조작 방지
                if (!outFile.getCanonicalPath().startsWith(destDir.getCanonicalPath())) continue;
                if (entry.isDirectory()) {
                    outFile.mkdirs();
                } else {
                    outFile.getParentFile().mkdirs();
                    try (java.io.InputStream is = zf.getInputStream(entry);
                         java.io.FileOutputStream fos = new java.io.FileOutputStream(outFile)) {
                        byte[] buf = new byte[4096];
                        int len;
                        while ((len = is.read(buf)) > 0) fos.write(buf, 0, len);
                    }
                }
            }
        }
    }

    private File findFileByExt(File dir, String ext) {
        File[] files = dir.listFiles();
        if (files == null) return null;
        for (File f : files) {
            if (f.isFile() && f.getName().toLowerCase().endsWith(ext)) return f;
            if (f.isDirectory()) {
                File found = findFileByExt(f, ext);
                if (found != null) return found;
            }
        }
        return null;
    }

    private void deleteDirectory(File dir) {
        if (dir == null || !dir.exists()) return;
        File[] files = dir.listFiles();
        if (files != null) for (File f : files) {
            if (f.isDirectory()) deleteDirectory(f);
            else f.delete();
        }
        dir.delete();
    }
}
