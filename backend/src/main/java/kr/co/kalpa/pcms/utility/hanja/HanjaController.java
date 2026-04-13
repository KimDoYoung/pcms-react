package kr.co.kalpa.pcms.utility.hanja;

import kr.co.kalpa.pcms.utility.hanja.dto.HanjaDto;
import kr.co.kalpa.pcms.utility.hanja.service.HanjaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/utility/hanja")
@RequiredArgsConstructor
public class HanjaController {

    private final HanjaService hanjaService;

    @GetMapping("/search")
    public ResponseEntity<List<HanjaDto>> search(@RequestParam String word) {
        log.info("한자 검색 요청: {}", word);
        return ResponseEntity.ok(hanjaService.search(word));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> add(@RequestBody HanjaDto dto) {
        log.info("한자 수동 추가 요청: {} → {}", dto.getKorean(), dto.getHanja());
        hanjaService.add(dto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }
}
