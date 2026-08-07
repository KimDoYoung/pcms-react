package kr.co.kalpa.pcms.domain.asset.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Asset {
    private Long id;
    private String atype;
    private String name;
    private String value;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
