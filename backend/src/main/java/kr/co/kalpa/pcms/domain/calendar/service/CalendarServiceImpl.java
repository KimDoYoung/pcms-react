package kr.co.kalpa.pcms.domain.calendar.service;

import kr.co.kalpa.pcms.domain.calendar.dto.CalendarEventDto;
import kr.co.kalpa.pcms.domain.calendar.entity.CalendarEvent;
import kr.co.kalpa.pcms.domain.calendar.entity.CalendarPublic;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import com.github.usingsky.calendar.KoreanLunarCalendar;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarServiceImpl implements CalendarService {

    private final CalendarMapper calendarMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${public.data.api-key}")
    private String apiKey;

    @Override
    public void fetchHolidaysForYear(int year) {
        log.info("Fetching holidays for year: {}", year);
        for (int m = 1; m <= 12; m++) {
            fetchHolidaysForMonth(year, m);
        }
    }

    @Override
    @Transactional
    public void fetchHolidaysForMonth(int year, int month) {
        String ym = String.format("%04d%02d", year, month);
        
        if (calendarMapper.countAction("Action", ym) > 0) {
            log.info("Holidays for {} already fetched. Skipping.", ym);
            return;
        }

        try {
            String url = String.format(
                "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=%s&solYear=%d&solMonth=%02d&numOfRows=100&_type=xml",
                apiKey, year, month
            );

            log.debug("Requesting URL: {}", url);
            byte[] responseBytes = restTemplate.getForObject(url, byte[].class);
            String responseXml = responseBytes != null ? new String(responseBytes, StandardCharsets.UTF_8) : null;
            
            calendarMapper.deleteDataByYm("Data", ym);
            calendarMapper.deleteDataByYm("Action", ym);

            if (responseXml == null || responseXml.trim().isEmpty()) {
                log.warn("Empty response from public data portal for {}", ym);
                saveAction(ym);
                return;
            }

            log.info("Raw response for {}: {}", ym, responseXml);

            if (responseXml.contains("<items></items>") || !responseXml.contains("<item>")) {
                log.info("No holiday items found in response for {}", ym);
                saveAction(ym);
                return;
            }

            List<HolidayItem> items = parseHolidayXml(responseXml);
            
            if (items.isEmpty()) {
                log.info("Parsed 0 holiday items from XML for {}", ym);
            } else {
                for (HolidayItem item : items) {
                    log.debug("Inserting holiday: {} on {}", item.dateName, item.locdate);
                    calendarMapper.insertCalendarPublic(CalendarPublic.builder()
                            .dataType("Data")
                            .ymd(item.locdate)
                            .content(item.dateName)
                            .build());
                }
            }

            saveAction(ym);
            log.info("Successfully processed {} for {}. (Items: {})", 
                items.isEmpty() ? "empty holidays" : "holidays", ym, items.size());

        } catch (Exception e) {
            log.error("Failed to fetch holidays for {}", ym, e);
            throw new RuntimeException("공휴일 정보 취득 실패: " + ym, e);
        }
    }

    private void saveAction(String ym) {
        calendarMapper.deleteDataByYm("Action", ym);
        calendarMapper.insertCalendarPublic(CalendarPublic.builder()
                .dataType("Action")
                .ymd(ym)
                .content("데이터취득")
                .build());
    }

    @Override
    public List<CalendarPublic> getPublicHolidays(String ym) {
        return calendarMapper.selectDataByYm("Data", ym);
    }

    @Override
    public List<CalendarEventDto> getEventsByRange(String start, String end) {
        List<CalendarEventDto> result = new ArrayList<>();

        // 공휴일
        List<CalendarPublic> publicHolidays = calendarMapper.selectPublicDataByRange(start, end);
        for (CalendarPublic p : publicHolidays) {
            result.add(CalendarEventDto.builder()
                    .id("H_" + p.getId())
                    .type("HOLIDAY")
                    .ymd(p.getYmd())
                    .content(p.getContent())
                    .build());
        }

        // 개인 일정 (양력) — SQL에서 Y/M 날짜 확장 및 BETWEEN 필터링 완료
        List<CalendarEvent> myEvents = calendarMapper.selectCalendarByRange(start, end);
        for (CalendarEvent e : myEvents) {
            result.add(CalendarEventDto.builder()
                    .id("C_" + e.getId())
                    .type("EVENT")
                    .ymd(e.getYmd())
                    .content(e.getContent())
                    .gubun(e.getGubun())
                    .color(e.getColor())
                    .build());
        }

        // 음력 기념일 — KoreanLunarCalendar로 양력 변환 후 범위 필터
        int startYear = Integer.parseInt(start.substring(0, 4));
        int endYear   = Integer.parseInt(end.substring(0, 4));
        List<CalendarEvent> lunarEvents = calendarMapper.selectLunarCalendarEvents();
        for (CalendarEvent lunar : lunarEvents) {
            for (String solarYmd : resolveLunarToSolar(lunar.getGubun(), lunar.getYmd(), startYear, endYear)) {
                if (solarYmd.compareTo(start) >= 0 && solarYmd.compareTo(end) <= 0) {
                    result.add(CalendarEventDto.builder()
                            .id("C_" + lunar.getId())
                            .type("EVENT")
                            .ymd(solarYmd)
                            .content(lunar.getContent())
                            .gubun(lunar.getGubun())
                            .color(lunar.getColor())
                            .build());
                }
            }
        }

        return result;
    }

    @Override
    public List<CalendarEvent> getAllCalendarEvents() {
        return calendarMapper.selectAllCalendarEvents();
    }

    @Override
    public void createCalendarEvent(CalendarEvent e) {
        calendarMapper.insertCalendarEvent(e);
    }

    @Override
    public void updateCalendarEvent(CalendarEvent e) {
        calendarMapper.updateCalendarEvent(e);
    }

    @Override
    public void deleteCalendarEvent(int id) {
        calendarMapper.deleteCalendarEvent(id);
    }

    @Override
    public CalendarEvent getCalendarEventById(int id) {
        return calendarMapper.selectCalendarEventById(id);
    }

    /**
     * 음력 기념일을 양력 날짜(yyyyMMdd) 목록으로 변환한다.
     * gubun='Y': ymd=MMDD → startYear~endYear 각 연도에 대해 변환
     * gubun='S': ymd=YYYYMMDD → 해당 연도 1회 변환
     * gubun='M': 음력 매달은 미지원, 빈 리스트 반환
     */
    private List<String> resolveLunarToSolar(String gubun, String ymd, int startYear, int endYear) {
        List<String> result = new ArrayList<>();
        KoreanLunarCalendar cal = KoreanLunarCalendar.getInstance();
        try {
            if ("Y".equals(gubun)) {
                int month = Integer.parseInt(ymd.substring(0, 2));
                int day   = Integer.parseInt(ymd.substring(2, 4));
                for (int year = startYear; year <= endYear; year++) {
                    if (cal.setLunarDate(year, month, day, false)) {
                        result.add(cal.getSolarIsoFormat().replace("-", ""));
                    }
                }
            } else if ("S".equals(gubun)) {
                int year  = Integer.parseInt(ymd.substring(0, 4));
                int month = Integer.parseInt(ymd.substring(4, 6));
                int day   = Integer.parseInt(ymd.substring(6, 8));
                if (cal.setLunarDate(year, month, day, false)) {
                    result.add(cal.getSolarIsoFormat().replace("-", ""));
                }
            }
        } catch (Exception e) {
            log.warn("Lunar to solar conversion failed: gubun={}, ymd={}", gubun, ymd, e);
        }
        return result;
    }

    private List<HolidayItem> parseHolidayXml(String xml) throws Exception {
        List<HolidayItem> result = new ArrayList<>();
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

        NodeList nodeList = doc.getElementsByTagName("item");
        log.debug("Found {} <item> tags in XML", nodeList.getLength());

        for (int i = 0; i < nodeList.getLength(); i++) {
            Element element = (Element) nodeList.item(i);
            String isHoliday = getTagValue("isHoliday", element);
            
            if ("Y".equalsIgnoreCase(isHoliday)) {
                String dateName = getTagValue("dateName", element);
                String locdate = getTagValue("locdate", element);
                if (dateName != null && locdate != null) {
                    result.add(new HolidayItem(dateName, locdate));
                }
            }
        }
        return result;
    }

    private String getTagValue(String tag, Element element) {
        try {
            NodeList tags = element.getElementsByTagName(tag);
            if (tags != null && tags.getLength() > 0 && tags.item(0).getChildNodes().getLength() > 0) {
                return tags.item(0).getChildNodes().item(0).getNodeValue();
            }
        } catch (Exception e) {
            log.trace("Tag {} not found", tag);
        }
        return null;
    }

    private static class HolidayItem {
        String dateName;
        String locdate;

        HolidayItem(String dateName, String locdate) {
            this.dateName = dateName;
            this.locdate = locdate;
        }
    }
}
