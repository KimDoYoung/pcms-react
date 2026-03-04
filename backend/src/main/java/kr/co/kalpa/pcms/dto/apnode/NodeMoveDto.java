package kr.co.kalpa.pcms.dto.apnode;

import lombok.Getter;

@Getter
public class NodeMoveDto {
    private String targetParentId; // null이면 루트로 이동
}
