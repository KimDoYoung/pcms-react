package kr.co.kalpa.pcms.domain.calendar;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.co.kalpa.pcms.domain.calendar.dto.CalendarEventDto;
import kr.co.kalpa.pcms.domain.calendar.entity.CalendarEvent;
import kr.co.kalpa.pcms.domain.calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    /** 공휴일 + 개인일정 통합 조회 */
    @GetMapping("/{startYmd}/{endYmd}")
    public ResponseEntity<List<CalendarEventDto>> getEvents(
            @PathVariable("startYmd") String startYmd,
            @PathVariable("endYmd")   String endYmd) {
        return ResponseEntity.ok(calendarService.getEventsByRange(startYmd, endYmd));
    }

    /** 특정 연도의 전체 공휴일 정보 취득 */
    @PostMapping("/fetch-public-holiday/{year}")
    public ResponseEntity<Map<String, Object>> fetchYearlyHolidays(@PathVariable("year") int year) {
        calendarService.fetchHolidaysForYear(year);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", year + "년 공휴일 정보 처리가 완료되었습니다."
        ));
    }

    /** 특정 연월의 공휴일 정보 취득 */
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

    /** 개인 일정 전체 목록 */
    @GetMapping("/my/list")
    public ResponseEntity<List<CalendarEvent>> listMyEvents() {
        return ResponseEntity.ok(calendarService.getAllCalendarEvents());
    }

    /** 개인 일정 등록 */
    @PostMapping("/my")
    public ResponseEntity<Void> createEvent(@RequestBody CalendarEvent e) {
        calendarService.createCalendarEvent(e);
        return ResponseEntity.ok().build();
    }

    /** 개인 일정 수정 */
    @PutMapping("/my/{id}")
    public ResponseEntity<Void> updateEvent(@PathVariable("id") int id, @RequestBody CalendarEvent e) {
        CalendarEvent updated = CalendarEvent.builder()
                .id(id)
                .gubun(e.getGubun())
                .sorl(e.getSorl())
                .ymd(e.getYmd())
                .content(e.getContent())
                .build();
        calendarService.updateCalendarEvent(updated);
        return ResponseEntity.ok().build();
    }

    /** 개인 일정 삭제 */
    @DeleteMapping("/my/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable("id") int id) {
        calendarService.deleteCalendarEvent(id);
        return ResponseEntity.ok().build();
    }
}
