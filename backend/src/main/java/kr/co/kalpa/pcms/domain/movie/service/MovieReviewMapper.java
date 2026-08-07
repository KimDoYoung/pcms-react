package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.domain.movie.dto.MovieReviewSearchDto;
import kr.co.kalpa.pcms.domain.movie.entity.MovieReview;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface MovieReviewMapper {
    void insert(MovieReview movieReview);
    Long selectMaxId();
    MovieReview selectOne(Long id);
    void update(MovieReview movieReview);
    void delete(Long id);
    List<MovieReview> selectList(MovieReviewSearchDto searchDto);
    int selectCount(MovieReviewSearchDto searchDto);
    Long selectPrevId(Map<String, Object> params);
    Long selectNextId(Map<String, Object> params);
}
