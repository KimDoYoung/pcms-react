package kr.co.kalpa.pcms.utility.hanja.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.kalpa.pcms.utility.hanja.dto.HanjaDto;
import kr.co.kalpa.pcms.utility.hanja.mapper.HanjaMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HanjaServiceImpl implements HanjaService {

    private final HanjaMapper hanjaMapper;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String NAVER_HANJA_API = "https://hanja.dict.naver.com/api3/ccko/search";

    @Override
    @Transactional
    public List<HanjaDto> search(String korean) {
        // 1. 캐시(DB) 먼저 조회
        List<HanjaDto> cached = hanjaMapper.findByKorean(korean);
        if (!cached.isEmpty()) {
            log.debug("hanja_dic 캐시 히트: {}", korean);
            return cached;
        }

        // 2. Naver 한자 사전 API 호출
        List<HanjaDto> results = fetchFromNaver(korean);

        // 3. 결과가 있으면 DB에 캐싱
        if (!results.isEmpty()) {
            hanjaMapper.insertBatch(results);
        }

        return results;
    }

    @Override
    @Transactional
    public void add(HanjaDto dto) {
        hanjaMapper.insertOne(dto);
        log.info("한자 수동 추가: {} → {}", dto.getKorean(), dto.getHanja());
    }

    private List<HanjaDto> fetchFromNaver(String korean) {
        List<HanjaDto> results = new ArrayList<>();
        try {
            String url = UriComponentsBuilder.fromHttpUrl(NAVER_HANJA_API)
                    .queryParam("query", korean)
                    .queryParam("m", "pc")
                    .build()
                    .toUriString();

            log.info("Naver 한자 API 호출: {}", url);

            // Naver API는 브라우저 User-Agent 없으면 차단할 수 있음
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36");
            headers.set("Referer", "https://hanja.dict.naver.com/");

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            String body = response.getBody();
            if (body == null) return results;

            log.debug("Naver 응답 (앞 500자): {}", body.length() > 500 ? body.substring(0, 500) : body);

            JsonNode root = objectMapper.readTree(body);

            // 응답 구조: searchResultMap.searchResultListMap.WORD.items[]
            JsonNode items = root
                    .path("searchResultMap")
                    .path("searchResultListMap")
                    .path("WORD")
                    .path("items");

            if (!items.isArray()) {
                log.warn("예상과 다른 응답 구조. 전체 키: {}", root.fieldNames());
                return results;
            }

            for (JsonNode item : items) {
                String hanja = item.path("expEntry").asText("").trim();
                if (hanja.isEmpty()) continue;

                // 뜻: meanInfos[0].means[0].value
                String meaning = "";
                JsonNode meanInfos = item.path("meanInfos");
                if (meanInfos.isArray() && meanInfos.size() > 0) {
                    JsonNode means = meanInfos.get(0).path("means");
                    if (means.isArray() && means.size() > 0) {
                        meaning = means.get(0).path("value").asText("").trim();
                        // HTML 태그 제거
                        meaning = meaning.replaceAll("<[^>]+>", "");
                        if (meaning.length() > 100) meaning = meaning.substring(0, 100) + "…";
                    }
                }

                results.add(HanjaDto.builder()
                        .korean(korean)
                        .hanja(hanja)
                        .meaning(meaning)
                        .build());
            }

            log.info("Naver 한자 검색 결과: {} → {}건", korean, results.size());

        } catch (Exception e) {
            log.warn("Naver 한자 API 호출 실패 ({}): {}", korean, e.getMessage());
        }
        return results;
    }
}
