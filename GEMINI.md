# Pcms-React 프로젝트를 위한 Gemini AI 가이드

이 문서는 Gemini AI가 `Pcms-React` 프로젝트에서 코드 작성, 버그 수정, 구조 분석 등을 수행할 때 참고해야 할 핵심 컨텍스트와 규칙을 정의합니다.

## 1. 프로젝트 개요
- **목적**: 개인용 CMS(Database `kdy987_db` 관리) 구축 및 React 실무 적용 연습
- **아키텍처**: Frontend (React) / Backend (Spring Boot) 분리 구조
- **실행 환경**:
  - Backend: `bm.sh` 스크립트로 실행 (포트: `8585`)
  - Frontend: `fm.sh` 스크립트로 실행 (포트: `5173`)
- **주요 폴더 구조**:
  - `frontend/`: 프론트엔드 코드 영역
  - `backend/`: 백엔드 코드 영역
  - `sqls/kdy987_db_schema.sql`: 데이터베이스 스키마
  - `docs/설계.md`: 프로젝트 설계 문서

## 2. 핵심 기술 스택
### Frontend
- **UI/상태**: React 19, TypeScript, Zustand (전역 상태), TanStack Query (서버 상태)
- **스타일/컴포넌트**: Tailwind CSS, shadcn/ui, AG Grid Community
- **폼/검증**: React Hook Form, Zod
- **빌드/라우팅**: Vite, React Router 7

### Backend
- **코어/언어**: Java 21, Spring Boot 3.4
- **인증/보안**: Spring Security, JWT (jjwt)
- **데이터베이스/캐시**: PostgreSQL 17, MyBatis (SQL 매핑), Redis (세션/캐시)
- **통신**: REST API, WebSocket (STOMP - 실시간 알림 등)

## 3. Gemini 개발 지침 (Guidelines)
1. **기존 규칙 준수**: 
   - 코드를 수정하거나 추가할 때 기존 코드의 스타일, 네이밍 컨벤션, 디렉토리 구조를 반드시 모방하십시오.
   - 프론트엔드는 컴포넌트 기반 및 훅(Hooks) 사용 패턴을 따르고, 백엔드는 Controller-Service-Mapper(MyBatis) 계층형 아키텍처를 따르십시오.
2. **기술 스택 일치**: 
   - 새로운 라이브러리를 임의로 추가하지 마십시오. 이미 정의된 기술 스택(예: 스타일링은 Tailwind CSS, 상태관리는 Zustand 등)을 우선적으로 사용하십시오.
3. **스키마 및 데이터**:
   - DB 관련 작업 시 `sqls/kdy987_db_schema.sql` 파일을 참고하여 테이블 구조와 제약 조건에 맞는 SQL 쿼리(MyBatis)를 작성하십시오.
4. **안전한 작업**:
   - 코드 변경 후에는 반드시 적절한 빌드/린트 명령어를 통해 문법적 오류가 없는지 확인하는 습관을 가져야 합니다.
   - 불필요한 주석은 지양하고, 복잡한 로직의 '이유(Why)'를 설명하는 주석만 제한적으로 추가하십시오.


### 4. 명령어

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

```bash
psql ... # postgresql db접속 .env.fedora or .env.home 을 참조
redis-cli # redis 접속 
```
