package kr.co.kalpa.pcms.service;

import kr.co.kalpa.pcms.dto.TodoDto;

import java.util.List;

public interface TodoService {
    List<TodoDto> register(List<String> contents);
    List<TodoDto> getList();
    void remove(Long id);
}
