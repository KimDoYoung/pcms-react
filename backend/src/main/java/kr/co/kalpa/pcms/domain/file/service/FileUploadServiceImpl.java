package kr.co.kalpa.pcms.domain.file.service;
import kr.co.kalpa.pcms.domain.file.entity.FileMatch;
import kr.co.kalpa.pcms.domain.file.entity.CmsFile;
import kr.co.kalpa.pcms.domain.file.dto.AttachmentDto;

import kr.co.kalpa.pcms.common.config.FileProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadServiceImpl implements FileUploadService {

    private static final Pattern BASE64_IMG_PATTERN =
            Pattern.compile("src=\"(data:([^;\"]+);base64,([^\"]+))\"");

    private final FileProperties fileProperties;
    private final FileMapper fileMapper;

    @Override
    public ProcessResult processEditorImages(String content) {
        if (content == null || content.isBlank()) {
            return new ProcessResult(content, Collections.emptyList());
        }

        List<Long> fileIds = new ArrayList<>();
        StringBuffer sb = new StringBuffer();
        Matcher matcher = BASE64_IMG_PATTERN.matcher(content);

        while (matcher.find()) {
            String mimeType = matcher.group(2).trim();
            String base64Data = matcher.group(3).replaceAll("\\s+", "");

            String ext = mimeToExt(mimeType);
            String physicalFileName = UUID.randomUUID().toString().replace("-", "") + "." + ext;
            String folderPath = dailyFolderPath();

            try {
                Path dir = Paths.get(fileProperties.getUpload().getEditorImagesDir(), folderPath);
                Files.createDirectories(dir);
                byte[] bytes = Base64.getDecoder().decode(base64Data);
                Files.write(dir.resolve(physicalFileName), bytes);

                CmsFile cmsFile = CmsFile.builder()
                        .savedFolder(folderPath)
                        .orgFileName("editor-image." + ext)
                        .physicalFileName(physicalFileName)
                        .fileSize(bytes.length)
                        .mimeType(mimeType)
                        .build();
                fileMapper.insertFile(cmsFile);
                fileIds.add(cmsFile.getFileId());

                String url = buildImageUrl(folderPath, physicalFileName);
                matcher.appendReplacement(sb, Matcher.quoteReplacement("src=\"" + url + "\""));
                log.debug("editor image saved: {}/{}", folderPath, physicalFileName);
            } catch (IOException e) {
                throw new UncheckedIOException("에디터 이미지 저장 실패: " + physicalFileName, e);
            }
        }
        matcher.appendTail(sb);

        return new ProcessResult(sb.toString(), fileIds);
    }
    @Override
    public String uploadEditorImage(MultipartFile file) {
        String mimeType = file.getContentType();
        String ext = mimeToExt(mimeType != null ? mimeType : "");
        String physicalFileName = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        String folderPath = dailyFolderPath();

        log.info("➡️ [FileUploadService] 추출된 확장자: {}, 물리 파일명: {}", ext, physicalFileName);

        try {
            Path dir = Paths.get(fileProperties.getUpload().getEditorImagesDir(), folderPath);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(physicalFileName));

            CmsFile cmsFile = CmsFile.builder()
                    .savedFolder(folderPath)
                    .orgFileName("editor-image." + ext)
                    .physicalFileName(physicalFileName)
                    .fileSize(file.getSize())
                    .mimeType(mimeType)
                    .build();
            fileMapper.insertFile(cmsFile);
            
            String finalUrl = buildImageUrl(folderPath, physicalFileName);
            log.info("✅ [FileUploadService] DB CmsFile 저장 성공, 최종 URL: {}", finalUrl);
            return finalUrl;
        } catch (IOException e) {
            log.error("❌ [FileUploadService] 물리 파일 저장 중 오류 발생!", e);
            throw new UncheckedIOException("에디터 단일 이미지 업로드 실패", e);
        }
    }
    @Override
    public Long saveAttachment(MultipartFile file) {
        String orgName = StringUtils.hasText(file.getOriginalFilename())
                ? file.getOriginalFilename() : "attachment";
        String ext = StringUtils.getFilenameExtension(orgName);
        String physicalFileName = UUID.randomUUID().toString().replace("-", "") + (ext != null ? "." + ext : "");
        String folderPath = dailyFolderPath();

        try {
            Path dir = Paths.get(fileProperties.getUpload().getAttachFilesDir(), folderPath);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(physicalFileName));

            CmsFile cmsFile = CmsFile.builder()
                    .savedFolder(folderPath)
                    .orgFileName(orgName)
                    .physicalFileName(physicalFileName)
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .build();
            fileMapper.insertFile(cmsFile);
            log.debug("attachment saved: {}/{}", folderPath, physicalFileName);
            return cmsFile.getFileId();
        } catch (IOException e) {
            throw new UncheckedIOException("첨부파일 저장 실패: " + orgName, e);
        }
    }

    @Override
    public void linkFiles(String tableName, Long targetId, List<Long> fileIds, String fileType) {
        for (Long fileId : fileIds) {
            fileMapper.insertFileMatch(FileMatch.builder()
                    .tableName(tableName)
                    .targetId(targetId)
                    .fileId(fileId)
                    .fileType(fileType)
                    .build());
        }
    }

    @Override
    public List<AttachmentDto> getAttachments(String tableName, Long targetId) {
        List<FileMatch> matches = fileMapper.selectFileMatchByTarget(tableName, targetId, "attachment");
        if (matches.isEmpty()) return List.of();

        List<Long> fileIds = matches.stream().map(FileMatch::getFileId).toList();
        return fileMapper.selectFilesByIds(fileIds).stream()
                .map(f -> AttachmentDto.builder()
                        .fileId(f.getFileId())
                        .orgFileName(f.getOrgFileName())
                        .fileSize(f.getFileSize())
                        .mimeType(f.getMimeType())
                        .build())
                .toList();
    }

    @Override
    public void deleteAttachments(List<Long> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) return;

        List<CmsFile> files = fileMapper.selectFilesByIds(fileIds);
        fileMapper.deleteFileMatchByFileIds(fileIds);
        fileMapper.deleteFilesByIds(fileIds);

        String attachDir = fileProperties.getUpload().getAttachFilesDir();
        for (CmsFile file : files) {
            Path filePath = Paths.get(attachDir, file.getSavedFolder(), file.getPhysicalFileName());
            try {
                Files.deleteIfExists(filePath);
                log.debug("attachment deleted: {}", filePath);
            } catch (IOException e) {
                log.warn("물리 파일 삭제 실패: {}", filePath, e);
            }
        }
    }

    private String dailyFolderPath() {
        LocalDate now = LocalDate.now();
        return String.format("%04d/%02d/%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
    }

    private String buildImageUrl(String folderPath, String physicalFileName) {
        String baseUrl = fileProperties.getImage().getBaseUrl();
        if (!baseUrl.endsWith("/")) baseUrl += "/";
        return baseUrl + folderPath + "/" + physicalFileName;
    }

    private String mimeToExt(String mimeType) {
        return switch (mimeType.toLowerCase()) {
            case "image/jpeg" -> "jpg";
            case "image/png"  -> "png";
            case "image/gif"  -> "gif";
            case "image/webp" -> "webp";
            case "image/svg+xml" -> "svg";
            default -> "bin";
        };
    }
}
