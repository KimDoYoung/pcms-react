package kr.co.kalpa.pcms.utility.emoji.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmojiSearchResultDto {
    private String emoji;
    private String name;
    private String keywords;
    private String code;
}
