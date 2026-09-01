package kr.co.kalpa.pcms.domain.file.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class PdfServiceImpl implements PdfService {

    private static final Set<String> LIBREOFFICE_EXTENSIONS = Set.of(
            "docx", "doc", "pptx", "ppt", "xlsx", "xls", "csv", "txt", "rtf", "odt", "ods", "odp"
    );

    private static final Set<String> IMAGE_EXTENSIONS = Set.of(
            "png", "jpg", "jpeg", "webp", "gif", "bmp"
    );

    @Value("${gotenberg.url:http://jskn.iptime.org/gotenberg}")
    private String gotenbergUrl;

    @Override
    public byte[] convertHtmlToPdf(String htmlContent) {
        if (htmlContent == null || htmlContent.isBlank()) {
            throw new IllegalArgumentException("변환할 HTML 내용이 비어있습니다.");
        }

        String targetUrl = gotenbergUrl.replaceAll("/+$", "") + "/forms/chromium/convert/html";
        log.info("Gotenberg PDF 변환 요청(HTML): targetUrl={}, contentSize={} bytes", targetUrl, htmlContent.length());

        RestTemplate restTemplate = createRestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        ByteArrayResource htmlResource = new ByteArrayResource(htmlContent.getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return "index.html";
            }
        };

        body.add("files", htmlResource);
        body.add("preferCssPageSize", "true");
        body.add("printBackground", "true");
        body.add("waitDelay", "1s");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.postForEntity(targetUrl, requestEntity, byte[].class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Gotenberg PDF 변환 성공: pdfSize={} bytes", response.getBody().length);
                return response.getBody();
            } else {
                throw new IllegalStateException("Gotenberg 서버 응답 오류: HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Gotenberg PDF 변환 실패: {}", e.getMessage(), e);
            throw new IllegalStateException("PDF 변환 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] convertFileToPdf(MultipartFile file, boolean landscape) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("변환할 파일이 비어있습니다.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String ext = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx > 0) {
            ext = originalFilename.substring(dotIdx + 1).toLowerCase();
        }

        log.info("Gotenberg 파일 PDF 변환 요청: filename={}, ext={}, size={} bytes, landscape={}",
                originalFilename, ext, file.getSize(), landscape);

        try {
            byte[] fileBytes = file.getBytes();

            if ("html".equals(ext) || "htm".equals(ext)) {
                String htmlContent = new String(fileBytes, StandardCharsets.UTF_8);
                return convertHtmlWithLandscape(htmlContent, landscape);
            } else if ("md".equals(ext) || "markdown".equals(ext)) {
                String mdContent = new String(fileBytes, StandardCharsets.UTF_8);
                String wrappedHtml = wrapMarkdownToHtml(originalFilename, mdContent, landscape);
                return convertHtmlToPdf(wrappedHtml);
            } else if (IMAGE_EXTENSIONS.contains(ext)) {
                String mimeType = "image/" + ("jpg".equals(ext) ? "jpeg" : ext);
                String base64Img = Base64.getEncoder().encodeToString(fileBytes);
                String imgHtml = wrapImageToHtml(originalFilename, mimeType, base64Img, landscape);
                return convertHtmlToPdf(imgHtml);
            } else if (LIBREOFFICE_EXTENSIONS.contains(ext)) {
                return convertViaLibreOffice(fileBytes, originalFilename, landscape);
            } else {
                // 기타 형식은 LibreOffice로 시도
                return convertViaLibreOffice(fileBytes, originalFilename, landscape);
            }
        } catch (IOException e) {
            log.error("파일 읽기 실패: {}", e.getMessage(), e);
            throw new IllegalStateException("파일을 읽는 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    private byte[] convertViaLibreOffice(byte[] fileBytes, String originalFilename, boolean landscape) {
        String targetUrl = gotenbergUrl.replaceAll("/+$", "") + "/forms/libreoffice/convert";
        log.info("Gotenberg LibreOffice 변환 요청: targetUrl={}, filename={}", targetUrl, originalFilename);

        RestTemplate restTemplate = createRestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        ByteArrayResource resource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return originalFilename;
            }
        };

        body.add("files", resource);
        if (landscape) {
            body.add("landscape", "true");
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.postForEntity(targetUrl, requestEntity, byte[].class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Gotenberg LibreOffice 변환 성공: pdfSize={} bytes", response.getBody().length);
                return response.getBody();
            } else {
                throw new IllegalStateException("Gotenberg 서버 응답 오류: HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Gotenberg LibreOffice 변환 실패: {}", e.getMessage(), e);
            throw new IllegalStateException("Office 문서 PDF 변환 실패: " + e.getMessage(), e);
        }
    }

    private byte[] convertHtmlWithLandscape(String htmlContent, boolean landscape) {
        String targetUrl = gotenbergUrl.replaceAll("/+$", "") + "/forms/chromium/convert/html";

        RestTemplate restTemplate = createRestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource htmlResource = new ByteArrayResource(htmlContent.getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return "index.html";
            }
        };

        body.add("files", htmlResource);
        body.add("preferCssPageSize", "true");
        body.add("printBackground", "true");
        body.add("waitDelay", "1s");
        if (landscape) {
            body.add("landscape", "true");
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<byte[]> response = restTemplate.postForEntity(targetUrl, requestEntity, byte[].class);
        return response.getBody();
    }

    private String wrapMarkdownToHtml(String filename, String mdContent, boolean landscape) {
        String pageSize = landscape ? "A4 landscape" : "A4 portrait";
        return "<!doctype html>\n" +
                "<html lang=\"ko\">\n" +
                "<head>\n" +
                "<meta charset=\"UTF-8\">\n" +
                "<title>" + escapeHtml(filename) + "</title>\n" +
                "<style>\n" +
                "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');\n" +
                "@page { size: " + pageSize + "; margin: 15mm; }\n" +
                "body { font-family: Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 0; font-size: 14px; }\n" +
                "h1 { font-size: 20px; font-weight: 800; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }\n" +
                "pre { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; white-space: pre-wrap; word-break: break-all; font-family: ui-monospace, Menlo, monospace; }\n" +
                "</style>\n" +
                "</head>\n" +
                "<body>\n" +
                "<h1>" + escapeHtml(filename) + "</h1>\n" +
                "<pre>" + escapeHtml(mdContent) + "</pre>\n" +
                "</body>\n" +
                "</html>";
    }

    private String wrapImageToHtml(String filename, String mimeType, String base64Img, boolean landscape) {
        String pageSize = landscape ? "A4 landscape" : "A4 portrait";
        return "<!doctype html>\n" +
                "<html lang=\"ko\">\n" +
                "<head>\n" +
                "<meta charset=\"UTF-8\">\n" +
                "<title>" + escapeHtml(filename) + "</title>\n" +
                "<style>\n" +
                "@page { size: " + pageSize + "; margin: 10mm; }\n" +
                "body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }\n" +
                "img { max-width: 100%; max-height: 100%; object-fit: contain; }\n" +
                "</style>\n" +
                "</head>\n" +
                "<body>\n" +
                "<img src=\"data:" + mimeType + ";base64," + base64Img + "\" alt=\"" + escapeHtml(filename) + "\">\n" +
                "</body>\n" +
                "</html>";
    }

    private RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10000); // 10초
        requestFactory.setReadTimeout(60000);    // 60초 (대용량 Office 문서 변환 고려)
        return new RestTemplate(requestFactory);
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#039;");
    }
}
