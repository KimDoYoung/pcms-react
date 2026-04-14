package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieReviewDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieReviewSearchDto;

public interface MovieReviewService {
    Long register(MovieReviewDto movieReviewDto);
    MovieReviewDto get(Long id);
    void modify(MovieReviewDto movieReviewDto);
    void remove(Long id);
    PageResponseDto<MovieReviewDto> getList(MovieReviewSearchDto searchDto);
}
