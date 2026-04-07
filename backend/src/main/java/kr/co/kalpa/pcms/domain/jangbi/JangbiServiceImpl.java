package kr.co.kalpa.pcms.domain.jangbi;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.file.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class JangbiServiceImpl implements JangbiService {

    private static final String TABLE_NAME = "jangbi";
    private static final String FILE_TYPE_ATTACH = "attachment";

    private final JangbiMapper jangbiMapper;
    private final FileUploadService fileUploadService;

    @Override
    public Long register(JangbiDto jangbiDto, List<MultipartFile> attachments) {
        Jangbi jangbi = Jangbi.builder()
                .ymd(jangbiDto.getYmd())
                .item(jangbiDto.getItem())
                .location(jangbiDto.getLocation())
                .cost(jangbiDto.getCost())
                .spec(jangbiDto.getSpec())
                .lvl(jangbiDto.getLvl() != null ? jangbiDto.getLvl() : "2")
                .build();
        jangbiMapper.insertJangbi(jangbi);
        Long jangbiId = jangbi.getId();

        List<Long> attachFileIds = saveAttachments(attachments);
        if (!attachFileIds.isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, jangbiId, attachFileIds, FILE_TYPE_ATTACH);
        }

        return jangbiId;
    }

    @Override
    @Transactional(readOnly = true)
    public JangbiDto get(Long id) {
        Jangbi jangbi = jangbiMapper.selectJangbiById(id)
                .orElseThrow(() -> new RuntimeException("Jangbi not found: " + id));
        return toDtoWithAttachments(jangbi);
    }

    @Override
    public void modify(JangbiDto jangbiDto, List<MultipartFile> attachments) {
        if (jangbiDto.getDeletedAttachmentIds() != null && !jangbiDto.getDeletedAttachmentIds().isEmpty()) {
            fileUploadService.deleteAttachments(jangbiDto.getDeletedAttachmentIds());
        }

        Jangbi jangbi = Jangbi.builder()
                .id(jangbiDto.getId())
                .ymd(jangbiDto.getYmd())
                .item(jangbiDto.getItem())
                .location(jangbiDto.getLocation())
                .cost(jangbiDto.getCost())
                .spec(jangbiDto.getSpec())
                .lvl(jangbiDto.getLvl())
                .build();
        jangbiMapper.updateJangbi(jangbi);

        List<Long> attachFileIds = saveAttachments(attachments);
        if (!attachFileIds.isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, jangbiDto.getId(), attachFileIds, FILE_TYPE_ATTACH);
        }
    }

    @Override
    public void remove(Long id) {
        jangbiMapper.deleteJangbi(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<JangbiDto> getList(JangbiSearchDto searchDto) {
        List<Jangbi> list = jangbiMapper.selectJangbiList(searchDto);
        int total = jangbiMapper.selectJangbiCount(searchDto);

        List<JangbiDto> dtoList = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponseDto.<JangbiDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(searchDto)
                .build();
    }

    private List<Long> saveAttachments(List<MultipartFile> attachments) {
        if (attachments == null || attachments.isEmpty()) return List.of();
        List<Long> ids = new ArrayList<>();
        for (MultipartFile file : attachments) {
            if (!file.isEmpty()) ids.add(fileUploadService.saveAttachment(file));
        }
        return ids;
    }

    private JangbiDto toDto(Jangbi jangbi) {
        return JangbiDto.builder()
                .id(jangbi.getId())
                .ymd(jangbi.getYmd())
                .item(jangbi.getItem())
                .location(jangbi.getLocation())
                .cost(jangbi.getCost())
                .spec(jangbi.getSpec())
                .lvl(jangbi.getLvl())
                .modifyDt(jangbi.getModifyDt())
                .attachmentCount(jangbi.getAttachmentCount())
                .build();
    }

    private JangbiDto toDtoWithAttachments(Jangbi jangbi) {
        return JangbiDto.builder()
                .id(jangbi.getId())
                .ymd(jangbi.getYmd())
                .item(jangbi.getItem())
                .location(jangbi.getLocation())
                .cost(jangbi.getCost())
                .spec(jangbi.getSpec())
                .lvl(jangbi.getLvl())
                .modifyDt(jangbi.getModifyDt())
                .attachments(fileUploadService.getAttachments(TABLE_NAME, jangbi.getId()))
                .build();
    }
}
