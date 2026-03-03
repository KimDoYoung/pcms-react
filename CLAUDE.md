# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

개인용 CMS (`kdy987_db` PostgreSQL 관리) 프로젝트이며, **동시에 재사용 가능한 풀스택 프레임워크를 완성하는 것이 궁극적인 목적**이다. 이 프로젝트 자체가 다음 프로젝트에서 바로 가져다 쓸 수 있는 보일러플레이트/템플릿 역할을 한다.

따라서 코드 작업 시 **재사용성과 일관성**을 항상 최우선으로 고려해야 한다. 특정 도메인에 종속된 구현보다는 범용적으로 쓸 수 있는 구조와 패턴을 정립하는 방향으로 작업한다.

풀스택 모노레포 구조: React 프론트엔드 (포트 5173) + Spring Boot 백엔드 (포트 8585).

## 명령어

### 프론트엔드 (`cd frontend`)
```bash
npm run dev       # 개발 서버 실행 (포트 5173)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint
npm run preview   # 프로덕션 빌드 미리보기
```

루트에서 스크립트 사용:
```bash
./fm.sh dev | build | lint | clean | install
```

### 백엔드 (`cd backend`)
```bash
./gradlew bootRun         # 개발 서버 실행 (포트 8585)
./gradlew clean build     # 전체 빌드 (테스트 포함)
./gradlew test            # 테스트만 실행
./gradlew bootWar         # 배포용 WAR 빌드
```

루트에서 스크립트 사용:
```bash
./bm.sh run | build | war | test | compile | clean | status | log
```

### 백엔드 환경 설정
`_PROFILE` 환경변수로 프로필 지정 (예: `export _PROFILE=fedora`). 해당 프로필의 `application-<profile>.properties`를 로드하며, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` 정의가 필요함.

## 아키텍처

### 프론트엔드 (`frontend/src/`)
- **라우팅**: React Router v7 (SPA)
- **전역 상태**: Zustand
- **서버 상태 / API 캐싱**: TanStack Query
- **폼 상태**: React Hook Form + Zod 스키마 검증
- **HTTP 클라이언트**: Axios (JWT 인터셉터 적용)
- **UI**: shadcn/ui (Radix) + Tailwind CSS v4 + AG Grid Community
- **경로 별칭**: `@/` → `src/`

### 백엔드 (`backend/src/main/java/kr/co/kalpa/pcms/`)
- **계층 구조**: Controller → Service → Mapper (MyBatis)
- **컨텍스트 패스**: `/pcms`
- **인증**: JWT (Access + Refresh 토큰), Redis로 로그아웃 즉시 무효화
- **SQL**: MyBatis XML 매퍼 위치: `src/main/resources/mapper/`
- **패키지 구조**: `kr.co.kalpa.pcms.<기능>` (예: `board`, `calendar`, `auth`)
- **Swagger**: `/pcms/swagger-ui.html`

### 데이터베이스
스키마 정의: `sqls/kdy987_db_schema.sql` (PostgreSQL). 주요 테이블: `users`, `diary`, `boards`, `posts`, `calendar`, `todo`, `files`, `file_match`, `ap_node`, `ap_file` (Unix 파일 트리 구조).

## 개발 지침

- **라이브러리 임의 추가 금지**: 기존 스택 우선 사용 (상태관리 → Zustand, 스타일링 → Tailwind 등).
- **DB 작업 시**: MyBatis 쿼리 작성 전 `sqls/kdy987_db_schema.sql`에서 테이블 구조와 제약조건 반드시 확인.
- **백엔드 네이밍**: DB 컬럼은 snake_case, Java 필드는 camelCase. Lombok `@Getter`, `@Builder`, `@Slf4j` 사용이 표준.
- **주석**: *왜(Why)* 를 설명하는 주석만 제한적으로 추가. 불필요한 주석 지양.
- **설계 문서**: `docs/설계.md` (아키텍처 결정사항), `docs/frontend-init.md` (프론트엔드 초기 세팅 내역).
