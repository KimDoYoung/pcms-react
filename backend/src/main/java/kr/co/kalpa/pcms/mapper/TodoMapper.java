package kr.co.kalpa.pcms.mapper;

import kr.co.kalpa.pcms.domain.Todo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface TodoMapper {
    void insertTodo(Todo todo);
    void insertTodoList(List<Todo> todoList);
    List<Todo> selectTodoList();
    void deleteTodo(Long id);
}
