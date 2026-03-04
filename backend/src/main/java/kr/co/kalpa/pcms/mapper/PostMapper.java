package kr.co.kalpa.pcms.mapper;

import kr.co.kalpa.pcms.domain.Post;
import kr.co.kalpa.pcms.dto.board.PostSearchDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface PostMapper {
    void insertPost(Post post);
    Optional<Post> selectPostById(Long id);
    void updatePost(Post post);
    void deletePost(Long id);
    void incrementViewCount(Long id);
    List<Post> selectPostList(PostSearchDto searchDto);
    int selectPostCount(PostSearchDto searchDto);
}
