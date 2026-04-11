# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

개인용 CMS (`kdy987_db` PostgreSQL 관리) 프로젝트이며, **동시에 재사용 가능한 풀스택 프레임워크를 완성하는 것이 궁극적인 목적**이다. 이 프로젝트 자체가 다음 프로젝트에서 바로 가져다 쓸 수 있는 보일러플레이트/템플릿 역할을 한다.

따라서 코드 작업 시 **재사용성과 일관성**을 항상 최우선으로 고려해야 한다. 특정 도메인에 종속된 구현보다는 범용적으로 쓸 수 있는 구조와 패턴을 정립하는 방향으로 작업한다.

풀스택 모노레포 구조: React 프론트엔드 (포트 5173) + Spring Boot 백엔드 (포트 8585).

## 목적

- 이 프로젝트는 springboot + react framework를 만들려고 하는데 목적이 있음.
- react study에 목적이 있음

## 명령어

### project command
```bash
# frontend
fm.sh
# backend
bm.sh
```
### utility command
```bash
psql ... # postgresql db접속 .env.fedora or .env.home 을 참조
redis-cli # redis 접속 
redis-cli -h jskn.iptime.org -p 6379 -a "kalpa987!" 
```

### 백엔드 환경 설정
- PCMS_MODE가 설정되어있어야 함. 개발시 development로 설정됨
- 이 설정값에 의해서 application.properties, application-<PCMS_MODE value>.properties를 사용하게 됨

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
- **디자인** : shadcn을 주로 사용하기로 함

## Page를 만들때 원칙

- 날짜관련 표현은 lib/Utils.ts에 있는 함수를 우선적으로 사용한다.
- 페이지의 main div는  `<main className="container mx-auto px-4 py-6">`  을 사용한다.