#!/usr/bin/env bash
#============================================================================
# frontend-manage.sh - OMS Frontend 개발용 관리 스크립트
#
# 사용법:  ./frontend-manage.sh [명령어]
# 예시:    ./frontend-manage.sh dev
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
NC='\033[0m' # No Color

# ── 유틸리티 함수 ─────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
header()  { echo -e "\n${CYAN}${BOLD}══ $* ══${NC}\n"; }

# OMS_PROFILE 환경변수 확인. 없으면 사용자에게 입력받아 export
# Frontend에서는 Vite 모드(--mode)로 전달하거나 .env 파일을 선택적으로 로드하는데 사용
resolve_profile() {
    if [[ -n "${OMS_PROFILE:-}" ]]; then
        info "프로파일: ${OMS_PROFILE} (OMS_PROFILE 환경변수)"
        return
    fi

    # 사용 가능한 .env.* 파일 목록 수집 (루트 디렉토리 기준)
    local profiles=()
    for f in "$SCRIPT_DIR"/.env.*; do
        [[ -f "$f" ]] || continue
        local name="${f##*/.env.}"
        [[ "$name" == "example" ]] && continue
        profiles+=("$name")
    done

    # 만약 루트에 없다면 frontend 폴더 내부도 확인 (Vite 기본 동작)
    if [[ ${#profiles[@]} -eq 0 ]]; then
        for f in "$FRONTEND_DIR"/.env.*; do
            [[ -f "$f" ]] || continue
            local name="${f##*/.env.}"
            [[ "$name" == "example" ]] && continue
            profiles+=("$name")
        done
    fi

    if [[ ${#profiles[@]} -eq 0 ]]; then
        # 프로파일이 없으면 기본값인 development로 설정하지 않고 넘어감 (Vite 기본값 사용)
        return
    fi

    echo -e "\n${BOLD}OMS_PROFILE 환경변수가 설정되지 않았습니다.${NC}"
    echo -e "사용할 프로파일을 선택하세요 (Vite mode):\n"
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

    export OMS_PROFILE="${profiles[$((choice-1))]}"
    info "프로파일 설정: ${OMS_PROFILE}"
    echo -e "${YELLOW}[TIP]${NC}  다음부터 자동 적용하려면: ${BOLD}export OMS_PROFILE=${OMS_PROFILE}${NC}"
}

check_node() {
    if ! command -v node &>/dev/null; then
        error "Node.js가 설치되어 있지 않습니다."
        exit 1
    fi
    if ! command -v npm &>/dev/null; then
        error "NPM이 설치되어 있지 않습니다."
        exit 1
    fi
    
    local node_ver
    node_ver=$(node -v)
    # 간단한 버전 체크 (예: v18 이상 권장)
    info "Node version: $node_ver"
}

# ── 명령어 함수 ──────────────────────────────────────────────────────────

do_clean() {
    header "Clean - 빌드 결과물 및 캐시 삭제"
    rm -rf "$FRONTEND_DIR/dist"
    rm -rf "$FRONTEND_DIR/node_modules/.vite"
    info "dist 폴더와 Vite 캐시 삭제 완료."
}

do_install() {
    header "Install - 의존성 패키지 설치"
    cd "$FRONTEND_DIR"
    npm install
    info "패키지 설치 완료."
}

do_dev() {
    header "Dev - 개발 서버 실행"
    resolve_profile
    cd "$FRONTEND_DIR"
    
    local args=""
    if [[ -n "${OMS_PROFILE:-}" ]]; then
        args="--mode $OMS_PROFILE"
    fi
    
    info "개발 서버 시작 (http://localhost:5173)"
    npm run dev -- $args
}

do_build() {
    header "Build - 프로덕션 빌드"
    resolve_profile
    cd "$FRONTEND_DIR"

    local args=""
    if [[ -n "${OMS_PROFILE:-}" ]]; then
        args="--mode $OMS_PROFILE"
    fi

    info "빌드 시작..."
    npm run build -- $args
    
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

do_lint() {
    header "Lint - 코드 스타일 검사"
    cd "$FRONTEND_DIR"
    npm run lint
}

do_type_check() {
    header "Type Check - TypeScript 타입 검사"
    cd "$FRONTEND_DIR"
    npm run type-check
}

# ── 도움말 ────────────────────────────────────────────────────────────────

show_help() {
    echo -e "
${CYAN}${BOLD}OMS Frontend 관리 스크립트${NC}

${BOLD}사용법:${NC}
  ./frontend-manage.sh ${GREEN}<명령어>${NC}

${BOLD}명령어:${NC}
  ${GREEN}dev${NC}         개발 서버 실행 (npm run dev)
  ${GREEN}build${NC}       프로덕션 빌드 (npm run build)
  ${GREEN}preview${NC}     빌드 결과물 미리보기 (npm run preview)
  ${GREEN}install${NC}     의존성 패키지 설치 (npm install)
  ${GREEN}lint${NC}        ESLint 코드 검사
  ${GREEN}type-check${NC}  TypeScript 타입 검사
  ${GREEN}clean${NC}       dist 폴더 및 Vite 캐시 삭제
  ${GREEN}help${NC}        이 도움말 표시

${BOLD}프로파일 설정:${NC}
  - OMS_PROFILE 환경변수로 Vite 모드(--mode)를 지정합니다.
  - 설정된 경우 'npm run build -- --mode \$OMS_PROFILE' 형태로 전달됩니다.

${BOLD}참고:${NC}
  - Node.js 및 NPM이 필요합니다.
"
}

# ── 메인 ──────────────────────────────────────────────────────────────────

main() {
    check_node
    
    local cmd="${1:-}"

    case "$cmd" in
        dev|run)     do_dev        ;;
        build)       do_build      ;;
        preview)     do_preview    ;;
        install)     do_install    ;;
        lint)        do_lint       ;;
        type-check)  do_type_check ;;
        clean)       do_clean      ;;
        help)        show_help     ;;
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
