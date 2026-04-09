package kr.co.kalpa.pcms.domain.calendar.service;

import kr.co.kalpa.pcms.domain.calendar.entity.CalendarPublic;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CalendarMapper {
    int countAction(@Param("dataType") String dataType, @Param("ymd") String ymd);
    
    void deleteDataByYm(@Param("dataType") String dataType, @Param("ym") String ym);
    
    void insertCalendarPublic(CalendarPublic calendarPublic);
    
    List<CalendarPublic> selectDataByYm(@Param("dataType") String dataType, @Param("ym") String ym);

    List<CalendarPublic> selectPublicDataByRange(@Param("start") String start, @Param("end") String end);
}
