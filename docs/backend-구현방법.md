# backend 구현

## 전체 패키지 구조

```
kr.co.kalpa.pcms/
├── PcmsApplication.java
├── common/
│   ├── config/          # SecurityConfig, SwaggerConfig, RedisConfig, FileProperties, GlobalExceptionHandler
│   ├── security/        # JwtFilter, JwtUtil, JwtAccessDeniedHandler, JwtAuthenticationEntryPoint
│   └── dto/             # PageRequestDto, PageResponseDto
└── domain/
    ├── auth/
    │   ├── entity/      # User.java
    │   ├── dto/         # LoginRequestDto.java, TokenResponseDto.java
    │   ├── service/     # UserMapper.java, AuthService.java, AuthServiceImpl.java
    │   └── AuthController.java
    ├── board/
    │   ├── entity/      # Board.java, Post.java
    │   ├── dto/         # BoardDto.java, PostDto.java, PostSearchDto.java
    │   ├── service/     # BoardMapper.java, PostMapper.java, BoardService/Impl.java, PostService/Impl.java
    │   ├── BoardController.java
    │   └── PostController.java
    ├── diary/           # (board와 동일한 구조)
    ├── jangbi/          # (board와 동일한 구조)
    ├── todo/            # (board와 동일한 구조)
    ├── file/
    │   ├── entity/      # CmsFile.java, FileMatch.java
    │   ├── dto/         # AttachmentDto.java
    │   └── service/     # FileMapper.java, FileUploadService.java, FileUploadServiceImpl.java
    ├── apnode/
    │   ├── entity/      # ApNode.java, ApFile.java
    │   ├── dto/         # ApNodeDto.java, DirectoryCreateDto.java, FileDownloadDto.java, ...
    │   ├── service/     # ApNodeMapper.java, ApFileMapper.java, ApNodeService/Impl.java
    │   └── ApNodeController.java
    └── system/
        └── SystemController.java

resources/mapper/
├── auth/UserMapper.xml
├── board/BoardMapper.xml, PostMapper.xml
├── diary/DiaryMapper.xml
├── jangbi/JangbiMapper.xml
├── todo/TodoMapper.xml
├── file/FileMapper.xml
└── apnode/ApNodeMapper.xml, ApFileMapper.xml
```

---

## domain 별 폴더 구성

각 도메인 폴더는 다음 4가지 요소로 구성된다.

| 폴더/파일 | 역할 | 예시 |
|-----------|------|------|
| `entity/` | DB 테이블과 1:1 매핑되는 내부 객체 | `Todo.java` |
| `dto/` | API 요청/응답 데이터 전송 객체 | `TodoDto.java`, `TodoCreateDto.java` |
| `service/` | Mapper 인터페이스 + Service 인터페이스 + ServiceImpl | `TodoMapper.java`, `TodoService.java`, `TodoServiceImpl.java` |
| `XxxController.java` | HTTP 요청 진입점, domain 루트에 위치 | `TodoController.java` |

### entity vs dto 역할 구분

**Entity** (`entity/XxxEntity.java`)
- DB 테이블과 1:1 매핑되는 내부 객체
- MyBatis가 ResultSet → Java 객체로 변환할 때 사용
- 외부(클라이언트)에 직접 노출하지 않음
- `@Getter`, `@Builder`만 사용하고 setter 없음 (불변 지향)

**DTO** (`dto/XxxDto.java`)
- Controller ↔ 클라이언트 간 데이터 전송 객체
- `@NotBlank` 등 validation 어노테이션 포함
- 외부 API 요청/응답 형태를 정의
- `@Data` (`@Getter` + `@Setter`)로 Jackson 직렬화 대응

**데이터 흐름:**
```
HTTP 요청 → [Controller] → XxxDto (validation)
         → [Service] → Xxx (Entity, DB 매핑) → DB

DB → Xxx (Entity) → [Service] → XxxDto (직렬화) → HTTP 응답
```

---

## 새 도메인 추가 구현 순서

예를 들어 `calendar` 도메인을 추가한다면:

### 1. DB 테이블 생성
`sqls/kdy987_db_schema.sql`에 테이블 정의를 추가한다.

### 2. 폴더 생성
```
domain/calendar/
├── entity/
├── dto/
└── service/
```

### 3. Entity 작성 (`entity/Calendar.java`)
```java
package kr.co.kalpa.pcms.domain.calendar.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Calendar {
    private Long id;
    private String title;
    private String startDt;
    private String endDt;
    private OffsetDateTime createdAt;
}
```

