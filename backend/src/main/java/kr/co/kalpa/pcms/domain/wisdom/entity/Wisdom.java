package kr.co.kalpa.pcms.domain.wisdom.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Wisdom {
    private String id;
    private String domain;
    private String document;
    private String category;
    private String authorSource;
    private List<String> keywords;
    private String contextTrigger;
    private OffsetDateTime lastModifiedAt;
}
