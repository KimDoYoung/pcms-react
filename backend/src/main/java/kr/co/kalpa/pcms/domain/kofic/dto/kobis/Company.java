package kr.co.kalpa.pcms.domain.kofic.dto.kobis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Company {
    private String companyCd;
    private String companyNm;
    private String companyNmEn;
    private String companyPartNm;
}
