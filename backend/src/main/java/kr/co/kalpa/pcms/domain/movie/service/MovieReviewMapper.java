package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.domain.movie.dto.MovieReviewSearchDto;
import kr.co.kalpa.pcms.domain.movie.entity.MovieReview;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface MovieReviewMapper {
    void insert(MovieReview movieReview);
    MovieReview selectOne(Long id);
    void update(MovieReview movieReview);
    void delete(Long id);
    List<MovieReview> selectList(MovieReviewSearchDto searchDto);
    int selectCount(MovieReviewSearchDto searchDto);
}
