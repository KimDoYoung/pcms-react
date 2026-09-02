package kr.co.kalpa.pcms.domain.wisdom.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.wisdom.dto.WisdomDto;
import kr.co.kalpa.pcms.domain.wisdom.dto.WisdomSearchDto;
import kr.co.kalpa.pcms.domain.wisdom.entity.Wisdom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WisdomServiceImpl implements WisdomService {

    private final WisdomMapper wisdomMapper;

    @Override
    public String register(WisdomDto dto) {
        String id = dto.getId();
        if (id == null || id.trim().isEmpty()) {
            id = generateAutoId(dto.getDomain());
        } else {
            id = id.trim();
            if (wisdomMapper.existsById(id) > 0) {
                throw new IllegalArgumentException("이미 존재하는 ID입니다: " + id);
            }
        }

        Wisdom wisdom = Wisdom.builder()
                .id(id)
                .domain(dto.getDomain().trim())
                .document(dto.getDocument().trim())
                .category(dto.getCategory().trim())
                .authorSource(dto.getAuthorSource() != null ? dto.getAuthorSource().trim() : null)
                .keywords(dto.getKeywords())
                .contextTrigger(dto.getContextTrigger() != null ? dto.getContextTrigger().trim() : null)
                .build();

        wisdomMapper.insertWisdom(wisdom);
        return id;
    }

    @Override
    @Transactional(readOnly = true)
    public WisdomDto get(String id) {
        Wisdom wisdom = wisdomMapper.selectWisdomById(id)
                .orElseThrow(() -> new IllegalArgumentException("격언 정보를 찾을 수 없습니다. ID: " + id));
        return toDto(wisdom);
    }

    @Override
    public void modify(WisdomDto dto) {
        if (dto.getId() == null || dto.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("수정할 격언 ID가 유효하지 않습니다.");
        }

        Wisdom wisdom = Wisdom.builder()
                .id(dto.getId().trim())
                .domain(dto.getDomain().trim())
                .document(dto.getDocument().trim())
                .category(dto.getCategory().trim())
                .authorSource(dto.getAuthorSource() != null ? dto.getAuthorSource().trim() : null)
                .keywords(dto.getKeywords())
                .contextTrigger(dto.getContextTrigger() != null ? dto.getContextTrigger().trim() : null)
                .build();

        int rows = wisdomMapper.updateWisdom(wisdom);
        if (rows == 0) {
            throw new IllegalArgumentException("수정 대상이 존재하지 않습니다. ID: " + dto.getId());
        }
    }

    @Override
    public void remove(String id) {
        int rows = wisdomMapper.deleteWisdom(id);
        if (rows == 0) {
            throw new IllegalArgumentException("삭제 대상이 존재하지 않습니다. ID: " + id);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<WisdomDto> getList(WisdomSearchDto searchDto) {
        List<Wisdom> list = wisdomMapper.selectWisdomList(searchDto);
        int total = wisdomMapper.selectWisdomCount(searchDto);

        List<WisdomDto> dtoList = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponseDto.<WisdomDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(searchDto)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDomains() {
        return wisdomMapper.selectDomains();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCategories(String domain) {
        return wisdomMapper.selectCategories(domain);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(String id) {
        return wisdomMapper.existsById(id) > 0;
    }

    @Override
    @Transactional(readOnly = true)
    public WisdomDto getRandom(String domain, String category, String contextTrigger) {
        return wisdomMapper.selectRandomWisdom(domain, category, contextTrigger)
                .map(this::toDto)
                .orElse(null);
    }

    private String generateAutoId(String domain) {
        String prefix;
        if ("STOCK".equalsIgnoreCase(domain)) {
            prefix = "prv_";
        } else if ("LIFE".equalsIgnoreCase(domain)) {
            prefix = "quote_";
        } else if (domain != null && !domain.trim().isEmpty()) {
            prefix = domain.trim().toLowerCase() + "_";
        } else {
            prefix = "wsd_";
        }
        return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private WisdomDto toDto(Wisdom wisdom) {
        return WisdomDto.builder()
                .id(wisdom.getId())
                .domain(wisdom.getDomain())
                .document(wisdom.getDocument())
                .category(wisdom.getCategory())
                .authorSource(wisdom.getAuthorSource())
                .keywords(wisdom.getKeywords())
                .contextTrigger(wisdom.getContextTrigger())
                .lastModifiedAt(wisdom.getLastModifiedAt())
                .build();
    }
}
