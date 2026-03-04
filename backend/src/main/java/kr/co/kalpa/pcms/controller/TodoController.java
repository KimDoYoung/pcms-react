package kr.co.kalpa.pcms.controller;

import jakarta.validation.Valid;
import kr.co.kalpa.pcms.dto.TodoDto;
import kr.co.kalpa.pcms.dto.todo.TodoCreateDto;
import kr.co.kalpa.pcms.service.TodoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/todo")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    /**
     * 할 일 목록 등록 (배열로 contents를 받아서 저장)
     */
    @PostMapping
    public ResponseEntity<List<TodoDto>> create(@Valid @RequestBody TodoCreateDto createDto) {
        List<TodoDto> result = todoService.register(createDto.getContents());
        return ResponseEntity.ok(result);
    }

    /**
     * 할 일 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<TodoDto>> list() {
        return ResponseEntity.ok(todoService.getList());
    }

    /**
     * 할 일 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        todoService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }
}
