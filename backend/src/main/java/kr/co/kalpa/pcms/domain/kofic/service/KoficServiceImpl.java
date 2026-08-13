package kr.co.kalpa.pcms.domain.kofic.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.kalpa.pcms.domain.kofic.dto.KoficMovieDto;
import kr.co.kalpa.pcms.domain.kofic.dto.kobis.Director;
import kr.co.kalpa.pcms.domain.kofic.dto.kobis.KoficListResponse;
import kr.co.kalpa.pcms.domain.kofic.dto.kobis.MovieListItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class KoficServiceImpl implements KoficService {

    private static final String LIST_URL = "http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieList.json";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${kofic.key}")
    private String apiKey;

    @Override
    public List<KoficMovieDto> searchMovies(String movieNm, String directorNm, String prdtYear) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(LIST_URL)
                .queryParam("key", apiKey)
                .queryParam("itemPerPage", "100");
        if (movieNm != null && !movieNm.isBlank()) {
            builder.queryParam("movieNm", movieNm);
        }
        if (directorNm != null && !directorNm.isBlank()) {
            builder.queryParam("directorNm", directorNm);
        }
        if (prdtYear != null && !prdtYear.isBlank()) {
            builder.queryParam("prdtStartYear", prdtYear);
            builder.queryParam("prdtEndYear", prdtYear);
        }
        URI uri = builder.build().encode().toUri();

        try {
            log.debug("Requesting KOFIC list URL: {}", uri);
            String json = restTemplate.getForObject(uri, String.class);
            if (json == null || json.isBlank()) {
                return Collections.emptyList();
            }
            KoficListResponse response = objectMapper.readValue(json, KoficListResponse.class);
            if (response.getMovieListResult() == null || response.getMovieListResult().getMovieList() == null) {
                return Collections.emptyList();
            }
            return response.getMovieListResult().getMovieList().stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to fetch KOFIC movie list: movieNm={}, directorNm={}, prdtYear={}", movieNm, directorNm, prdtYear, e);
            throw new RuntimeException("KOFIC 영화목록 조회 실패", e);
        }
    }

    private KoficMovieDto toDto(MovieListItem item) {
        String directorNm = item.getDirectors() == null ? "" : item.getDirectors().stream()
                .map(Director::getPeopleNm)
                .collect(Collectors.joining(", "));
        String companyNm = item.getCompanys() == null || item.getCompanys().isEmpty() ? "" : item.getCompanys().get(0).getCompanyNm();

        return KoficMovieDto.builder()
                .movieCd(item.getMovieCd())
                .movieNm(item.getMovieNm())
                .movieNmEn(item.getMovieNmEn())
                .prdtYear(item.getPrdtYear())
                .openDt(item.getOpenDt())
                .typeNm(item.getTypeNm())
                .nationAlt(item.getNationAlt())
                .genreAlt(item.getGenreAlt())
                .repNationNm(item.getRepNationNm())
                .repGenreNm(item.getRepGenreNm())
                .directorNm(directorNm)
                .companyNm(companyNm)
                .build();
    }
}
