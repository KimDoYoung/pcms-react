package kr.co.kalpa.pcms.domain.board;

import java.util.List;

public interface BoardService {
    Long register(BoardDto boardDto);
    BoardDto get(Long id);
    void modify(BoardDto boardDto);
    void remove(Long id);
    List<BoardDto> getList();
}
