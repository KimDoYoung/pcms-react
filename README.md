# Pcms-React

## 개요

- 개인용 CMS인 Database kdy987_db 관리한다.
- React를 연습하기 위한 프로젝트이면서 실제로 사용하기 위한 것임.
- sqls/kdy987_db_schema.sql.sql에 DB 스키마가 기술되어 있음.
- backend/frontend로 폴더를 나누어서 관리함.
- bm.sh(backend-manage), fm.sh(frontend-manage)로 서버 구동
- backend port는 8585사용 , frontend port는 5173 사용

- project명: pcms-react
- [swagger로 테스트](http://localhost:8585/pcms/swagger-ui/index.html#/)
- React의 연습에 목적이 있음.
- framework의 작성에 목적이 있음.

## 기술스택

### Frontend


| 구분 | 기술 | 안정 버전 | 라이센스 | 역할 |
|------|------|-----------|----------|------|
| 1  | React              | 19.2.4             | MIT          | UI 컴포넌트 라이브러리. 컴포넌트 기반 아키텍처로 재사용 가능한 UI 구축 |
| 2  | Vite               | 6.x                | MIT          | 프론트엔드 빌드 도구 및 개발 서버. 빠른 HMR, 프록시 설정, 프로덕션 번들링 제공 |
| 3  | React Router       | 7.x                | MIT          | 클라이언트 사이드 라우팅. SPA 페이지 전환 및 중첩 라우트 처리 |
| 4  | TypeScript         | 5.7.x              | Apache-2.0   | 정적 타입 시스템. 금융 데이터의 타입 안정성 확보 및 개발 생산성 향상 |
| 5  | Tailwind CSS       | 4.1.x              | MIT          | 유틸리티 기반 CSS 프레임워크. 빠른 UI 스타일링 |
| 6  | shadcn/ui          | latest (CLI 3.8.x) | MIT          | Radix UI 기반 컴포넌트 라이브러리. 버튼, 콤보박스, 탭, 다이얼로그 등 UI 컴포넌트 제공 |
| 7  | AG Grid Community  | 34.3.1             | MIT          | 고성능 데이터 그리드. 가상 스크롤, 셀 편집, 정렬, 필터링, 고정 컬럼 제공 |
| 8  | Zustand            | 5.0.11             | MIT          | 경량 전역 상태관리. 멀티 탭 간 주문 상태 공유, 화면 간 데이터 연동 |
| 9  | React Hook Form    | 7.71.x             | MIT          | 고성능 폼 상태관리. 조회 조건, 주문 입력 등 복잡한 폼 처리 |
| 10 | Zod                | 3.x (LTS)          | MIT          | 스키마 기반 유효성 검증. TypeScript 타입 추론과 런타임 검증 통합 |
| 11 | axios              | 1.7.x              | MIT          | HTTP 클라이언트. 인터셉터 기반 JWT 토큰 자동 첨부, 공통 에러 처리 |
| 12 | TanStack Query     | 5.x                | MIT          | 서버 상태 관리. API 캐싱, 자동 리페치, 뮤테이션 및 낙관적 업데이트 처리 |
| 13 | @milkdown/crepe    | 7.x                | MIT          | Markdown WYSIWYG 에디터. contentType이 markdown인 게시판 글 작성/편집에 사용 |

### Backend

- build tool : gradle
- base package : kr.co.kalpa.pcms

| 구분 | 기술 | 안정 버전 | 라이센스 | 역할 |
|------|------|-----------|----------|------|
| 1 | Java              | 21 (LTS)            | Oracle/GPLv2       | 서버 사이드 언어. 장기 지원(LTS) 버전으로 안정성 보장 |
| 2 | Spring Boot       | 3.4.x               | Apache-2.0         | 백엔드 프레임워크. REST API, 의존성 주입, 자동 설정 제공 |
| 3 | Spring Security   | 6.4.x               | Apache-2.0         | 인증/인가 프레임워크. JWT 필터, 역할 기반 접근 제어(RBAC) |
| 4 | MyBatis           | 3.5.x               | Apache-2.0         | SQL 매퍼 프레임워크. 기존 AssetERP SQL 자산 재활용 및 복잡한 금융 쿼리 처리 |
| 5 | PostgreSQL        | 17.7                | PostgreSQL License | 관계형 데이터베이스. 펀드, 주문, 체결 등 핵심 업무 데이터 저장 |
| 6 | Redis             | 7.4.x (OSS)         | RSALv2/SSPLv1      | 인메모리 데이터 저장소. JWT 토큰 세션 관리, 캐싱, 멱등성 키 관리 |
| 7 | JWT (jjwt)        | 0.12.x              | Apache-2.0         | JSON Web Token 인증. Access/Refresh Token 기반 사용자 인증 |
| 8 | WebSocket (STOMP) | Spring 내장          | Apache-2.0         | 실시간 양방향 통신. KOSPI/KOSDAQ 시세, 체결 알림 실시간 전송 |


## 개발 환경

### DB서버
- postgresql host : jskn.iptime.org, db : cms
- id/pw는 환경변수 : PCMS_MODE의 값에 따라서 .env.{PCMS_MODE} 에 기술되어 있음.


## 실행
- fm.sh
- bm.sh


## 배포

1. frontend부분을 backend의 static으로 복사 한 후에 war를 만든다.
2. 만들어진 war는 jskn(jskn.iptime.org)의 docker 안에서 돌고 있는 tomcat에 배포한다.
3. local에서 개발시 사용하는 .env.<profile>의 환경변수는 모두 application.properties에 값으로 입력된다.
4. .env.<profile> 은 server에서 사용되지 않는다.
5. frontend부분을 backend 즉 springboot 의 resource/static으로 복사하는 것에 따른 영향을 고려해야한다.
    1. security가 static부분을 차단하지 않도록 해야함.
    2. rendering시점에 따라서 dataset이 null 이 될 수 있다.
