package kr.co.kalpa.pcms.domain.movie.controller;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.movie.dto.HddDto;
import kr.co.kalpa.pcms.domain.movie.dto.HddSearchDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieReviewDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieReviewSearchDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieSearchDto;
import kr.co.kalpa.pcms.domain.movie.service.HddService;
import kr.co.kalpa.pcms.domain.movie.service.MovieReviewService;
import kr.co.kalpa.pcms.domain.movie.service.MovieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/movie")
@Slf4j
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;
    private final MovieReviewService movieReviewService;
    private final HddService hddService;

    // Movie Endpoints
    @GetMapping
    public ResponseEntity<PageResponseDto<MovieDto>> getMovieList(MovieSearchDto searchDto) {
        log.info("getMovieList: {}", searchDto);
        return ResponseEntity.ok(movieService.getList(searchDto));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<MovieDto> getMovie(@PathVariable Long id) {
        log.info("getMovie: {}", id);
        return ResponseEntity.ok(movieService.get(id));
    }

    @PutMapping("/batch/update")
    public ResponseEntity<Map<String, String>> batchModifyMovie(@RequestBody List<MovieDto> movieDtoList) {
        log.info("batchModifyMovie: {} rows", movieDtoList.size());
        movieService.batchModify(movieDtoList);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> modifyMovie(@PathVariable Long id, @RequestBody MovieDto movieDto) {
        log.info("modifyMovie: {}, {}", id, movieDto);
        movieDto.setId(id);
        movieService.modify(movieDto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    // MovieReview Endpoints
    @GetMapping("/review")
    public ResponseEntity<PageResponseDto<MovieReviewDto>> getReviewList(MovieReviewSearchDto searchDto) {
        log.info("getReviewList: {}", searchDto);
        return ResponseEntity.ok(movieReviewService.getList(searchDto));
    }

    @PostMapping("/review")
    public ResponseEntity<Map<String, Long>> registerReview(@RequestBody MovieReviewDto movieReviewDto) {
        log.info("registerReview: {}", movieReviewDto);
        Long id = movieReviewService.register(movieReviewDto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping("/review/{id:[0-9]+}")
    public ResponseEntity<MovieReviewDto> getReview(@PathVariable Long id) {
        log.info("getReview: {}", id);
        return ResponseEntity.ok(movieReviewService.get(id));
    }

    @PutMapping("/review/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> modifyReview(@PathVariable Long id, @RequestBody MovieReviewDto movieReviewDto) {
        log.info("modifyReview: {}, {}", id, movieReviewDto);
        movieReviewDto.setId(id);
        movieReviewService.modify(movieReviewDto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/review/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> removeReview(@PathVariable Long id) {
        log.info("removeReview: {}", id);
        movieReviewService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    // HDD Endpoints
    @GetMapping("/hdd")
    public ResponseEntity<PageResponseDto<HddDto>> getHddList(HddSearchDto searchDto) {
        log.info("getHddList: {}", searchDto);
        return ResponseEntity.ok(hddService.getList(searchDto));
    }

    @GetMapping("/hdd/{id:[0-9]+}")
    public ResponseEntity<HddDto> getHdd(@PathVariable Integer id) {
        log.info("getHdd: {}", id);
        return ResponseEntity.ok(hddService.get(id));
    }

    @PutMapping("/hdd/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> modifyHdd(@PathVariable Integer id, @RequestBody HddDto hddDto) {
        log.info("modifyHdd: {}, {}", id, hddDto);
        hddDto.setId(id);
        hddService.modify(hddDto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }
}
