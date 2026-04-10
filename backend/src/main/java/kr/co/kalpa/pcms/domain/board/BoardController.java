package kr.co.kalpa.pcms.domain.board;
import kr.co.kalpa.pcms.domain.board.service.BoardService;
import kr.co.kalpa.pcms.domain.board.dto.BoardDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/boards")
@Slf4j
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping
    public ResponseEntity<Map<String, Long>> register(@Valid @RequestBody BoardDto boardDto) {
        log.info("register board: {}", boardDto);
        Long id = boardService.register(boardDto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<BoardDto> get(@PathVariable Long id) {
        log.info("get board: {}", id);
        return ResponseEntity.ok(boardService.get(id));
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> modify(@Valid @RequestBody BoardDto boardDto) {
        log.info("modify board: {}", boardDto);
        boardService.modify(boardDto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable Long id) {
        log.info("remove board: {}", id);
        boardService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @GetMapping
    public ResponseEntity<List<BoardDto>> getList() {
        log.info("getList boards");
        return ResponseEntity.ok(boardService.getList());
    }
}
