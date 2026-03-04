package kr.co.kalpa.pcms.service.impl;

import kr.co.kalpa.pcms.domain.Todo;
import kr.co.kalpa.pcms.dto.TodoDto;
import kr.co.kalpa.pcms.mapper.TodoMapper;
import kr.co.kalpa.pcms.service.TodoService;
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
public class TodoServiceImpl implements TodoService {

    private final TodoMapper todoMapper;

    @Override
    public List<TodoDto> register(List<String> contents) {
        List<Todo> todoList = contents.stream()
                .map(content -> Todo.builder().content(content).build())
                .collect(Collectors.toList());

        todoMapper.insertTodoList(todoList);

        return todoList.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TodoDto> getList() {
        return todoMapper.selectTodoList().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public void remove(Long id) {
        todoMapper.deleteTodo(id);
    }

    private TodoDto toDto(Todo todo) {
        return TodoDto.builder()
                .id(todo.getId())
                .content(todo.getContent())
                .createdAt(todo.getCreatedAt())
                .build();
    }
}
