package kr.co.kalpa.pcms.common.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PageRequestDto {
    private int page = 1;
    private int size = 10;

    public int getSkip() {
        return (page - 1) * size;
    }
}
