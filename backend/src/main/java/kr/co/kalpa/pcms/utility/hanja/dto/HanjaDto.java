package kr.co.kalpa.pcms.utility.hanja.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HanjaDto {
    private String korean;   // 검색한 한글 단어
    private String hanja;    // 한자 문자 (e.g. 運命)
    private String meaning;  // 뜻풀이
}
