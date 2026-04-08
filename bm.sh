#!/usr/bin/env bash
#============================================================================
# bm.sh - Backend 개발용 관리 스크립트
#
# 사용법:  ./bm.sh [명령어]
# 예시:    ./bm.sh run
#============================================================================

set -euo pipefail

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
    header "Status - 애플리케이션 상태 확인"
    # 추가적인 상태 확인 로직을 여기에 구현할 수 있습니다.
    info "현재 모드: ${PCMS_MODE}"
    if pgrep -f "bootRun" > /dev/null; then
        info "애플리케이션이 실행 중입니다."
    else
        warn "애플리케이션이 실행되지 않고 있습니다."
    fi
}

# ── 메인 함수 ──────────────────────────────────────────────────────
main() {
    check_java
    resolve_mode

    if [[ $# -eq 0 ]]; then
        local cmds=("run" "compile" "build" "war" "test" "clean" "log" "status")
        local descs=("개발 서버 실행" "소스 컴파일" "전체 빌드" "배포용 WAR 파일 생성" "전체 테스트 실행" "빌드 캐시 삭제" "애플리케이션 로그 보기" "애플리케이션 상태 확인")

        echo -e "\n${BOLD}사용 가능한 명령어:${NC}"
        for i in "${!cmds[@]}"; do
            printf "  ${GREEN}%d)${NC} %-10s - %s\n" "$((i+1))" "${cmds[$i]}" "${descs[$i]}"
        done
        echo -e "  ${YELLOW}q)${NC} 종료"
        echo ""
        read -rp "번호를 입력하세요: " choice

        if [[ "$choice" == "q" || "$choice" == "Q" ]]; then
            info "종료합니다."
            exit 0
        fi

        if ! [[ "$choice" =~ ^[0-9]+$ ]] || [[ "$choice" -lt 1 || "$choice" -gt ${#cmds[@]} ]]; then
            error "잘못된 입력입니다: $choice"
            exit 1
        fi

        local cmd="${cmds[$((choice-1))]}"
    else
        local cmd="$1"
        shift
    fi

    case "$cmd" in
        run)     do_run ;;
        compile) do_compile ;;
        build)   do_build ;;
        war)     do_war ;;
        test)    do_test ;;
        clean)   do_clean ;;
        log)     do_log ;;
        status)  do_status ;;
        help)
            echo -e "\n${BOLD}사용법:${NC}"
            echo -e "  ${GREEN}$0 [명령어]${NC}"
            echo ""
            echo -e "${BOLD}사용 가능한 명령어:${NC}"
            echo -e "  ${GREEN}run${NC}     - 개발 서버 실행"
            echo -e "  ${GREEN}compile${NC} - 소스 컴파일"
            echo -e "  ${GREEN}build${NC}   - 전체 빌드"
            echo -e "  ${GREEN}war${NC}     - 배포용 WAR 파일 생성"
            echo -e "  ${GREEN}test${NC}    - 전체 테스트 실행"
            echo -e "  ${GREEN}clean${NC}   - 빌드 캐시 삭제"
            echo -e "  ${GREEN}log${NC}     - 애플리케이션 로그 보기"
            echo -e "  ${GREEN}status${NC}  - 애플리케이션 상태 확인"
            ;;
        *)
            error "알 수 없는 명령어: $cmd"
            exit 1
            ;;
    esac
}

main "$@"