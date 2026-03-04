package kr.co.kalpa.pcms.service.impl;

import kr.co.kalpa.pcms.domain.Board;
import kr.co.kalpa.pcms.dto.BoardDto;
import kr.co.kalpa.pcms.mapper.BoardMapper;
import kr.co.kalpa.pcms.service.BoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BoardServiceImpl implements BoardService {

    private final BoardMapper boardMapper;

    @Override
    public Long register(BoardDto boardDto) {
        Board board = Board.builder()
                .boardCode(boardDto.getBoardCode())
                .boardNameKor(boardDto.getBoardNameKor())
                .contentType(boardDto.getContentType() != null ? boardDto.getContentType() : "html")
                .description(boardDto.getDescription())
                .build();
        boardMapper.insertBoard(board);
        return board.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public BoardDto get(Long id) {
        Board board = boardMapper.selectBoardById(id)
                .orElseThrow(() -> new RuntimeException("Board not found: " + id));
        return toDto(board);
    }

    @Override
    public void modify(BoardDto boardDto) {
        Board board = Board.builder()
                .id(boardDto.getId())
                .boardCode(boardDto.getBoardCode())
                .boardNameKor(boardDto.getBoardNameKor())
                .contentType(boardDto.getContentType())
                .description(boardDto.getDescription())
                .build();
        boardMapper.updateBoard(board);
    }

    @Override
    public void remove(Long id) {
        int postCount = boardMapper.selectPostCountByBoardId(id);
        if (postCount > 0) {
            throw new IllegalStateException("게시글이 존재하는 게시판은 삭제할 수 없습니다.");
        }
        boardMapper.deleteBoard(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BoardDto> getList() {
        return boardMapper.selectBoardList().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private BoardDto toDto(Board board) {
        return BoardDto.builder()
                .id(board.getId())
                .boardCode(board.getBoardCode())
                .boardNameKor(board.getBoardNameKor())
                .contentType(board.getContentType())
                .description(board.getDescription())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }
}
