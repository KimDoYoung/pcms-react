#!/usr/bin/env bash
#============================================================================
# backend-manage.sh -  Backend 개발용 관리 스크립트
#
# 사용법:  ./backend-manage.sh [명령어]
# 예시:    ./backend-manage.sh run
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
NC='\033[0m' # No Color

# ── 유틸리티 함수 ─────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
header()  { echo -e "\n${CYAN}${BOLD}══ $* ══${NC}\n"; }

# _PROFILE 환경변수 확인. 없으면 사용자에게 입력받아 export
resolve_profile() {
    if [[ -n "${_PROFILE:-}" ]]; then
        info "프로파일: ${_PROFILE} (_PROFILE 환경변수)"
        return
    fi

    # 사용 가능한 .env.* 파일 목록 수집
    local profiles=()
    for f in "$SCRIPT_DIR"/.env.*; do
        [[ -f "$f" ]] || continue
        local name="${f##*/.env.}"
        [[ "$name" == "example" ]] && continue
        profiles+=("$name")
    done

    if [[ ${#profiles[@]} -eq 0 ]]; then
        error ".env.* 파일이 없습니다. .env.example 을 복사하여 .env.<프로파일명> 을 만들어 주세요."
        exit 1
    fi

    echo -e "\n${BOLD}_PROFILE 환경변수가 설정되지 않았습니다.${NC}"
    echo -e "사용할 프로파일을 선택하세요:\n"
    local i=1
    for p in "${profiles[@]}"; do
        echo -e "  ${GREEN}${i})${NC} ${p}"
        ((i++))
    done
    echo ""
    read -rp "번호 입력 (기본: 1): " choice
    choice="${choice:-1}"

    if [[ "$choice" -lt 1 || "$choice" -gt ${#profiles[@]} ]] 2>/dev/null; then
        error "잘못된 선택입니다."
        exit 1
    fi

    export _PROFILE="${profiles[$((choice-1))]}"
    info "프로파일 설정: ${_PROFILE}"
    echo -e "${YELLOW}[TIP]${NC}  다음부터 자동 적용하려면: ${BOLD}export _PROFILE=${_PROFILE}${NC}"
    echo -e "       ~/.bashrc 또는 ~/.zshrc 에 추가하면 영구 적용됩니다."
    echo ""
}

load_env() {
    local env_file="$SCRIPT_DIR/.env.${_PROFILE}"
    if [[ ! -f "$env_file" ]]; then
        error "환경변수 파일을 찾을 수 없습니다: $env_file"
        exit 1
    fi
    set -a
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
    header "Run - Spring Boot 애플리케이션 실행"
    check_java
    if [[ ! -f "$GRADLEW" ]]; then
        error "gradlew 파일을 찾을 수 없습니다. 프로젝트가 올바르게 설정되었는지 확인하세요."
        exit 1
    fi
    chmod +x "$GRADLEW"
    info "Spring Boot 애플리케이션을 시작합니다..."
    "$GRADLEW" -p "$BACKEND_DIR" bootRun
}

do_clean() {
    header "Clean - 빌드 캐시 삭제"
    "$GRADLEW" -p "$BACKEND_DIR" clean
    info "빌드 캐시가 삭제되었습니다."
}

do_compile() {
    header "Compile - 소스 컴파일"
    load_env
    "$GRADLEW" -p "$BACKEND_DIR" classes
    info "컴파일 완료."
}

do_war() {
    header "WAR - 배포용 WAR 파일 생성"
    load_env
    "$GRADLEW" -p "$BACKEND_DIR" clean bootWar
    local war_path="$BACKEND_DIR/build/libs/.war"
    if [[ -f "$war_path" ]]; then
        info "WAR 생성 완료: $war_path ($(du -h "$war_path" | cut -f1))"
    else
        error "WAR 파일이 생성되지 않았습니다."
        exit 1
    fi
}

do_run() {
    header "Run - 개발 서버 실행 (profile: $_PROFILE)"
    load_env
    info "서버 시작 중... (Ctrl+C 로 종료)"
    info "Health check: curl localhost:8585/api/health"
    echo ""
    "$GRADLEW" -p "$BACKEND_DIR" bootRun --args="--spring.profiles.active=$_PROFILE"
}

do_test() {
    header "Test - 전체 테스트 실행"
    load_env
    "$GRADLEW" -p "$BACKEND_DIR" test
    info "테스트 완료. 리포트: $BACKEND_DIR/build/reports/tests/test/index.html"
}

do_build() {
    header "Build - 전체 빌드 (컴파일 + 테스트 + WAR)"
    load_env
    "$GRADLEW" -p "$BACKEND_DIR" clean build
    info "전체 빌드 완료."
}

do_log() {
    local log_dir="$BACKEND_DIR/pcms-data/logs"
    local log_file="$log_dir/pcms.log"
    header "Log - 애플리케이션 로그 보기"
    if [[ ! -f "$log_file" ]]; then
        warn "로그 파일이 아직 없습니다: $log_file"
        warn "서버를 먼저 실행해 주세요: ./backend-manage.sh run"
        exit 1
    fi
    info "로그 파일: $log_file (Ctrl+C 로 종료)"
    echo ""
    tail -f "$log_file"
}

do_status() {
    header "Status - 서버 상태 확인"
    if curl -sf http://localhost:8585/api/health >/dev/null 2>&1; then
        info "서버가 실행 중입니다."
        curl -s http://localhost:8585/api/health | python3 -m json.tool
    else
        warn "서버가 응답하지 않습니다. (포트 8585)"
    fi
}

# ── 도움말 ────────────────────────────────────────────────────────────────

show_help() {
    echo -e "
${CYAN}${BOLD} Backend 관리 스크립트${NC}

${BOLD}사용법:${NC}
  ./backend-manage.sh ${GREEN}<명령어>${NC}

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

${BOLD}예시:${NC}
  ./backend-manage.sh run        # 서버 실행
  ./backend-manage.sh war        # WAR 파일 생성
  ./backend-manage.sh status     # 서버 상태 확인

${BOLD}프로파일 설정:${NC}
  - _PROFILE 환경변수로 프로파일을 지정합니다.
  - 미설정 시 .env.* 파일 목록에서 선택할 수 있습니다.
  - 영구 적용: ~/.bashrc 에 ${BOLD}export _PROFILE=fedora${NC} 추가

${BOLD}참고:${NC}
  - 환경변수는 .env.\${_PROFILE} 파일에서 자동 로드됩니다.
  - Java 21 이상이 필요합니다.
  - 로그 파일 위치: backend/pcms-data/logs/pcms.log
"
}

# ── 메인 ──────────────────────────────────────────────────────────────────

main() {
    check_java
    resolve_profile

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
        "")
            show_help
            ;;
        *)
            error "알 수 없는 명령어: $cmd"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
