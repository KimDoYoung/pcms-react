package kr.co.kalpa.pcms.domain.imageeditor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageWorkListDto {
    private long totalCount;
    private List<ImageWorkDto> list;
}
