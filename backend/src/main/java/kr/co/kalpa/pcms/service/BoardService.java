package kr.co.kalpa.pcms.service;

import kr.co.kalpa.pcms.dto.BoardDto;

import java.util.List;

public interface BoardService {
    Long register(BoardDto boardDto);
    BoardDto get(Long id);
    void modify(BoardDto boardDto);
    void remove(Long id);
    List<BoardDto> getList();
}
