package kr.co.kalpa.pcms.domain.dailylog.service;

import kr.co.kalpa.pcms.domain.dailylog.dto.DailyLogDto;
import kr.co.kalpa.pcms.domain.dailylog.dto.TitleTemplateDto;
import kr.co.kalpa.pcms.domain.dailylog.entity.DailyLog;

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
public class DailyLogServiceImpl implements DailyLogService {

    private static final String DEFAULT_COLOR = "gray";

    private final DailyLogMapper dailyLogMapper;

    @Override
    public Long register(DailyLogDto dailyLogDto) {
        DailyLog dailyLog = DailyLog.builder()
                .ymd(dailyLogDto.getYmd())
                .title(dailyLogDto.getTitle())
                .value(dailyLogDto.getValue())
                .color(resolveColor(dailyLogDto.getColor()))
                .build();
        dailyLogMapper.insertDailyLog(dailyLog);
        return dailyLog.getId();
    }

    @Override
    public void modify(DailyLogDto dailyLogDto) {
        DailyLog dailyLog = DailyLog.builder()
                .id(dailyLogDto.getId())
                .ymd(dailyLogDto.getYmd())
                .title(dailyLogDto.getTitle())
                .value(dailyLogDto.getValue())
                .color(resolveColor(dailyLogDto.getColor()))
                .build();
        dailyLogMapper.updateDailyLog(dailyLog);
    }

    private String resolveColor(String color) {
        return (color == null || color.isBlank()) ? DEFAULT_COLOR : color;
    }

    @Override
    public void remove(Long id) {
        dailyLogMapper.deleteDailyLog(id);
    }

    @Override
    public void removeByYmd(String ymd) {
        dailyLogMapper.deleteDailyLogsByYmd(ymd);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TitleTemplateDto> getTitleTemplates() {
        return dailyLogMapper.selectTitleTemplates();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyLogDto> getByRange(String start, String end) {
        return dailyLogMapper.selectDailyLogByRange(start, end).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private DailyLogDto toDto(DailyLog dailyLog) {
        return DailyLogDto.builder()
                .id(dailyLog.getId())
                .ymd(dailyLog.getYmd())
                .title(dailyLog.getTitle())
                .value(dailyLog.getValue())
                .color(dailyLog.getColor())
                .build();
    }
}
