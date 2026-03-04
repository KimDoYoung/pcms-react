package kr.co.kalpa.pcms.dto.apnode;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FileDownloadDto {
    private String savedPath;
    private String originalName;
    private String contentType;
}
