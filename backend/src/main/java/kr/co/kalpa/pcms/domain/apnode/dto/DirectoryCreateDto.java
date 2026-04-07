package kr.co.kalpa.pcms.domain.apnode.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class DirectoryCreateDto {
    @NotBlank(message = "폴더 이름을 입력해 주세요.")
    private String name;
    private String parentId;
}
