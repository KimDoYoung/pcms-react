package kr.co.kalpa.pcms.utility.emoji;

import kr.co.kalpa.pcms.utility.emoji.dto.EmojiSearchResultDto;
import kr.co.kalpa.pcms.utility.emoji.service.EmojiServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmojiServiceTest {

    @Test
    @DisplayName("검색어가 비어있을 때 빈 리스트 반환")
    void search_emptyKeyword_returnsEmptyList() {
        EmojiServiceImpl service = new EmojiServiceImpl();
        ReflectionTestUtils.setField(service, "emojiSearchUrl", "https://www.emojiall.com/ko/search_results");

        List<EmojiSearchResultDto> result = service.search("");
        assertThat(result).isEmpty();

        result = service.search("   ");
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("한글 키워드 '산' 검색 시 산 관련 이모지 반환")
    void search_mountain_returnsResults() {
        EmojiServiceImpl service = new EmojiServiceImpl();
        ReflectionTestUtils.setField(service, "emojiSearchUrl", "https://www.emojiall.com/ko/search_results");

        List<EmojiSearchResultDto> result = service.search("산");
        assertThat(result).isNotEmpty();
        assertThat(result.stream().anyMatch(e -> e.getName().contains("산") || e.getEmoji().equals("⛰️") || e.getEmoji().equals("🛘"))).isTrue();
    }

    @Test
    @DisplayName("한글 키워드 '스프' 검색 시 결과 반환")
    void search_soup_returnsResults() {
        EmojiServiceImpl service = new EmojiServiceImpl();
        ReflectionTestUtils.setField(service, "emojiSearchUrl", "https://www.emojiall.com/ko/search_results");

        List<EmojiSearchResultDto> result = service.search("스프");
        assertThat(result).isNotEmpty();
        assertThat(result.stream().anyMatch(e -> e.getName().contains("스프") || e.getEmoji().equals("🍲"))).isTrue();
    }

    @Test
    @DisplayName("동일 키워드 재검색 시 캐시 히트 동작")
    void search_cache_works() {
        EmojiServiceImpl service = new EmojiServiceImpl();
        ReflectionTestUtils.setField(service, "emojiSearchUrl", "https://www.emojiall.com/ko/search_results");

        List<EmojiSearchResultDto> result1 = service.search("하트");
        List<EmojiSearchResultDto> result2 = service.search("하트");

        assertThat(result1).isNotEmpty();
        assertThat(result2).isEqualTo(result1);
    }
}
