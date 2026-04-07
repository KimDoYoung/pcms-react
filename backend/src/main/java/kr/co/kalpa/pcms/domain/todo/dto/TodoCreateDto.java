package kr.co.kalpa.pcms.domain.todo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TodoCreateDto {

    @NotEmpty(message = "할 일 목록이 비어 있습니다.")
    @Valid
    private List<@jakarta.validation.constraints.NotBlank(message = "내용을 입력해 주세요.") String> contents;
}
