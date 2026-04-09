package kr.co.kalpa.pcms.domain.calendar.service;

import kr.co.kalpa.pcms.domain.calendar.dto.CalendarEventDto;
import kr.co.kalpa.pcms.domain.calendar.entity.CalendarEvent;
import kr.co.kalpa.pcms.domain.calendar.entity.CalendarPublic;
import java.util.List;

public interface CalendarService {
    void fetchHolidaysForYear(int year);
    void fetchHolidaysForMonth(int year, int month);
    List<CalendarPublic> getPublicHolidays(String ym);
    List<CalendarEventDto> getEventsByRange(String start, String end);

    // cms.calendar CRUD
    void createCalendarEvent(CalendarEvent e);
    void updateCalendarEvent(CalendarEvent e);
    void deleteCalendarEvent(int id);
    CalendarEvent getCalendarEventById(int id);
}
