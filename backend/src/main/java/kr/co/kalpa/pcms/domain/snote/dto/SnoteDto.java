package kr.co.kalpa.pcms.domain.snote.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SnoteDto {
    private Long id;
    private String title;
    private String note;
    private OffsetDateTime createDt;
}
