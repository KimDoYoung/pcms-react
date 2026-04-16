package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.domain.movie.dto.MovieSearchDto;
import kr.co.kalpa.pcms.domain.movie.entity.Movie;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MovieMapper {
    List<Movie> selectList(MovieSearchDto searchDto);
    int selectCount(MovieSearchDto searchDto);
    Movie selectOne(Long id);
    void update(Movie movie);
}
