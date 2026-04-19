package kr.co.kalpa.pcms.domain.snote.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Snote {
    private Long id;
    private String title;
    private String note;
    private OffsetDateTime createDt;
}
