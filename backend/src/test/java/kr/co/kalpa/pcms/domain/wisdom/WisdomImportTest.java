package kr.co.kalpa.pcms.domain.wisdom;

import kr.co.kalpa.pcms.domain.wisdom.entity.Wisdom;
import kr.co.kalpa.pcms.domain.wisdom.service.WisdomMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@ActiveProfiles("development")
@SpringBootTest
public class WisdomImportTest {

    @Autowired
    private WisdomMapper wisdomMapper;

    @Test
    @Transactional
    @Rollback(false)
    public void importWisdomsFromTextFile() throws Exception {
        File file = new File("../docs/1.txt");
        if (!file.exists()) {
            file = new File("docs/1.txt");
        }
        if (!file.exists()) {
            file = new File("/home/kdy987/work/pcms-react/docs/1.txt");
        }

        String content = Files.readString(file.toPath(), StandardCharsets.UTF_8);
        log.info("파일 크기: {} bytes", content.length());

        // 번호. 본문 패턴 매칭
        Pattern pattern = Pattern.compile("(?s)(?:^|\\s+)(\\d+)\\.\\s*(.*?)(?=(?:\\s+\\d+\\.\\s*|$))");
        Matcher matcher = pattern.matcher(content);

        List<Wisdom> list = new ArrayList<>();
        int seq = 1;

        while (matcher.find()) {
            String numStr = matcher.group(1);
            String raw = matcher.group(2).trim();
            if (raw.isEmpty()) continue;

            String document;
            String author = null;

            if (raw.contains("/")) {
                int lastSlash = raw.lastIndexOf("/");
                document = raw.substring(0, lastSlash).trim();
                author = raw.substring(lastSlash + 1).trim();
            } else if (raw.contains(" – ")) {
                int idx = raw.lastIndexOf(" – ");
                document = raw.substring(0, idx).trim();
                author = raw.substring(idx + 3).trim();
            } else if (raw.contains(" - ")) {
                int idx = raw.lastIndexOf(" - ");
                document = raw.substring(0, idx).trim();
                author = raw.substring(idx + 3).trim();
            } else if (raw.contains(" –")) {
                int idx = raw.lastIndexOf(" –");
                document = raw.substring(0, idx).trim();
                author = raw.substring(idx + 2).trim();
            } else if (raw.contains(" -")) {
                int idx = raw.lastIndexOf(" -");
                document = raw.substring(0, idx).trim();
                author = raw.substring(idx + 2).trim();
            } else {
                document = raw;
            }

            if (author != null && (author.isEmpty() || author.equals("."))) {
                author = null;
            }

            int num;
            try {
                num = Integer.parseInt(numStr);
            } catch (NumberFormatException e) {
                num = seq;
            }

            String id = String.format("quote_%03d", num);

            Wisdom wisdom = Wisdom.builder()
                    .id(id)
                    .domain("LIFE")
                    .category("LIFE")
                    .document(document)
                    .authorSource(author)
                    .keywords(null)
                    .contextTrigger(null)
                    .build();

            list.add(wisdom);
            seq++;
        }

        log.info("총 파싱된 명언 수: {}", list.size());

        int inserted = 0;
        int updated = 0;

        for (Wisdom w : list) {
            if (wisdomMapper.existsById(w.getId()) > 0) {
                wisdomMapper.updateWisdom(w);
                updated++;
            } else {
                wisdomMapper.insertWisdom(w);
                inserted++;
            }
        }

        log.info("적재 완료! 신규 등록: {}, 기존 수정: {}, 전체 처리: {}", inserted, updated, list.size());
    }

    @Test
    @Transactional
    @Rollback(false)
    public void importStockWisdomsFromTextFile() throws Exception {
        File file = new File("../docs/2.txt");
        if (!file.exists()) {
            file = new File("docs/2.txt");
        }
        if (!file.exists()) {
            file = new File("/home/kdy987/work/pcms-react/docs/2.txt");
        }

        String content = Files.readString(file.toPath(), StandardCharsets.UTF_8);
        log.info("2.txt 파일 크기: {} bytes", content.length());

        // HTML 태그 및 엔티티 치환
        String cleaned = content
                .replaceAll("(?i)<br\\s*/?>", " ")
                .replaceAll("&gt;", ">")
                .replaceAll("&lt;", "<")
                .replaceAll("&amp;", "&")
                .replaceAll("&nbsp;", " ")
                .replaceAll("(?i)<div[^>]*>", "")
                .replaceAll("(?i)</div>", "")
                .replaceAll("(?i)</p>", "\n")
                .replaceAll("(?i)<p>", "");

        // 각 줄 파싱 및 번호 패턴 매칭
        // 번호. 본문 패턴 매칭
        Pattern pattern = Pattern.compile("(?s)(?:^|\\s+)(\\d+)\\.\\s*(.*?)(?=(?:\\s+\\d+\\.\\s*|$))");
        Matcher matcher = pattern.matcher(cleaned);

        List<Wisdom> list = new ArrayList<>();
        int seq = 1;

        while (matcher.find()) {
            String raw = matcher.group(2).trim();
            if (raw.isEmpty()) continue;

            // 연속 공백 및 개행 정제
            raw = raw.replaceAll("[\\t\\r\\n]+", " ").replaceAll(" +", " ").trim();

            String id = String.format("prv_%03d", seq);

            Wisdom wisdom = Wisdom.builder()
                    .id(id)
                    .domain("STOCK")
                    .category("STOCK")
                    .document(raw)
                    .authorSource(null)
                    .keywords(null)
                    .contextTrigger(null)
                    .build();

            list.add(wisdom);
            seq++;
        }

        log.info("총 파싱된 주식 격언 수: {}", list.size());

        int inserted = 0;
        int updated = 0;

        for (Wisdom w : list) {
            if (wisdomMapper.existsById(w.getId()) > 0) {
                wisdomMapper.updateWisdom(w);
                updated++;
            } else {
                wisdomMapper.insertWisdom(w);
                inserted++;
            }
        }

        log.info("주식 격언 적재 완료! 신규 등록: {}, 기존 수정: {}, 전체 처리: {}", inserted, updated, list.size());
    }
}
