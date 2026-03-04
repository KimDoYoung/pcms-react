package kr.co.kalpa.pcms.dto.diary;

import kr.co.kalpa.pcms.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DiarySearchDto extends PageRequestDto {
    private String startYmd;
    private String endYmd;
    private String keyword;
}
