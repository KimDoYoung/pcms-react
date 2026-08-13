package kr.co.kalpa.pcms.domain.kofic.dto.kobis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Director {
    private String peopleNm;
    private String peopleNmEn;
}
