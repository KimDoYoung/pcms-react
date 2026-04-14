package kr.co.kalpa.pcms.domain.movie.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HddDto {
    private Integer id;
    private String volumnName;
    private String gubun;
    private String path;
    private String fileName;
    private String name;
    private String pdir;
    private String extension;
    private Double size;
    private String sha1Cd;
    private String srchKey;
    private String lastModifiedYmd;
    private Integer pid;
    private Integer rightPid;
}
