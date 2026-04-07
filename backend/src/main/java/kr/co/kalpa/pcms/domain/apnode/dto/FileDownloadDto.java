package kr.co.kalpa.pcms.domain.apnode.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FileDownloadDto {
    private String savedPath;
    private String originalName;
    private String contentType;
}
