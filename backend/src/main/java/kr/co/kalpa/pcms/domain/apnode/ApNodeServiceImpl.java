package kr.co.kalpa.pcms.domain.apnode;

import kr.co.kalpa.pcms.domain.apnode.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ApNodeServiceImpl implements ApNodeService {

    private final ApNodeMapper apNodeMapper;
    private final ApFileMapper apFileMapper;

    @Value("${apnode.file.base-dir}")
    private String apnodeBaseDir;

    @Value("${apnode.file.base-url}")
    private String apnodeBaseUrl;

    @Override
    @Transactional(readOnly = true)
    public List<ApNodeDto> listRoots() {
        return apNodeMapper.selectRoots().stream()
                .map(this::resolveNodeDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApNodeDto> listChildren(String parentId) {
        return apNodeMapper.selectChildren(parentId).stream()
                .map(this::resolveNodeDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApNodeDto> getPath(String id) {
        return apNodeMapper.selectAncestors(id).stream()
                .map(this::toBaseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ApNodeDto getNode(String id) {
        ApNode node = findNode(id);
        return resolveNodeDto(node);
    }

    @Override
    public ApNodeDto createDirectory(DirectoryCreateDto dto) {
        int depth = 0;
        if (dto.getParentId() != null) {
            ApNode parent = findNode(dto.getParentId());
            ensureDirectory(parent);
            depth = parent.getDepth() + 1;
        }

        ApNode node = ApNode.builder()
                .id(UUID.randomUUID().toString())
                .nodeType("D")
                .parentId(dto.getParentId())
                .name(dto.getName())
                .depth(depth)
                .build();
        apNodeMapper.insertNode(node);

        if (dto.getParentId() != null) {
            apNodeMapper.incrementChildCount(dto.getParentId());
        }
        return toBaseDto(node);
    }

    @Override
    public ApNodeDto uploadFile(String parentId, MultipartFile file) throws IOException {
        int depth = 0;
        if (parentId != null) {
            ApNode parent = findNode(parentId);
            ensureDirectory(parent);
            depth = parent.getDepth() + 1;
        }

        LocalDate today = LocalDate.now();
        String datePath = String.format("%d/%02d/%02d", today.getYear(), today.getMonthValue(), today.getDayOfMonth());
        Path saveDir = Paths.get(apnodeBaseDir, datePath);
        Files.createDirectories(saveDir);

        String originalName = file.getOriginalFilename();
        String ext = getExtension(originalName);
        String physicalName = UUID.randomUUID() + (ext.isEmpty() ? "" : ext);
        Path savePath = saveDir.resolve(physicalName);
        Files.copy(file.getInputStream(), savePath, StandardCopyOption.REPLACE_EXISTING);

        String sha256 = computeSha256(savePath);
        String relativePath = datePath + "/" + physicalName;

        Integer width = null;
        Integer height = null;
        if (file.getContentType() != null && file.getContentType().startsWith("image/")) {
            try {
                BufferedImage img = ImageIO.read(savePath.toFile());
                if (img != null) {
                    width = img.getWidth();
                    height = img.getHeight();
                }
            } catch (IOException e) {
                log.warn("이미지 메타데이터 읽기 실패: {}", savePath);
            }
        }

        String nodeId = UUID.randomUUID().toString();
        ApNode node = ApNode.builder()
                .id(nodeId)
                .nodeType("F")
                .parentId(parentId)
                .name(originalName)
                .depth(depth)
                .build();
        apNodeMapper.insertNode(node);

        ApFile apFile = ApFile.builder()
                .nodeId(nodeId)
                .savedPath(relativePath)
                .originalName(originalName)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .sha256Hash(sha256)
                .width(width)
                .height(height)
                .build();
        apFileMapper.insertFile(apFile);

        if (parentId != null) {
            apNodeMapper.incrementChildCount(parentId);
            apNodeMapper.updateTotalSize(parentId, file.getSize());
        }

        return resolveNodeDto(apNodeMapper.selectById(nodeId).orElseThrow());
    }

    @Override
    public ApNodeDto createLink(LinkCreateDto dto) {
        ApNode target = findNode(dto.getTargetId());
        if (target.isDeleted()) {
            throw new IllegalStateException("삭제된 노드에는 링크를 만들 수 없습니다.");
        }
        if ("L".equals(target.getNodeType())) {
            throw new IllegalStateException("링크의 링크는 만들 수 없습니다.");
        }

        int depth = 0;
        if (dto.getParentId() != null) {
            ApNode parent = findNode(dto.getParentId());
            ensureDirectory(parent);
            depth = parent.getDepth() + 1;
        }

        ApNode node = ApNode.builder()
                .id(UUID.randomUUID().toString())
                .nodeType("L")
                .parentId(dto.getParentId())
                .name(dto.getName())
                .depth(depth)
                .linkTargetId(dto.getTargetId())
                .build();
        apNodeMapper.insertNode(node);

        if (dto.getParentId() != null) {
            apNodeMapper.incrementChildCount(dto.getParentId());
        }

        return resolveNodeDto(apNodeMapper.selectById(node.getId()).orElseThrow());
    }

    @Override
    public ApNodeDto rename(String id, NodeRenameDto dto) {
        findNode(id);
        apNodeMapper.updateName(id, dto.getName());
        return resolveNodeDto(apNodeMapper.selectById(id).orElseThrow());
    }

    @Override
    public ApNodeDto move(String id, NodeMoveDto dto) {
        ApNode node = findNode(id);
        String oldParentId = node.getParentId();
        String newParentId = dto.getTargetParentId();

        int newDepth = 0;
        if (newParentId != null) {
            ApNode newParent = findNode(newParentId);
            ensureDirectory(newParent);
            newDepth = newParent.getDepth() + 1;
        }

        apNodeMapper.updateParent(id, newParentId, newDepth);

        if (oldParentId != null) {
            apNodeMapper.decrementChildCount(oldParentId);
            if ("F".equals(node.getNodeType())) {
                apFileMapper.selectByNodeId(id).ifPresent(f ->
                        apNodeMapper.updateTotalSize(oldParentId, -f.getFileSize()));
            }
        }

        if (newParentId != null) {
            apNodeMapper.incrementChildCount(newParentId);
            if ("F".equals(node.getNodeType())) {
                apFileMapper.selectByNodeId(id).ifPresent(f ->
                        apNodeMapper.updateTotalSize(newParentId, f.getFileSize()));
            }
        }

        return resolveNodeDto(apNodeMapper.selectById(id).orElseThrow());
    }

    @Override
    public void delete(String id) {
        ApNode node = findNode(id);

        if ("D".equals(node.getNodeType()) && node.getChildCount() > 0) {
            throw new IllegalStateException("파일이 있는 디렉토리는 삭제할 수 없습니다.");
        }

        apNodeMapper.softDelete(id);

        if (node.getParentId() != null) {
            apNodeMapper.decrementChildCount(node.getParentId());
            if ("F".equals(node.getNodeType())) {
                apFileMapper.selectByNodeId(id).ifPresent(f ->
                        apNodeMapper.updateTotalSize(node.getParentId(), -f.getFileSize()));
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public FileDownloadDto getFileForDownload(String id) {
        ApNode node = findNode(id);

        if ("L".equals(node.getNodeType())) {
            if (node.getLinkTargetId() == null) {
                throw new IllegalStateException("링크 대상이 없습니다.");
            }
            node = apNodeMapper.selectById(node.getLinkTargetId())
                    .orElseThrow(() -> new RuntimeException("링크 대상을 찾을 수 없습니다."));
            if (node.isDeleted()) {
                throw new IllegalStateException("링크 대상이 삭제되었습니다.");
            }
        }

        if (!"F".equals(node.getNodeType())) {
            throw new IllegalStateException("파일 노드가 아닙니다.");
        }

        ApFile apFile = apFileMapper.selectByNodeId(node.getId())
                .orElseThrow(() -> new RuntimeException("파일 정보를 찾을 수 없습니다."));

        return new FileDownloadDto(apFile.getSavedPath(), apFile.getOriginalName(), apFile.getContentType());
    }

    private ApNode findNode(String id) {
        return apNodeMapper.selectById(id)
                .orElseThrow(() -> new RuntimeException("노드를 찾을 수 없습니다: " + id));
    }

    private void ensureDirectory(ApNode node) {
        if (!"D".equals(node.getNodeType())) {
            throw new IllegalStateException("디렉토리가 아닙니다: " + node.getName());
        }
    }

    private ApNodeDto resolveNodeDto(ApNode node) {
        ApNodeDto dto = toBaseDto(node);

        if ("F".equals(node.getNodeType())) {
            apFileMapper.selectByNodeId(node.getId()).ifPresent(f -> applyFileInfo(dto, f));
        } else if ("L".equals(node.getNodeType()) && node.getLinkTargetId() != null) {
            apNodeMapper.selectById(node.getLinkTargetId()).ifPresentOrElse(
                    target -> {
                        if (target.isDeleted()) {
                            dto.setBrokenLink(true);
                        } else {
                            apFileMapper.selectByNodeId(target.getId())
                                    .ifPresent(f -> applyFileInfo(dto, f));
                        }
                    },
                    () -> dto.setBrokenLink(true)
            );
        }
        return dto;
    }

    private ApNodeDto toBaseDto(ApNode node) {
        return ApNodeDto.builder()
                .id(node.getId())
                .nodeType(node.getNodeType())
                .parentId(node.getParentId())
                .name(node.getName())
                .depth(node.getDepth())
                .createDt(node.getCreateDt())
                .modifyDt(node.getModifyDt())
                .childCount(node.getChildCount())
                .totalSize(node.getTotalSize())
                .linkTargetId(node.getLinkTargetId())
                .build();
    }

    private void applyFileInfo(ApNodeDto dto, ApFile f) {
        dto.setOriginalName(f.getOriginalName());
        dto.setFileSize(f.getFileSize());
        dto.setContentType(f.getContentType());
        dto.setWidth(f.getWidth());
        dto.setHeight(f.getHeight());
        dto.setFileUrl(apnodeBaseUrl + f.getSavedPath());
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx) : "";
    }

    private String computeSha256(Path path) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream is = Files.newInputStream(path)) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = is.read(buf)) > 0) digest.update(buf, 0, n);
            }
            byte[] hash = digest.digest();
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException | IOException e) {
            log.warn("SHA-256 계산 실패: {}", path);
            return null;
        }
    }
}
