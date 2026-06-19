package kr.co.kalpa.pcms.domain.dailylog.service;

import kr.co.kalpa.pcms.domain.dailylog.dto.DailyLogDto;

import java.util.List;

public interface DailyLogService {
    Long register(DailyLogDto dailyLogDto);
    void modify(DailyLogDto dailyLogDto);
    void remove(Long id);
    List<DailyLogDto> getByRange(String start, String end);
}
