package kr.co.kalpa.pcms.domain.tmdb.service;

import kr.co.kalpa.pcms.domain.tmdb.dto.TmdbMovieDto;
import org.springframework.http.ResponseEntity;

public interface TmdbService {
    TmdbMovieDto search(String titleKo, String titleEn, String year);

    ResponseEntity<byte[]> fetchPoster(String posterPath);
}
