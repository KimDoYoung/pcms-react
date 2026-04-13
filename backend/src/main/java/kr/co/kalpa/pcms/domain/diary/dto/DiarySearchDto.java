package kr.co.kalpa.pcms.domain.diary.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DiarySearchDto extends PageRequestDto {
    private String startYmd;
    private String endYmd;
    private String keyword;
    private String sort = "desc"; // asc | desc
}
