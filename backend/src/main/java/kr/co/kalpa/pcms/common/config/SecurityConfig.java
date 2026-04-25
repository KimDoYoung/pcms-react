package kr.co.kalpa.pcms.common.config;

import kr.co.kalpa.pcms.common.security.JwtAccessDeniedHandler;
import kr.co.kalpa.pcms.common.security.JwtAuthenticationEntryPoint;
import kr.co.kalpa.pcms.common.security.JwtFilter;
import kr.co.kalpa.pcms.common.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;

    @Value("${pcms.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    new AntPathRequestMatcher("/auth/**"),
                    new AntPathRequestMatcher("/todo/**"),
                    new AntPathRequestMatcher("/swagger-ui/**"),
                    new AntPathRequestMatcher("/swagger-ui.html"),
                    new AntPathRequestMatcher("/v3/api-docs/**"),
                    new AntPathRequestMatcher("/health"),
                    new AntPathRequestMatcher("/error"),
                    new AntPathRequestMatcher("/editor-images/**"),
                    new AntPathRequestMatcher("/apnodes/**"),
                    new AntPathRequestMatcher("/temp/**"),
                    // React SPA 정적 파일 및 라우트 (Security는 API 레벨에서 적용)
                    new AntPathRequestMatcher("/"),
                    new AntPathRequestMatcher("/index.html"),
                    new AntPathRequestMatcher("/*.js"),
                    new AntPathRequestMatcher("/*.css"),
                    new AntPathRequestMatcher("/*.ico"),
                    new AntPathRequestMatcher("/*.png"),
                    new AntPathRequestMatcher("/*.svg"),
                    new AntPathRequestMatcher("/assets/**"),
                    new AntPathRequestMatcher("/login"),
                    new AntPathRequestMatcher("/user-info"),
                    new AntPathRequestMatcher("/settings"),
                    new AntPathRequestMatcher("/calendar"),
                    new AntPathRequestMatcher("/calendar/**"),
                    new AntPathRequestMatcher("/diary"),
                    new AntPathRequestMatcher("/diary/**"),
                    new AntPathRequestMatcher("/jangbi"),
                    new AntPathRequestMatcher("/jangbi/**"),
                    new AntPathRequestMatcher("/boards"),
                    new AntPathRequestMatcher("/posts"),
                    new AntPathRequestMatcher("/posts/**"),
                    new AntPathRequestMatcher("/apnode"),
                    new AntPathRequestMatcher("/apnode/**"),
                    new AntPathRequestMatcher("/practice/**")
                ).permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .addFilterBefore(new JwtFilter(jwtUtil, redisTemplate), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
