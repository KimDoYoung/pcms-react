package kr.co.kalpa.pcms.dto.apnode;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class DirectoryCreateDto {
    @NotBlank(message = "폴더 이름을 입력해 주세요.")
    private String name;
    private String parentId; // null이면 루트에 생성
}
