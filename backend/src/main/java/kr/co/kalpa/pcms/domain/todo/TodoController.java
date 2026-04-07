package kr.co.kalpa.pcms.domain.todo;
import kr.co.kalpa.pcms.domain.todo.service.TodoService;
import kr.co.kalpa.pcms.domain.todo.dto.TodoDto;
import kr.co.kalpa.pcms.domain.todo.dto.TodoCreateDto;

import jakarta.validation.Valid;
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

    @PostMapping
    public ResponseEntity<List<TodoDto>> create(@Valid @RequestBody TodoCreateDto createDto) {
        List<TodoDto> result = todoService.register(createDto.getContents());
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<TodoDto>> list() {
        return ResponseEntity.ok(todoService.getList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        todoService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }
}
