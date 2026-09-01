package kr.co.kalpa.pcms.domain.file.service;

import org.springframework.web.multipart.MultipartFile;

public interface PdfService {

    /**
     * HTML 문자열을 Gotenberg 서버를 통해 PDF 바이너리(byte[])로 변환합니다.
     *
     * @param htmlContent 변환할 HTML 문서 전문
     * @return PDF 바이너리 데이터
     */
    byte[] convertHtmlToPdf(String htmlContent);

    /**
     * 업로드된 파일(Office, HTML, Markdown, Text, Image 등)을 Gotenberg 서버를 통해 PDF 바이너리로 변환합니다.
     *
     * @param file 변환할 원본 파일
     * @param landscape 가로 방향 여부
     * @return PDF 바이너리 데이터
     */
    byte[] convertFileToPdf(MultipartFile file, boolean landscape);
}
