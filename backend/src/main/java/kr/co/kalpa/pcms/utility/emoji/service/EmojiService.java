package kr.co.kalpa.pcms.utility.emoji.service;

import kr.co.kalpa.pcms.utility.emoji.dto.EmojiSearchResultDto;

import java.util.List;

public interface EmojiService {

    /**
     * 검색어로 이모지를 검색합니다.
     *
     * @param keyword 한글 또는 영문 검색어
     * @return 검색된 이모지 목록
     */
    List<EmojiSearchResultDto> search(String keyword);
}
