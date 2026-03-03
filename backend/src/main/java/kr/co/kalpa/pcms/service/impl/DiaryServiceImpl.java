package kr.co.kalpa.pcms.service.impl;

import kr.co.kalpa.pcms.domain.Diary;
import kr.co.kalpa.pcms.dto.DiaryDto;
import kr.co.kalpa.pcms.dto.PageRequestDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.mapper.DiaryMapper;
import kr.co.kalpa.pcms.service.DiaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DiaryServiceImpl implements DiaryService {

    private final DiaryMapper diaryMapper;

    @Override
    public Long register(DiaryDto diaryDto) {
        Diary diary = Diary.builder()
                .ymd(diaryDto.getYmd())
                .content(diaryDto.getContent())
                .summary(diaryDto.getSummary())
                .build();
        diaryMapper.insertDiary(diary);
        return diary.getId();
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
                .build();
    }

    @Override
    public void modify(DiaryDto diaryDto) {
        Diary diary = Diary.builder()
                .id(diaryDto.getId())
                .ymd(diaryDto.getYmd())
                .content(diaryDto.getContent())
                .summary(diaryDto.getSummary())
                .build();
        diaryMapper.updateDiary(diary);
    }

    @Override
    public void remove(Long id) {
        diaryMapper.deleteDiary(id);
    }

    @Override
    public PageResponseDto<DiaryDto> getList(PageRequestDto pageRequestDto) {
        List<Diary> diaries = diaryMapper.selectDiaryList(pageRequestDto);
        int total = diaryMapper.selectDiaryCount(pageRequestDto);

        List<DiaryDto> dtoList = diaries.stream().map(diary -> DiaryDto.builder()
                .id(diary.getId())
                .ymd(diary.getYmd())
                .content(diary.getContent())
                .summary(diary.getSummary())
                .createdAt(diary.getCreatedAt())
                .updatedAt(diary.getUpdatedAt())
                .build()
        ).collect(Collectors.toList());

        return PageResponseDto.<DiaryDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(pageRequestDto)
                .build();
    }
}