#!/usr/bin/env bash
#============================================================================
# bm.sh - Backend 개발용 관리 스크립트
#
# 사용법:  ./bm.sh [명령어]
# 예시:    ./bm.sh run
#============================================================================
set -euo pipefail

# ── 경로 설정 ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
GRADLEW="$BACKEND_DIR/gradlew"

# ── 색상 ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── 유틸리티 함수 ─────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
header()  { echo -e "\n${CYAN}${BOLD}══ $* ══${NC}\n"; }

# PCMS_MODE 환경변수 확인. 없으면 .env.* 파일 목록에서 선택
resolve_mode() {
    if [[ -n "${PCMS_MODE:-}" ]]; then
        info "모드: ${PCMS_MODE} (PCMS_MODE 환경변수)"
        return
    fi

    local modes=()
    for f in "$SCRIPT_DIR"/.env.*; do
        [[ -f "$f" ]] || continue
        local name="${f##*/.env.}"
        [[ "$name" == "example" ]] && continue
        modes+=("$name")
    done

    if [[ ${#modes[@]} -eq 0 ]]; then
        error ".env.* 파일이 없습니다. .env.example 을 복사하여 .env.development 등을 만들어 주세요."
        exit 1
    fi

    echo -e "\n${BOLD}PCMS_MODE 환경변수가 설정되지 않았습니다.${NC}"
    echo -e "사용할 모드를 선택하세요:\n"
    local i=1
    for m in "${modes[@]}"; do
        echo -e "  ${GREEN}${i})${NC} ${m}"
        ((i++))
    done
    echo ""
    read -rp "번호 입력 (기본: 1): " choice
    choice="${choice:-1}"

    if [[ "$choice" -lt 1 || "$choice" -gt ${#modes[@]} ]] 2>/dev/null; then
        error "잘못된 선택입니다."
        exit 1
    fi

    export PCMS_MODE="${modes[$((choice-1))]}"
    info "모드 설정: ${PCMS_MODE}"
    echo -e "${YELLOW}[TIP]${NC}  다음부터 자동 적용하려면: ${BOLD}export PCMS_MODE=${PCMS_MODE}${NC}"
    echo -e "       ~/.bashrc 또는 ~/.zshrc 에 추가하면 영구 적용됩니다."
    echo ""
}

load_env() {
    local env_file="$SCRIPT_DIR/.env.${PCMS_MODE}"
    if [[ ! -f "$env_file" ]]; then
        error "환경변수 파일을 찾을 수 없습니다: $env_file"
        exit 1
    fi
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
    info "환경변수 로드 완료 ($env_file)"
}

check_java() {
    if ! command -v java &>/dev/null; then
        error "Java가 설치되어 있지 않습니다. Java 21 이상이 필요합니다."
        exit 1
    fi
    local java_ver
    java_ver=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d. -f1)
    if [[ "$java_ver" -lt 21 ]]; then
        warn "Java 21 이상이 권장됩니다. (현재: $java_ver)"
    fi
}

# ── 명령어 함수 ──────────────────────────────────────────────────────────

do_run() {
    header "Run - 개발 서버 실행 (mode: ${PCMS_MODE})"
    load_env
    if [[ ! -f "$GRADLEW" ]]; then
        error "gradlew 파일을 찾을 수 없습니다."
        exit 1
    fi
    chmod +x "$GRADLEW"
    info "서버 시작 중... (Ctrl+C 로 종료)"
    info "Health check: curl http://localhost:8585/pcms/health"
    echo ""
    "$GRADLEW" -p "$BACKEND_DIR" bootRun --args="--spring.profiles.active=${PCMS_MODE}"
}

do_compile() {
    header "Compile - 소스 컴파일"
    load_env
    "$GRADLEW" -p "$BACKEND_DIR" classes
    info "컴파일 완료."
}

do_build() {
    header "Build - 전체 빌드 (컴파일 + 테스트 + JAR/WAR)"
    load_env
    "$GRADLEW" -p "$BACKEND_DIR" clean build
    info "전체 빌드 완료."
}

do_war() {
    header "WAR - 배포용 WAR 파일 생성"
    load_env
    "$GRADLEW" -p "$BACKEND_DIR" clean bootWar
    local war_path
    war_path=$(find "$BACKEND_DIR/build/libs" -name "*.war" | head -1)
    if [[ -n "$war_path" && -f "$war_path" ]]; then
        info "WAR 생성 완료: $war_path ($(du -h "$war_path" | cut -f1))"
    else
        error "WAR 파일이 생성되지 않았습니다."
        exit 1
    fi
}

do_test() {
    header "Test - 전체 테스트 실행"
    load_env
    "$GRADLEW" -p "$BACKEND_DIR" test
    info "테스트 완료. 리포트: $BACKEND_DIR/build/reports/tests/test/index.html"
}

do_clean() {
    header "Clean - 빌드 캐시 삭제"
    "$GRADLEW" -p "$BACKEND_DIR" clean
    info "빌드 캐시가 삭제되었습니다."
}

do_log() {
    local log_file="$BACKEND_DIR/pcms-data/logs/pcms.log"
    header "Log - 애플리케이션 로그 보기"
    if [[ ! -f "$log_file" ]]; then
        warn "로그 파일이 아직 없습니다: $log_file"
        warn "서버를 먼저 실행해 주세요: ./bm.sh run"
        exit 1
    fi
    info "로그 파일: $log_file (Ctrl+C 로 종료)"
    echo ""
    tail -f "$log_file"
}

do_status() {
    header "Status - 서버 상태 확인"
    if curl -sf http://localhost:8585/pcms/health >/dev/null 2>&1; then
        info "서버가 실행 중입니다."
        curl -s http://localhost:8585/pcms/health | python3 -m json.tool
    else
        warn "서버가 응답하지 않습니다. (http://localhost:8585/pcms/health)"
    fi
}

# ── 도움말 ────────────────────────────────────────────────────────────────

show_help() {
    echo -e "
${CYAN}${BOLD}PCMS Backend 관리 스크립트${NC}

${BOLD}사용법:${NC}
  ./bm.sh ${GREEN}<명령어>${NC}

${BOLD}명령어:${NC}
  ${GREEN}run${NC}       개발 서버 실행 (포트 8585)
  ${GREEN}compile${NC}   소스 코드 컴파일만 수행
  ${GREEN}build${NC}     전체 빌드 (컴파일 + 테스트 + WAR)
  ${GREEN}war${NC}       배포용 WAR 파일 생성
  ${GREEN}test${NC}      전체 테스트 실행
  ${GREEN}clean${NC}     빌드 캐시 삭제
  ${GREEN}log${NC}       애플리케이션 로그 실시간 보기 (tail -f)
  ${GREEN}status${NC}    서버 상태 확인 (health check)
  ${GREEN}help${NC}      이 도움말 표시

${BOLD}모드 설정 (PCMS_MODE):${NC}
  - PCMS_MODE 환경변수로 모드를 지정합니다.
  - 미설정 시 .env.* 파일 목록에서 대화식으로 선택합니다.
  - 영구 적용: ~/.bashrc 에 ${BOLD}export PCMS_MODE=development${NC} 추가
  - 모드에 해당하는 .env.<PCMS_MODE> 파일에서 환경변수를 로드합니다.
  - Spring 프로파일도 동일한 값으로 활성화됩니다.
    → application-development.properties 로드

${BOLD}참고:${NC}
  - Java 21 이상이 필요합니다.
  - 로그 파일 위치: backend/pcms-data/logs/pcms.log
  - Health check URL: http://localhost:8585/pcms/health
"
}

# ── 메인 ──────────────────────────────────────────────────────────────────

main() {
    check_java
    resolve_mode

    local cmd="${1:-}"

    case "$cmd" in
        run)     do_run     ;;
        compile) do_compile ;;
        build)   do_build   ;;
        war)     do_war     ;;
        test)    do_test    ;;
        clean)   do_clean   ;;
        log)     do_log     ;;
        status)  do_status  ;;
        help)    show_help  ;;
        "")      show_help  ;;
        *)
            error "알 수 없는 명령어: $cmd"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
