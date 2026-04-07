package kr.co.kalpa.pcms.domain.todo;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoDto {
    private Long id;

    @NotBlank(message = "내용을 입력해 주세요.")
    private String content;

    private OffsetDateTime createdAt;
}
