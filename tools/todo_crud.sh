#!/usr/bin/env bash
# todo_crud.sh - Todo CRUD API 테스트 스크립트
# 사용법: ./todo_crud.sh <command> [args]
# Note: todo는 인증 없이 동작

BASE_URL="http://localhost:8585/pcms"

# Windows Git Bash(MSYS) 경로 자동변환 방지 (Linux에서는 무시됨)
export MSYS_NO_PATHCONV=1

# ── 유틸리티 ───────────────────────────────────────────
die()  { echo "오류: $*" >&2; exit 1; }
info() { printf "\033[1;36m>>> %s\033[0m\n" "$*"; }

pp() {
    if command -v jq &>/dev/null; then
        jq '.'
    else
        python3 -m json.tool 2>/dev/null || cat
    fi
}

# ── 명령 ───────────────────────────────────────────────

cmd_create() {
    # 인자로 전달된 내용들을 배열로 묶어서 전송
    [[ $# -gt 0 ]] || die "사용법: $0 create <내용1> [내용2] ..."

    local items=""
    for arg in "$@"; do
        [[ -n "$items" ]] && items+=","
        items+="\"$arg\""
    done

    info "POST /todo  (contents: [$items])"

    curl -sS -X POST "$BASE_URL/todo" \
        -H 'Content-Type: application/json' \
        -d "{\"contents\":[$items]}" | pp
}

cmd_delete() {
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 delete <id>"
    info "DELETE /todo/$id"

    curl -sS -X DELETE "$BASE_URL/todo/$id" | pp
}

cmd_list() {
    info "GET /todo"

    curl -sS "$BASE_URL/todo" | pp
}

# ── 메인 ───────────────────────────────────────────────
CMD="${1:-help}" ; shift 2>/dev/null || true

case "$CMD" in
    create) cmd_create "$@" ;;
    delete) cmd_delete "$@" ;;
    list)   cmd_list   "$@" ;;
    *)
        cat <<'HELP'
사용법: ./todo_crud.sh <command> [args]

Commands:
  create <내용1> [내용2] ...       할 일 등록 (여러 개 동시 가능)
  delete <id>                      할 일 삭제
  list                             할 일 목록 조회

예시:
  ./todo_crud.sh create "장보기" "운동하기" "책 읽기"
  ./todo_crud.sh list
  ./todo_crud.sh delete 1
HELP
        ;;
esac
