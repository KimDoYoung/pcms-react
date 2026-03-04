package kr.co.kalpa.pcms.service.impl;

import kr.co.kalpa.pcms.domain.Diary;
import kr.co.kalpa.pcms.dto.DiaryDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.diary.DiarySearchDto;
import kr.co.kalpa.pcms.mapper.DiaryMapper;
import kr.co.kalpa.pcms.service.DiaryService;
import kr.co.kalpa.pcms.service.FileUploadService;
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
public class DiaryServiceImpl implements DiaryService {

    private static final String TABLE_NAME = "diary";
    private static final String FILE_TYPE_IMAGE = "editor-image";
    private static final String FILE_TYPE_ATTACH = "attachment";

    private final DiaryMapper diaryMapper;
    private final FileUploadService fileUploadService;

    @Override
    public Long register(DiaryDto diaryDto, List<MultipartFile> attachments) {
        // 1. 에디터 이미지 추출 → 디스크 저장 + URL 치환
        FileUploadService.ProcessResult imageResult =
                fileUploadService.processEditorImages(diaryDto.getContent());

        // 2. 다이어리 저장
        Diary diary = Diary.builder()
                .ymd(diaryDto.getYmd())
                .content(imageResult.content())
                .summary(diaryDto.getSummary())
                .build();
        diaryMapper.insertDiary(diary);
        Long diaryId = diary.getId();

        // 3. 에디터 이미지 file_match 연결
        if (!imageResult.fileIds().isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, diaryId, imageResult.fileIds(), FILE_TYPE_IMAGE);
        }

        // 4. 첨부파일 저장 + file_match 연결
        List<Long> attachFileIds = saveAttachments(attachments);
        if (!attachFileIds.isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, diaryId, attachFileIds, FILE_TYPE_ATTACH);
        }

        return diaryId;
    }

    @Override
    public DiaryDto get(Long id) {
        Diary diary = diaryMapper.selectDiaryById(id)
                .orElseThrow(() -> new RuntimeException("Diary not found"));

        return DiaryDto.builder()
                .id(diary.getId())
                .ymd(diary.getYmd())
                .content(diary.getContent())
                .summary(diary.getSummary())
                .createdAt(diary.getCreatedAt())
                .updatedAt(diary.getUpdatedAt())
                .attachments(fileUploadService.getAttachments(TABLE_NAME, id))
                .build();
    }

    @Override
    public void modify(DiaryDto diaryDto, List<MultipartFile> attachments) {
        // 1. 삭제 요청된 첨부파일 제거 (물리 파일 + files + file_match)
        if (diaryDto.getDeletedAttachmentIds() != null && !diaryDto.getDeletedAttachmentIds().isEmpty()) {
            fileUploadService.deleteAttachments(diaryDto.getDeletedAttachmentIds());
        }

        // 2. 에디터 이미지 추출 → 디스크 저장 + URL 치환 (새로 삽입된 base64만 처리)
        FileUploadService.ProcessResult imageResult =
                fileUploadService.processEditorImages(diaryDto.getContent());

        // 3. 다이어리 업데이트
        Diary diary = Diary.builder()
                .id(diaryDto.getId())
                .ymd(diaryDto.getYmd())
                .content(imageResult.content())
                .summary(diaryDto.getSummary())
                .build();
        diaryMapper.updateDiary(diary);

        // 4. 새로 추가된 에디터 이미지 file_match 연결
        if (!imageResult.fileIds().isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, diaryDto.getId(), imageResult.fileIds(), FILE_TYPE_IMAGE);
        }

        // 5. 새 첨부파일 저장 + file_match 연결
        List<Long> attachFileIds = saveAttachments(attachments);
        if (!attachFileIds.isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, diaryDto.getId(), attachFileIds, FILE_TYPE_ATTACH);
        }
    }

    @Override
    public void remove(Long id) {
        diaryMapper.deleteDiary(id);
        // file_match는 FK ON DELETE CASCADE로 연결 파일 정보가 함께 삭제됨
        // (files 테이블의 물리 파일 삭제는 별도 배치 작업으로 처리)
    }

    @Override
    public PageResponseDto<DiaryDto> getList(DiarySearchDto searchDto) {
        List<Diary> diaries = diaryMapper.selectDiaryList(searchDto);
        int total = diaryMapper.selectDiaryCount(searchDto);

        List<DiaryDto> dtoList = diaries.stream().map(diary -> DiaryDto.builder()
                .id(diary.getId())
                .ymd(diary.getYmd())
                .content(diary.getContent())
                .summary(diary.getSummary())
                .createdAt(diary.getCreatedAt())
                .updatedAt(diary.getUpdatedAt())
                .attachmentCount(diary.getAttachmentCount())
                .build()
        ).collect(Collectors.toList());

        return PageResponseDto.<DiaryDto>withAll()
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
}
