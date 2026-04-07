package kr.co.kalpa.pcms.domain.todo.service;
import kr.co.kalpa.pcms.domain.todo.entity.Todo;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface TodoMapper {
    void insertTodo(Todo todo);
    void insertTodoList(List<Todo> todoList);
    List<Todo> selectTodoList();
    void deleteTodo(Long id);
}
