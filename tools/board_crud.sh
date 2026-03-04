#!/usr/bin/env bash
# board_crud.sh - Board(게시판 마스터) CRUD API 테스트 스크립트
# 사용법: ./board_crud.sh <command> [args]

BASE_URL="http://localhost:8585/pcms"
TOKEN_FILE="/tmp/.diary_test_token"

# Windows Git Bash(MSYS) 경로 자동변환 방지 (Linux에서는 무시됨)
export MSYS_NO_PATHCONV=1

# ── 유틸리티 ───────────────────────────────────────────
die()  { echo "오류: $*" >&2; exit 1; }
info() { printf "\033[1;36m>>> %s\033[0m\n" "$*"; }

need_token() {
    [[ -f "$TOKEN_FILE" ]] || die "먼저 로그인하세요: $0 login"
    TOKEN=$(cat "$TOKEN_FILE")
}

pp() {
    if command -v jq &>/dev/null; then
        jq '.'
    else
        python3 -m json.tool 2>/dev/null || cat
    fi
}

# ── 명령 ───────────────────────────────────────────────

cmd_login() {
    local user="kdy987" pw="1111"
    info "POST /auth/login  (userId=$user)"

    RESP=$(curl -sS -X POST "$BASE_URL/auth/login" \
        -H 'Content-Type: application/json' \
        -d "{\"userId\":\"$user\",\"userPw\":\"$pw\"}")
    echo "$RESP" | pp

    TOKEN=$(echo "$RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    [[ -n "$TOKEN" ]] || die "토큰 획득 실패 — 응답을 확인하세요."
    echo "$TOKEN" > "$TOKEN_FILE"
    info "토큰 저장 완료 → $TOKEN_FILE"
}

cmd_create() {
    need_token
    local code="${1:-test_board}" name="${2:-테스트 게시판}"
    info "POST /boards  (boardCode=$code, boardNameKor=$name)"

    curl -sS -X POST "$BASE_URL/boards" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"boardCode\":\"$code\",\"boardNameKor\":\"$name\",\"contentType\":\"html\",\"description\":\"$name 설명\"}" | pp
}

cmd_get() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 get <id>"
    info "GET /boards/$id"

    curl -sS "$BASE_URL/boards/$id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_edit() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 edit <id> [boardNameKor]"
    local name="${2:-수정된 게시판}"
    info "PUT /boards  (id=$id, boardNameKor=$name)"

    curl -sS -X PUT "$BASE_URL/boards" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"id\":$id,\"boardCode\":\"test_board\",\"boardNameKor\":\"$name\",\"contentType\":\"html\",\"description\":\"$name 설명\"}" | pp
}

cmd_delete() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 delete <id>"
    info "DELETE /boards/$id"

    curl -sS -X DELETE "$BASE_URL/boards/$id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_list() {
    need_token
    info "GET /boards"

    curl -sS "$BASE_URL/boards" \
        -H "Authorization: Bearer $TOKEN" | pp
}

# ── 메인 ───────────────────────────────────────────────
CMD="${1:-help}" ; shift 2>/dev/null || true

case "$CMD" in
    login)  cmd_login  "$@" ;;
    create) cmd_create "$@" ;;
    get)    cmd_get    "$@" ;;
    edit)   cmd_edit   "$@" ;;
    delete) cmd_delete "$@" ;;
    list)   cmd_list   "$@" ;;
    *)
        cat <<'HELP'
사용법: ./board_crud.sh <command> [args]

Commands:
  login                              로그인 후 토큰 저장 (kdy987/1111)
  create [boardCode] [boardNameKor]  게시판 생성 (기본: test_board)
  get    <id>                        게시판 단건 조회
  edit   <id> [boardNameKor]         게시판 수정
  delete <id>                        게시판 삭제
  list                               게시판 전체 목록

예시:
  ./board_crud.sh login
  ./board_crud.sh create notice 공지사항
  ./board_crud.sh list
  ./board_crud.sh get 1
  ./board_crud.sh edit 1 "수정된 공지사항"
  ./board_crud.sh delete 1
HELP
        ;;
esac
