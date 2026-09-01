package kr.co.kalpa.pcms.utility.emoji;

import kr.co.kalpa.pcms.utility.emoji.dto.EmojiSearchResultDto;
import kr.co.kalpa.pcms.utility.emoji.service.EmojiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/utility/emoji")
@RequiredArgsConstructor
public class EmojiController {

    private final EmojiService emojiService;

    @GetMapping("/search")
    public ResponseEntity<List<EmojiSearchResultDto>> search(
            @RequestParam(value = "keyword", required = false, defaultValue = "") String keyword) {
        log.info("이모지 검색 요청: keyword='{}'", keyword);
        return ResponseEntity.ok(emojiService.search(keyword));
    }
}
