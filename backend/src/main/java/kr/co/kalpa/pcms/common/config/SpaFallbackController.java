package kr.co.kalpa.pcms.common.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

/**
 * React SPA 라우팅 지원: API(/pcms/**)에 해당하지 않는 모든 경로에서 index.html을 반환한다.
 * context-path(/pcms) 밖의 요청이므로 Spring Security 필터를 거치지 않아도 됨.
 */
@RestController
public class SpaFallbackController {

    private final Resource indexHtml = new ClassPathResource("static/index.html");

    @RequestMapping(value = { "/{path:[^\\.]*}", "/{path:[^\\.]*}/**" })
    public ResponseEntity<Resource> spa(HttpServletRequest request) {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(indexHtml);
    }
}
