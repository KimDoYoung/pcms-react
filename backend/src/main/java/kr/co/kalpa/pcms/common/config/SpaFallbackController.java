package kr.co.kalpa.pcms.common.config;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * React SPA 라우팅 지원: API(/pcms/**)에 해당하지 않는 모든 경로에서 index.html을 반환한다.
 * context-path(/pcms) 밖의 요청이므로 Spring Security 필터를 거치지 않아도 됨.
 */
@RestController
public class SpaFallbackController {

    private final Resource indexHtml = new ClassPathResource("static/index.html");

    // 각 세그먼트에 확장자(.)가 없는 경로만 매칭 → assets/xxx.css 등 static 파일 요청은 제외됨
    @RequestMapping(value = {
        "/{p1:[^\\.]+}",
        "/{p1:[^\\.]+}/{p2:[^\\.]+}",
        "/{p1:[^\\.]+}/{p2:[^\\.]+}/{p3:[^\\.]+}",
        "/{p1:[^\\.]+}/{p2:[^\\.]+}/{p3:[^\\.]+}/{p4:[^\\.]+}",
    })
    public ResponseEntity<Resource> spa() {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(indexHtml);
    }
}
