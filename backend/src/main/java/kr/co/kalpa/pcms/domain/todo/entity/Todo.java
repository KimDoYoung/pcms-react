package kr.co.kalpa.pcms.domain.todo.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Todo {
    private Long id;
    private String content;
    private OffsetDateTime createdAt;
}
