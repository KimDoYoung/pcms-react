package kr.co.kalpa.pcms.domain.usersettings;

import kr.co.kalpa.pcms.domain.usersettings.dto.UserSettingDto;
import kr.co.kalpa.pcms.domain.usersettings.service.UserSettingsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 사용자별 범용 key-value 개인 설정 저장소.
 * 특정 도메인(예: 이미지 에디터 기본 스타일)에 종속되지 않는 범용 API로,
 * key/value는 호출하는 기능이 자유롭게 정의해 사용한다.
 */
@RestController
@RequestMapping("/admin/user-settings")
@Slf4j
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    @GetMapping("/{key}")
    public ResponseEntity<UserSettingDto> get(@PathVariable String key) {
        return ResponseEntity.ok(userSettingsService.get(key));
    }

    @PostMapping
    public ResponseEntity<Void> upsert(@RequestBody @Valid UserSettingDto dto) {
        log.info("upsert user-setting: key={}", dto.getKey());
        userSettingsService.upsert(dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<Void> remove(@PathVariable String key) {
        log.info("remove user-setting: key={}", key);
        userSettingsService.remove(key);
        return ResponseEntity.ok().build();
    }
}
