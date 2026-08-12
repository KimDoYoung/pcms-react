package kr.co.kalpa.pcms.domain.imageeditor.service;

import kr.co.kalpa.pcms.domain.imageeditor.dto.ImageWorkDto;
import kr.co.kalpa.pcms.domain.imageeditor.dto.ImageWorkListDto;
import kr.co.kalpa.pcms.domain.imageeditor.dto.ImageWorkUpsertDto;
import kr.co.kalpa.pcms.domain.imageeditor.entity.ImageWork;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ImageWorkServiceImpl implements ImageWorkService {

    private final ImageWorkMapper imageWorkMapper;

    @Override
    @Transactional(readOnly = true)
    public ImageWorkListDto getList() {
        String createdBy = currentUserId();
        List<ImageWorkDto> list = imageWorkMapper.selectImageWorkList(createdBy).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        int totalCount = imageWorkMapper.selectImageWorkCount(createdBy);
        return ImageWorkListDto.builder()
                .totalCount(totalCount)
                .list(list)
                .build();
    }

    @Override
    public Long upsert(ImageWorkUpsertDto dto) {
        String createdBy = currentUserId();

        if (dto.getId() == null) {
            ImageWork imageWork = ImageWork.builder()
                    .createdBy(createdBy)
                    .title(dto.getTitle())
                    .jsonData(dto.getJsonData())
                    .build();
            imageWorkMapper.insertImageWork(imageWork);
            return imageWork.getId();
        }

        ImageWork imageWork = ImageWork.builder()
                .id(dto.getId())
                .createdBy(createdBy)
                .title(dto.getTitle())
                .jsonData(dto.getJsonData())
                .build();
        int updated = imageWorkMapper.updateImageWork(imageWork);
        if (updated == 0) {
            throw new RuntimeException("ImageWork not found or not owned by user: " + dto.getId());
        }
        return dto.getId();
    }

    @Override
    public void remove(Long id) {
        int deleted = imageWorkMapper.deleteImageWork(id, currentUserId());
        if (deleted == 0) {
            throw new RuntimeException("ImageWork not found or not owned by user: " + id);
        }
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private ImageWorkDto toDto(ImageWork imageWork) {
        return ImageWorkDto.builder()
                .id(imageWork.getId())
                .title(imageWork.getTitle())
                .jsonData(imageWork.getJsonData())
                .createdAt(imageWork.getCreatedAt())
                .updatedAt(imageWork.getUpdatedAt())
                .build();
    }
}
