package kr.co.kalpa.pcms.domain.tmdb.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.kalpa.pcms.domain.tmdb.dto.TmdbMovieDto;
import kr.co.kalpa.pcms.domain.tmdb.dto.tmdb.TmdbSearchResponse;
import kr.co.kalpa.pcms.domain.tmdb.dto.tmdb.TmdbSearchResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class TmdbServiceImpl implements TmdbService {

    private static final String SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
    private static final String POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${tmdb.api.key}")
    private String apiKey;

    @Override
    public TmdbMovieDto search(String titleKo, String titleEn, String year) {
        boolean hasYear = year != null && !year.isBlank();
        boolean hasTitleEn = titleEn != null && !titleEn.isBlank();

        List<TmdbSearchResult> results;

        if (hasYear) {
            results = callTmdb(titleKo, year);
            if (results.isEmpty() && hasTitleEn) {
                results = callTmdb(titleEn, year);
            }
        } else {
            results = Collections.emptyList();
        }

        if (results.isEmpty()) {
            results = callTmdb(titleKo, null);
            if (results.isEmpty() && hasTitleEn) {
                results = callTmdb(titleEn, null);
            }
        }

        if (results.isEmpty()) {
            return null;
        }
        return toDto(results.get(0));
    }

    private List<TmdbSearchResult> callTmdb(String query, String year) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(SEARCH_URL)
                .queryParam("api_key", apiKey)
                .queryParam("language", "ko-KR")
                .queryParam("query", query);
        if (year != null && !year.isBlank()) {
            builder.queryParam("primary_release_year", year);
        }
        URI uri = builder.build().encode().toUri();

        try {
            log.debug("Requesting TMDB search URL: {}", uri);
            String json = restTemplate.getForObject(uri, String.class);
            if (json == null || json.isBlank()) {
                return Collections.emptyList();
            }
            TmdbSearchResponse response = objectMapper.readValue(json, TmdbSearchResponse.class);
            if (response.getResults() == null) {
                return Collections.emptyList();
            }
            return response.getResults();
        } catch (Exception e) {
            log.error("Failed to fetch TMDB search result: query={}, year={}", query, year, e);
            throw new RuntimeException("TMDB 영화 조회 실패", e);
        }
    }

    @Override
    public ResponseEntity<byte[]> fetchPoster(String posterPath) {
        if (posterPath == null || posterPath.isBlank() || !posterPath.startsWith("/") || posterPath.contains("..")) {
            throw new IllegalArgumentException("잘못된 posterPath: " + posterPath);
        }
        String url = POSTER_BASE_URL + posterPath;
        try {
            log.debug("Requesting TMDB poster URL: {}", url);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, null, byte[].class);
            HttpHeaders headers = new HttpHeaders();
            MediaType contentType = response.getHeaders().getContentType();
            headers.setContentType(contentType != null ? contentType : MediaType.IMAGE_JPEG);
            return new ResponseEntity<>(response.getBody(), headers, response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to fetch TMDB poster: posterPath={}", posterPath, e);
            throw new RuntimeException("TMDB 포스터 조회 실패", e);
        }
    }

    private TmdbMovieDto toDto(TmdbSearchResult result) {
        String posterUrl = result.getPosterPath() == null ? null : POSTER_BASE_URL + result.getPosterPath();
        return TmdbMovieDto.builder()
                .id(result.getId())
                .title(result.getTitle())
                .originalTitle(result.getOriginalTitle())
                .overview(result.getOverview())
                .posterPath(result.getPosterPath())
                .posterUrl(posterUrl)
                .releaseDate(result.getReleaseDate())
                .voteAverage(result.getVoteAverage())
                .popularity(result.getPopularity())
                .originalLanguage(result.getOriginalLanguage())
                .build();
    }
}
