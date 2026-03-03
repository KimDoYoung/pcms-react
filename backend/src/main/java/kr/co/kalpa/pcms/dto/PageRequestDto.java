package kr.co.kalpa.pcms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageRequestDto {
    @Builder.Default
    private int page = 1;
    
    @Builder.Default
    private int size = 10;
    
    private String startYmd;
    private String endYmd;
    private String keyword;

    public int getSkip() {
        return (page - 1) * size;
    }
}
