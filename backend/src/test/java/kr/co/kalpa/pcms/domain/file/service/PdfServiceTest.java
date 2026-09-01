package kr.co.kalpa.pcms.domain.file.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PdfServiceTest {

    @Test
    @DisplayName("HTML 내용이 비어있으면 IllegalArgumentException 예외 발생")
    void convertHtmlToPdf_emptyHtml_throwsException() {
        PdfServiceImpl pdfService = new PdfServiceImpl();

        assertThatThrownBy(() -> pdfService.convertHtmlToPdf(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("비어있습니다");

        assertThatThrownBy(() -> pdfService.convertHtmlToPdf(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Gotenberg 서버를 통한 실제 HTML to PDF 변환 테스트")
    void convertHtmlToPdf_success() {
        PdfServiceImpl pdfService = new PdfServiceImpl();
        ReflectionTestUtils.setField(pdfService, "gotenbergUrl", "http://jskn.iptime.org/gotenberg");

        String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Test</title></head><body><h1>Hello PDF</h1></body></html>";
        byte[] pdf = pdfService.convertHtmlToPdf(html);

        assertThat(pdf).isNotNull();
        assertThat(pdf.length).isGreaterThan(0);
        // PDF 파일 시그니처 (%PDF-)
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
    }

    @Test
    @DisplayName("Gotenberg LibreOffice를 통한 텍스트/문서 파일 PDF 변환 테스트")
    void convertFileToPdf_libreOffice_success() {
        PdfServiceImpl pdfService = new PdfServiceImpl();
        ReflectionTestUtils.setField(pdfService, "gotenbergUrl", "http://jskn.iptime.org/gotenberg");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.txt",
                "text/plain",
                "Hello LibreOffice PDF conversion test!".getBytes(StandardCharsets.UTF_8)
        );

        byte[] pdf = pdfService.convertFileToPdf(file, false);

        assertThat(pdf).isNotNull();
        assertThat(pdf.length).isGreaterThan(0);
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
    }

    @Test
    @DisplayName("Gotenberg Chromium을 통한 마크다운 파일 PDF 변환 테스트")
    void convertFileToPdf_markdown_success() {
        PdfServiceImpl pdfService = new PdfServiceImpl();
        ReflectionTestUtils.setField(pdfService, "gotenbergUrl", "http://jskn.iptime.org/gotenberg");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "guide.md",
                "text/markdown",
                "# 마크다운 문서 변환\n- 항목 1\n- 항목 2\n".getBytes(StandardCharsets.UTF_8)
        );

        byte[] pdf = pdfService.convertFileToPdf(file, false);

        assertThat(pdf).isNotNull();
        assertThat(pdf.length).isGreaterThan(0);
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
    }
}
