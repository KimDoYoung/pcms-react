#!/usr/bin/env bash
#============================================================================
# fm.sh - Frontend 개발용 관리 스크립트
#
# 사용법:  ./fm.sh [명령어]
# 예시:    ./fm.sh dev
#============================================================================
set -euo pipefail

# ── 경로 설정 ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

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

check_node() {
    if ! command -v node &>/dev/null; then
        error "Node.js가 설치되어 있지 않습니다."
        exit 1
    fi
    if ! command -v npm &>/dev/null; then
        error "NPM이 설치되어 있지 않습니다."
        exit 1
    fi
    info "Node version: $(node -v) / NPM version: $(npm -v)"
}

# ── 명령어 함수 ──────────────────────────────────────────────────────────

do_dev() {
    header "Dev - 개발 서버 실행"
    cd "$FRONTEND_DIR"
    local mode="${PCMS_MODE:-development}"
    info "개발 서버 시작 (http://localhost:5173) mode=${mode}"
    npm run dev -- --mode "$mode"
}

do_build() {
    header "Build - 프로덕션 빌드"
    cd "$FRONTEND_DIR"
    local mode="${PCMS_MODE:-development}"
    info "빌드 시작... mode=${mode}"
    npm run build -- --mode "$mode"
    if [[ -d "$FRONTEND_DIR/dist" ]]; then
        info "빌드 완료: dist/"
    else
        error "빌드 실패."
        exit 1
    fi
}

do_preview() {
    header "Preview - 빌드 결과물 미리보기"
    cd "$FRONTEND_DIR"
    if [[ ! -d "dist" ]]; then
        warn "dist 폴더가 없습니다. 먼저 build를 실행합니다."
        do_build
    fi
    npm run preview
}

do_install() {
    header "Install - 의존성 패키지 설치"
    cd "$FRONTEND_DIR"
    npm install
    info "패키지 설치 완료."
}

do_lint() {
    header "Lint - 코드 스타일 검사"
    cd "$FRONTEND_DIR"
    npm run lint
}

do_clean() {
    header "Clean - 빌드 결과물 및 캐시 삭제"
    rm -rf "$FRONTEND_DIR/dist"
    rm -rf "$FRONTEND_DIR/node_modules/.vite"
    info "dist 폴더와 Vite 캐시 삭제 완료."
}

# ── 도움말 ────────────────────────────────────────────────────────────────

show_help() {
    echo -e "
${CYAN}${BOLD}PCMS Frontend 관리 스크립트${NC}

${BOLD}사용법:${NC}
  ./fm.sh ${GREEN}<명령어>${NC}

${BOLD}명령어:${NC}
  ${GREEN}dev${NC}       개발 서버 실행 (http://localhost:5173)
  ${GREEN}build${NC}     프로덕션 빌드
  ${GREEN}preview${NC}   빌드 결과물 미리보기
  ${GREEN}install${NC}   의존성 패키지 설치 (npm install)
  ${GREEN}lint${NC}      ESLint 코드 검사
  ${GREEN}clean${NC}     dist 폴더 및 Vite 캐시 삭제
  ${GREEN}help${NC}      이 도움말 표시

${BOLD}모드 설정 (PCMS_MODE):${NC}
  - PCMS_MODE 환경변수로 Vite 모드(--mode)를 지정합니다.
  - 미설정 시 기본값 'development'로 실행됩니다.
  - 영구 적용: ~/.bashrc 에 ${BOLD}export PCMS_MODE=development${NC} 추가
  - Vite는 해당 모드의 .env 파일을 frontend/ 폴더에서 로드합니다.

${BOLD}참고:${NC}
  - Node.js 및 NPM이 필요합니다.
"
}

# ── 메인 ──────────────────────────────────────────────────────────────────

main() {
    check_node

    local cmd="${1:-}"

    case "$cmd" in
        dev|run)  do_dev     ;;
        build)    do_build   ;;
        preview)  do_preview ;;
        install)  do_install ;;
        lint)     do_lint    ;;
        clean)    do_clean   ;;
        help)     show_help  ;;
        "")       show_help  ;;
        *)
            error "알 수 없는 명령어: $cmd"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
