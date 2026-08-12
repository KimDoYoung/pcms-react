package kr.co.kalpa.pcms.domain.imageeditor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageWorkDto {
    private Long id;
    private String title;
    private String jsonData;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
