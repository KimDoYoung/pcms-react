package kr.co.kalpa.pcms.service.impl;

import kr.co.kalpa.pcms.domain.Jangbi;
import kr.co.kalpa.pcms.dto.JangbiDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.jangbi.JangbiSearchDto;
import kr.co.kalpa.pcms.mapper.JangbiMapper;
import kr.co.kalpa.pcms.service.FileUploadService;
import kr.co.kalpa.pcms.service.JangbiService;
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

        // 첨부파일 저장 + file_match 연결
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
        // 1. 삭제 요청된 첨부파일 제거
        if (jangbiDto.getDeletedAttachmentIds() != null && !jangbiDto.getDeletedAttachmentIds().isEmpty()) {
            fileUploadService.deleteAttachments(jangbiDto.getDeletedAttachmentIds());
        }

        // 2. 장비 업데이트
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

        // 3. 새 첨부파일 저장 + file_match 연결
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
            if (!file.isEmpty()) {
                ids.add(fileUploadService.saveAttachment(file));
            }
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
