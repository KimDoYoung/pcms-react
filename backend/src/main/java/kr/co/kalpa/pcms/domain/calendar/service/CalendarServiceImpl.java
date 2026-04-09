package kr.co.kalpa.pcms.domain.calendar.service;

import kr.co.kalpa.pcms.domain.calendar.dto.CalendarEventDto;
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
        
        // Action 확인 (이미 취득했는지) - 단, 강제 갱신 로직이 필요할 수도 있으나 설계대로 존재여부만 확인
        if (calendarMapper.countAction("Action", ym) > 0) {
            log.info("Holidays for {} already fetched. Skipping.", ym);
            return;
        }

        try {
            String url = String.format(
                "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=%s&solYear=%d&solMonth=%02d&numOfRows=100",
                apiKey, year, month
            );

            log.debug("Requesting URL: {}", url);
            String responseXml = restTemplate.getForObject(url, String.class);
            if (responseXml == null) {
                log.warn("Empty response from public data portal for {}", ym);
                return;
            }

            List<HolidayItem> items = parseHolidayXml(responseXml);
            
            // 기존 데이터 삭제 (설계: Data, A-YM 데이터 모두 삭제)
            calendarMapper.deleteDataByYm("Data", ym);

            // 데이터 삽입
            for (HolidayItem item : items) {
                calendarMapper.insertCalendarPublic(CalendarPublic.builder()
                        .dataType("Data")
                        .ymd(item.locdate)
                        .content(item.dateName)
                        .build());
            }

            // Action 기록
            calendarMapper.insertCalendarPublic(CalendarPublic.builder()
                    .dataType("Action")
                    .ymd(ym)
                    .content("데이터취득")
                    .build());

            log.info("Successfully fetched {} holidays for {}", items.size(), ym);

        } catch (Exception e) {
            log.error("Failed to fetch holidays for {}", ym, e);
            throw new RuntimeException("공휴일 정보 취득 실패: " + ym, e);
        }
    }

    @Override
    public List<CalendarPublic> getPublicHolidays(String ym) {
        return calendarMapper.selectDataByYm("Data", ym);
    }

    @Override
    public List<CalendarEventDto> getEventsByRange(String start, String end) {
        List<CalendarPublic> publicHolidays = calendarMapper.selectPublicDataByRange(start, end);
        List<CalendarEventDto> result = new ArrayList<>();
        for (CalendarPublic p : publicHolidays) {
            result.add(CalendarEventDto.builder()
                    .id("H_" + p.getId())
                    .type("HOLIDAY")
                    .ymd(p.getYmd())
                    .content(p.getContent())
                    .build());
        }
        return result;
    }

    private List<HolidayItem> parseHolidayXml(String xml) throws Exception {
        List<HolidayItem> result = new ArrayList<>();
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

        NodeList nodeList = doc.getElementsByTagName("item");
        for (int i = 0; i < nodeList.getLength(); i++) {
            Element element = (Element) nodeList.item(i);
            String isHoliday = getTagValue("isHoliday", element);
            if ("Y".equals(isHoliday)) {
                String dateName = getTagValue("dateName", element);
                String locdate = getTagValue("locdate", element);
                result.add(new HolidayItem(dateName, locdate));
            }
        }
        return result;
    }

    private String getTagValue(String tag, Element element) {
        NodeList nlList = element.getElementsByTagName(tag).item(0).getChildNodes();
        return nlList.item(0).getNodeValue();
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
