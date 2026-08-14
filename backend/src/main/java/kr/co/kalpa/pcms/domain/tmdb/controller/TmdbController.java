package kr.co.kalpa.pcms.domain.tmdb.controller;

import kr.co.kalpa.pcms.domain.tmdb.dto.TmdbMovieDto;
import kr.co.kalpa.pcms.domain.tmdb.service.TmdbService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tmdb")
@Slf4j
@RequiredArgsConstructor
public class TmdbController {

    private final TmdbService tmdbService;

    @GetMapping("/search")
    public ResponseEntity<TmdbMovieDto> search(
            @RequestParam(required = false) String titleKo,
            @RequestParam(required = false) String titleEn,
            @RequestParam(required = false) String year) {
        log.info("search: titleKo={}, titleEn={}, year={}", titleKo, titleEn, year);
        TmdbMovieDto movie = tmdbService.search(titleKo, titleEn, year);
        if (movie == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(movie);
    }

    @GetMapping("/poster")
    public ResponseEntity<byte[]> getPoster(@RequestParam String path) {
        log.info("getPoster: path={}", path);
        return tmdbService.fetchPoster(path);
    }
}
