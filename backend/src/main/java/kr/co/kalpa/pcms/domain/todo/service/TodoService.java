package kr.co.kalpa.pcms.domain.todo.service;
import kr.co.kalpa.pcms.domain.todo.dto.TodoDto;

import java.util.List;

public interface TodoService {
    List<TodoDto> register(List<String> contents);
    List<TodoDto> getList();
    void remove(Long id);
}
