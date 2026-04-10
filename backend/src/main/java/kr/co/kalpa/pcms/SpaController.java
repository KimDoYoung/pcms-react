package kr.co.kalpa.pcms;

import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * React SPA 라우팅 지원 컨트롤러.
 * /pcms/diary, /pcms/jangbi 등 브라우저 직접 접근(새로고침) 시
 * Spring Boot가 index.html로 forward해서 React Router가 처리하도록 함.
 * API 경로(/health, /auth/**, /diary/** 등)는 각 RestController가 먼저 처리하므로 충돌 없음.
 */
@Profile("!development")
@Controller
public class SpaController {

    @GetMapping(value = {
        "/",
        "/login",
        "/user-info",
        "/settings",
        "/calendar",
        "/calendar/**",
        "/diary",
        "/diary/**",
        "/jangbi",
        "/jangbi/**",
        "/boards",
        "/posts",
        "/posts/**",
        "/apnode",
        "/apnode/**",
        "/practice/**",
    }, produces = MediaType.TEXT_HTML_VALUE)
    public String forward() {
        return "forward:/index.html";
    }
}
