package kr.co.kalpa.pcms.domain.todo;

import java.util.List;

public interface TodoService {
    List<TodoDto> register(List<String> contents);
    List<TodoDto> getList();
    void remove(Long id);
}
