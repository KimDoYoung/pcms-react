package kr.co.kalpa.pcms.mapper;

import kr.co.kalpa.pcms.domain.Board;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface BoardMapper {
    void insertBoard(Board board);
    Optional<Board> selectBoardById(Long id);
    void updateBoard(Board board);
    void deleteBoard(Long id);
    List<Board> selectBoardList();
    int selectPostCountByBoardId(Long boardId);
}
