package kr.co.kalpa.pcms.domain.dailylog.service;

import kr.co.kalpa.pcms.domain.dailylog.entity.DailyLog;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DailyLogMapper {
    void insertDailyLog(DailyLog dailyLog);
    void updateDailyLog(DailyLog dailyLog);
    void deleteDailyLog(@Param("id") Long id);
    List<DailyLog> selectDailyLogByRange(@Param("start") String start, @Param("end") String end);
}
