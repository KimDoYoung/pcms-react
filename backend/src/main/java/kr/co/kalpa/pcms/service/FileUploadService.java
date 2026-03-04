package kr.co.kalpa.pcms.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileUploadService {

    /**
     * HTML content에서 base64 이미지를 추출해 디스크에 저장하고 URL로 치환한다.
     * files 테이블에 기록하며, file_match 연결은 호출자가 linkFiles로 처리한다.
     */
    ProcessResult processEditorImages(String content);

    /**
     * 첨부파일을 디스크에 저장하고 files 테이블에 기록한다. fileId를 반환한다.
     */
    Long saveAttachment(MultipartFile file);

    /**
     * file_match 테이블에 파일 연결 정보를 기록한다.
     */
    void linkFiles(String tableName, Long targetId, List<Long> fileIds, String fileType);

    record ProcessResult(String content, List<Long> fileIds) {}
}
