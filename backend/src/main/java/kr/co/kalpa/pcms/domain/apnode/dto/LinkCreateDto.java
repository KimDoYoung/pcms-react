package kr.co.kalpa.pcms.domain.apnode.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class LinkCreateDto {
    @NotBlank(message = "링크 이름을 입력해 주세요.")
    private String name;
    private String parentId;

    @NotBlank(message = "대상 노드를 지정해 주세요.")
    private String targetId;
}