### 4. DTO 작성 (`dto/CalendarDto.java`)
```java
package kr.co.kalpa.pcms.domain.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarDto {
    private Long id;

    @NotBlank(message = "제목을 입력해 주세요.")
    private String title;

    private String startDt;
    private String endDt;
    private OffsetDateTime createdAt;
}
```

페이징 검색이 필요하다면 `CalendarSearchDto.java`도 추가한다:
```java
package kr.co.kalpa.pcms.domain.calendar.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CalendarSearchDto extends PageRequestDto {
    private String keyword;
}
```

### 5. Mapper 인터페이스 작성 (`service/CalendarMapper.java`)
```java
package kr.co.kalpa.pcms.domain.calendar.service;

import kr.co.kalpa.pcms.domain.calendar.entity.Calendar;
import kr.co.kalpa.pcms.domain.calendar.dto.CalendarSearchDto;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Optional;

@Mapper
public interface CalendarMapper {
    void insertCalendar(Calendar calendar);
    Optional<Calendar> selectCalendarById(Long id);
    void updateCalendar(Calendar calendar);
    void deleteCalendar(Long id);
    List<Calendar> selectCalendarList(CalendarSearchDto searchDto);
    int selectCalendarCount(CalendarSearchDto searchDto);
}
```

### 6. Service 인터페이스 작성 (`service/CalendarService.java`)
```java
package kr.co.kalpa.pcms.domain.calendar.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.calendar.dto.CalendarDto;
import kr.co.kalpa.pcms.domain.calendar.dto.CalendarSearchDto;

public interface CalendarService {
    Long register(CalendarDto dto);
    CalendarDto get(Long id);
    void modify(CalendarDto dto);
    void remove(Long id);
    PageResponseDto<CalendarDto> getList(CalendarSearchDto searchDto);
}
```

### 7. ServiceImpl 작성 (`service/CalendarServiceImpl.java`)
```java
package kr.co.kalpa.pcms.domain.calendar.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.calendar.entity.Calendar;
import kr.co.kalpa.pcms.domain.calendar.dto.CalendarDto;
import kr.co.kalpa.pcms.domain.calendar.dto.CalendarSearchDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CalendarServiceImpl implements CalendarService {

    private final CalendarMapper calendarMapper;

    @Override
    public Long register(CalendarDto dto) {
        Calendar calendar = Calendar.builder()
                .title(dto.getTitle())
                .startDt(dto.getStartDt())
                .endDt(dto.getEndDt())
                .build();
        calendarMapper.insertCalendar(calendar);
        return calendar.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public CalendarDto get(Long id) {
        Calendar calendar = calendarMapper.selectCalendarById(id)
                .orElseThrow(() -> new RuntimeException("Calendar not found: " + id));
        return toDto(calendar);
    }

    @Override
    public void modify(CalendarDto dto) {
        Calendar calendar = Calendar.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .startDt(dto.getStartDt())
                .endDt(dto.getEndDt())
                .build();
        calendarMapper.updateCalendar(calendar);
    }

    @Override
    public void remove(Long id) {
        calendarMapper.deleteCalendar(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<CalendarDto> getList(CalendarSearchDto searchDto) {
        List<Calendar> list = calendarMapper.selectCalendarList(searchDto);
        int total = calendarMapper.selectCalendarCount(searchDto);
        List<CalendarDto> dtoList = list.stream().map(this::toDto).collect(Collectors.toList());
        return PageResponseDto.<CalendarDto>withAll()
                .dtoList(dtoList).total(total).pageRequestDto(searchDto).build();
    }

    private CalendarDto toDto(Calendar c) {
        return CalendarDto.builder()
                .id(c.getId())
                .title(c.getTitle())
                .startDt(c.getStartDt())
                .endDt(c.getEndDt())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
```

### 8. Controller 작성 (`CalendarController.java` — domain 루트에 위치)
```java
package kr.co.kalpa.pcms.domain.calendar;

import jakarta.validation.Valid;
import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.calendar.dto.CalendarDto;
import kr.co.kalpa.pcms.domain.calendar.dto.CalendarSearchDto;
import kr.co.kalpa.pcms.domain.calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/calendar")
@Slf4j
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    @PostMapping
    public ResponseEntity<Map<String, Long>> register(@Valid @RequestBody CalendarDto dto) {
        return ResponseEntity.ok(Map.of("id", calendarService.register(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalendarDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(calendarService.get(id));
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> modify(@Valid @RequestBody CalendarDto dto) {
        calendarService.modify(dto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> remove(@PathVariable Long id) {
        calendarService.remove(id);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @GetMapping
    public ResponseEntity<PageResponseDto<CalendarDto>> getList(CalendarSearchDto searchDto) {
        return ResponseEntity.ok(calendarService.getList(searchDto));
    }
}
```

