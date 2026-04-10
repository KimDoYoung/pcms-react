---
name: teach-pcms-react
description: Pcms-React 에 사용된 frontend 기술스택에 대해 code와 설명을 곁들인 markdown문서를 생성한다.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob
argument-hint: "어떤 기술에 대한 연습을 할 수 있는 문서를 만들어 줘"
---


# React기술문서작성

## 개요

- 개발자인데 frontend 기술스택에 대한 개발에는 다소 경험이 부족한 개발자를 가르치는 문서를 작성한다.

## 문서작성 방법

- $HOME/work/pcms-react 프로젝트에서 사용된 frontend 기술스택에 대해서 사용자가 직접 코딩하면서 연습할 수 있는 markdown문서를 작성한다.
- markdown 문서는 $HOME/work/pcms-react/docs/teach/ 폴더에 작성한다.
- file명은 적절한 문서명으로 한글과 영어를 조합하여 작성한다. 예시) tailwindcss-기본-사용법.md
- 문서에는 기술스택에 대한 설명과 함께 프로젝트에서 사용된 코드 예시를 포함한다.
- 초보자에게 설명하는 문서이므로, 기술의 기본 개념부터 프로젝트에서 어떻게 활용되는지 단계적으로 설명한다.
- 개발자는 page/practice에서 연습할 수 있도록 실습 예제 코드를 포함한다.
- toolbar.tsx에 '실습' 버튼이 있음. 그 아래에 개발자가 직접 코딩하면서 연습할 수 있는 실습 예제 코드가 포함된 markdown문서를 작성한다 

## 주의 사항

- **개발자가 직접 코딩을 하고 확인**하는데 목적이 있다. 코드를 자동생성해서 구현하는데 목적이 있지 않다.
- 문서에는 기술스택에 대한 설명과 함께 **프로젝트에서 사용된 코드 예시**를 포함한다.

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


