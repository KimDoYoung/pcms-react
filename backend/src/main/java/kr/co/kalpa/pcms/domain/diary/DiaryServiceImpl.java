package kr.co.kalpa.pcms.domain.diary;

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
public class DiaryServiceImpl implements DiaryService {

    private static final String TABLE_NAME = "diary";
    private static final String FILE_TYPE_IMAGE = "editor-image";
    private static final String FILE_TYPE_ATTACH = "attachment";

    private final DiaryMapper diaryMapper;
    private final FileUploadService fileUploadService;

    @Override
    public Long register(DiaryDto diaryDto, List<MultipartFile> attachments) {
        FileUploadService.ProcessResult imageResult =
                fileUploadService.processEditorImages(diaryDto.getContent());

        Diary diary = Diary.builder()
                .ymd(diaryDto.getYmd())
                .content(imageResult.content())
                .summary(diaryDto.getSummary())
                .build();
        diaryMapper.insertDiary(diary);
        Long diaryId = diary.getId();

        if (!imageResult.fileIds().isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, diaryId, imageResult.fileIds(), FILE_TYPE_IMAGE);
        }

        List<Long> attachFileIds = saveAttachments(attachments);
        if (!attachFileIds.isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, diaryId, attachFileIds, FILE_TYPE_ATTACH);
        }

        return diaryId;
    }

    @Override
    public DiaryDto get(Long id) {
        Diary diary = diaryMapper.selectDiaryById(id)
                .orElseThrow(() -> new RuntimeException("Diary not found: " + id));

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
        if (diaryDto.getDeletedAttachmentIds() != null && !diaryDto.getDeletedAttachmentIds().isEmpty()) {
            fileUploadService.deleteAttachments(diaryDto.getDeletedAttachmentIds());
        }

        FileUploadService.ProcessResult imageResult =
                fileUploadService.processEditorImages(diaryDto.getContent());

        Diary diary = Diary.builder()
                .id(diaryDto.getId())
                .ymd(diaryDto.getYmd())
                .content(imageResult.content())
                .summary(diaryDto.getSummary())
                .build();
        diaryMapper.updateDiary(diary);

        if (!imageResult.fileIds().isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, diaryDto.getId(), imageResult.fileIds(), FILE_TYPE_IMAGE);
        }

        List<Long> attachFileIds = saveAttachments(attachments);
        if (!attachFileIds.isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, diaryDto.getId(), attachFileIds, FILE_TYPE_ATTACH);
        }
    }

    @Override
    public void remove(Long id) {
        diaryMapper.deleteDiary(id);
    }

    @Override
    @Transactional(readOnly = true)
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
            if (!file.isEmpty()) ids.add(fileUploadService.saveAttachment(file));
        }
        return ids;
    }
}
