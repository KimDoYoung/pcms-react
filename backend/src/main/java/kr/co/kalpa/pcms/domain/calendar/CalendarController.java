package kr.co.kalpa.pcms.domain.calendar;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.co.kalpa.pcms.domain.calendar.dto.CalendarEventDto;
import kr.co.kalpa.pcms.domain.calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    /**
     * 특정 기간의 이벤트 조회 (공휴일 등)
     */
    @GetMapping("/events")
    public ResponseEntity<List<CalendarEventDto>> getEvents(
            @RequestParam("start") String start,
            @RequestParam("end") String end) {
        return ResponseEntity.ok(calendarService.getEventsByRange(start, end));
    }

    /**
     * 특정 연도의 전체 공휴일 정보 취득
     */
    @PostMapping("/fetch-public-holiday/{year}")
    public ResponseEntity<Map<String, Object>> fetchYearlyHolidays(@PathVariable("year") int year) {
        calendarService.fetchHolidaysForYear(year);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", year + "년 공휴일 정보 처리가 완료되었습니다."
        ));
    }

    /**
     * 특정 연월의 공휴일 정보 취득
     */
    @PostMapping("/fetch-public-holiday/{year}/{month}")
    public ResponseEntity<Map<String, Object>> fetchMonthlyHolidays(
            @PathVariable("year") int year,
            @PathVariable("month") int month) {
        calendarService.fetchHolidaysForMonth(year, month);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", String.format("%04d년 %02d월 공휴일 정보 처리가 완료되었습니다.", year, month)
        ));
    }
}
