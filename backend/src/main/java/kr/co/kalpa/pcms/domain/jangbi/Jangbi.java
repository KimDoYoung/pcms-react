package kr.co.kalpa.pcms.domain.jangbi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Jangbi {
    private Long id;
    private String ymd;
    private String item;
    private String location;
    private Integer cost;
    private String spec;
    private String lvl;
    private OffsetDateTime modifyDt;
    private Integer attachmentCount;
}
