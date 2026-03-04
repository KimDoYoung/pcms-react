package kr.co.kalpa.pcms.dto.apnode;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class NodeRenameDto {
    @NotBlank(message = "변경할 이름을 입력해 주세요.")
    private String name;
}
