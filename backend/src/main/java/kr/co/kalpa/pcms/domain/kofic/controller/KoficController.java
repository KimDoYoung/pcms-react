package kr.co.kalpa.pcms.domain.kofic.controller;

import kr.co.kalpa.pcms.domain.kofic.dto.KoficMovieDto;
import kr.co.kalpa.pcms.domain.kofic.service.KoficService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/kofic")
@Slf4j
@RequiredArgsConstructor
public class KoficController {

    private final KoficService koficService;

    @GetMapping("/movies")
    public ResponseEntity<List<KoficMovieDto>> searchMovies(
            @RequestParam(required = false) String movieNm,
            @RequestParam(required = false) String directorNm,
            @RequestParam(required = false) String prdtYear) {
        log.info("searchMovies: movieNm={}, directorNm={}, prdtYear={}", movieNm, directorNm, prdtYear);
        return ResponseEntity.ok(koficService.searchMovies(movieNm, directorNm, prdtYear));
    }
}