### 9. MyBatis XML Mapper 작성 (`resources/mapper/calendar/CalendarMapper.xml`)
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="kr.co.kalpa.pcms.domain.calendar.service.CalendarMapper">

    <insert id="insertCalendar" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO cms.calendar (title, start_dt, end_dt)
        VALUES (#{title}, #{startDt}, #{endDt})
    </insert>

    <select id="selectCalendarById" resultType="kr.co.kalpa.pcms.domain.calendar.entity.Calendar">
        SELECT id, title, start_dt as startDt, end_dt as endDt, created_at as createdAt
        FROM cms.calendar WHERE id = #{id}
    </select>

    <update id="updateCalendar">
        UPDATE cms.calendar
        SET title = #{title}, start_dt = #{startDt}, end_dt = #{endDt}
        WHERE id = #{id}
    </update>

    <delete id="deleteCalendar">
        DELETE FROM cms.calendar WHERE id = #{id}
    </delete>

    <select id="selectCalendarList" resultType="kr.co.kalpa.pcms.domain.calendar.entity.Calendar">
        SELECT id, title, start_dt as startDt, end_dt as endDt, created_at as createdAt
        FROM cms.calendar
        <where>
            <if test="keyword != null and keyword != ''">
                AND title LIKE CONCAT('%', #{keyword}, '%')
            </if>
        </where>
        ORDER BY id DESC
        LIMIT #{size} OFFSET #{skip}
    </select>

    <select id="selectCalendarCount" resultType="int">
        SELECT count(*) FROM cms.calendar
        <where>
            <if test="keyword != null and keyword != ''">
                AND title LIKE CONCAT('%', #{keyword}, '%')
            </if>
        </where>
    </select>

</mapper>
```

---

## 첨부파일이 있는 도메인 구현 시 추가 사항

`diary`, `jangbi`, `post` 처럼 에디터 이미지 또는 첨부파일을 지원하려면:

1. **DTO**에 다음 필드 추가:
   ```java
   import kr.co.kalpa.pcms.domain.file.dto.AttachmentDto;

   private Integer attachmentCount;             // 목록에서 파일 개수 표시
   private List<Long> deletedAttachmentIds;     // 수정 시 삭제할 파일 ID
   private List<AttachmentDto> attachments;     // 단건 조회 시 파일 목록
   ```

2. **ServiceImpl**에 `FileUploadService` 주입:
   ```java
   import kr.co.kalpa.pcms.domain.file.service.FileUploadService;

   private final FileUploadService fileUploadService;
   ```

3. Controller에서 `@RequestPart`로 파일 수신:
   ```java
   @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
   public ResponseEntity<...> register(
       @RequestPart("data") @Valid XxxDto dto,
       @RequestPart(value = "files", required = false) List<MultipartFile> files)
   ```

---

## MyBatis XML 작성 규칙

- **namespace**: `kr.co.kalpa.pcms.domain.<도메인>.service.<도메인>Mapper`
- **resultType**: `kr.co.kalpa.pcms.domain.<도메인>.entity.<엔티티명>`
- DB 컬럼은 `snake_case`, Java 필드는 `camelCase` → XML에서 alias로 매핑
  ```xml
  created_at as createdAt
  ```
- 페이징: `LIMIT #{size} OFFSET #{skip}` (`PageRequestDto`의 `getSkip()` 활용)

---

## 네이밍 컨벤션

| 요소 | 규칙 | 예시 |
|------|------|------|
| Entity | 도메인 명사 | `Calendar`, `Post`, `Todo` |
| DTO | Entity명 + `Dto` | `CalendarDto`, `PostDto` |
| SearchDto | Entity명 + `SearchDto` (PageRequestDto 상속) | `CalendarSearchDto` |
| Mapper | Entity명 + `Mapper` | `CalendarMapper` |
| Service | Entity명 + `Service` | `CalendarService` |
| ServiceImpl | Entity명 + `ServiceImpl` | `CalendarServiceImpl` |
| Controller | Entity명 + `Controller` | `CalendarController` |
| XML mapper | `resources/mapper/<도메인>/` 하위 | `mapper/calendar/CalendarMapper.xml` |
