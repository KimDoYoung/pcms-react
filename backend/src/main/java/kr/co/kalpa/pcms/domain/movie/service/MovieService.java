package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieSearchDto;

import java.util.List;

public interface MovieService {
    PageResponseDto<MovieDto> getList(MovieSearchDto searchDto);
    void modify(MovieDto movieDto);
    void batchModify(List<MovieDto> movieDtoList);
    MovieDto get(Long id);
}
