#!/usr/bin/env bash
# post_crud.sh - Post(게시글) CRUD API 테스트 스크립트
# 사용법: ./post_crud.sh <command> [args]
# Post는 Board 하위 리소스: /boards/{boardId}/posts/...

BASE_URL="http://localhost:8585/pcms"
TOKEN_FILE="/tmp/.diary_test_token"
ATTACH_FILE="${HOME}/tmp/1.docx"

# Windows Git Bash(MSYS) 경로 자동변환 방지 (Linux에서는 무시됨)
export MSYS_NO_PATHCONV=1

# 1×1 빨간 픽셀 PNG (base64) — 에디터 이미지 추출 테스트용
RED_DOT_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=="

# ── 유틸리티 ───────────────────────────────────────────
die()  { echo "오류: $*" >&2; exit 1; }
info() { printf "\033[1;36m>>> %s\033[0m\n" "$*"; }

# Windows Git Bash에서 curl -F 의 ;type= 구문이 깨지지 않도록 Unix 경로를 Windows 경로로 변환
winpath() {
    if command -v cygpath &>/dev/null; then
        cygpath -m "$1"
    else
        echo "$1"
    fi
}

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
    local board_id="${1:-}" ; [[ -n "$board_id" ]] || die "사용법: $0 create <boardId>"
    info "POST /boards/$board_id/posts  (에디터 이미지 + 첨부파일)"

    local json_file
    json_file=$(mktemp /tmp/post_XXXXXX.json)
    json_file=$(winpath "$json_file")
    cat > "$json_file" <<EOF
{
  "boardId": $board_id,
  "title": "curl 테스트 게시글",
  "author": "관리자",
  "baseYmd": "$(date +%Y%m%d)",
  "content": "<p>게시글 테스트입니다.</p><img src=\"data:image/png;base64,${RED_DOT_PNG}\"><p>이미지 포함 내용.</p>"
}
EOF

    local -a args=(
        -sS -X POST "$BASE_URL/boards/$board_id/posts"
        -H "Authorization: Bearer $TOKEN"
        -F "post=@${json_file};type=application/json"
    )
    local attach_file
    attach_file=$(winpath "$ATTACH_FILE")
    [[ -f "$ATTACH_FILE" ]] && args+=(-F "files=@${attach_file}")

    curl "${args[@]}" | pp
    rm -f "$json_file"
}

cmd_get() {
    need_token
    local board_id="${1:-}" post_id="${2:-}"
    [[ -n "$board_id" && -n "$post_id" ]] || die "사용법: $0 get <boardId> <postId>"
    info "GET /boards/$board_id/posts/$post_id"

    curl -sS "$BASE_URL/boards/$board_id/posts/$post_id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_edit() {
    need_token
    local board_id="${1:-}" post_id="${2:-}"
    [[ -n "$board_id" && -n "$post_id" ]] || die "사용법: $0 edit <boardId> <postId> [삭제할_fileId ...]"
    shift 2

    # 나머지 인자 = 삭제할 첨부파일 fileId 목록
    local deleted_json="[]"
    if [[ $# -gt 0 ]]; then
        deleted_json="[$(IFS=,; echo "$*")]"
    fi

    info "PUT /boards/$board_id/posts/$post_id  (삭제 대상: $deleted_json)"

    local json_file
    json_file=$(mktemp /tmp/post_XXXXXX.json)
    json_file=$(winpath "$json_file")
    cat > "$json_file" <<EOF
{
  "id": $post_id,
  "boardId": $board_id,
  "title": "수정된 게시글 제목",
  "author": "관리자",
  "baseYmd": "$(date +%Y%m%d)",
  "content": "<p>수정된 게시글 내용입니다.</p><img src=\"data:image/png;base64,${RED_DOT_PNG}\"><p>새 이미지도 포함.</p>",
  "deletedAttachmentIds": $deleted_json
}
EOF

    local -a args=(
        -sS -X PUT "$BASE_URL/boards/$board_id/posts/$post_id"
        -H "Authorization: Bearer $TOKEN"
        -F "post=@${json_file};type=application/json"
    )
    local attach_file
    attach_file=$(winpath "$ATTACH_FILE")
    [[ -f "$ATTACH_FILE" ]] && args+=(-F "files=@${attach_file}")

    curl "${args[@]}" | pp
    rm -f "$json_file"
}

cmd_delete() {
    need_token
    local board_id="${1:-}" post_id="${2:-}"
    [[ -n "$board_id" && -n "$post_id" ]] || die "사용법: $0 delete <boardId> <postId>"
    info "DELETE /boards/$board_id/posts/$post_id"

    curl -sS -X DELETE "$BASE_URL/boards/$board_id/posts/$post_id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_list() {
    need_token
    local board_id="${1:-}" page="${2:-1}" size="${3:-5}"
    [[ -n "$board_id" ]] || die "사용법: $0 list <boardId> [page] [size]"
    info "GET /boards/$board_id/posts?page=$page&size=$size"

    curl -sS "$BASE_URL/boards/$board_id/posts?page=$page&size=$size" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_search() {
    need_token
    local board_id="${1:-}" keyword="${2:-}"
    [[ -n "$board_id" && -n "$keyword" ]] || die "사용법: $0 search <boardId> <keyword> [page] [size]"
    local page="${3:-1}" size="${4:-5}"
    info "GET /boards/$board_id/posts?keyword=$keyword&page=$page&size=$size"

    curl -sS "$BASE_URL/boards/$board_id/posts?keyword=$keyword&page=$page&size=$size" \
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
    search) cmd_search "$@" ;;
    *)
        cat <<'HELP'
사용법: ./post_crud.sh <command> [args]

※ Post는 Board 하위 리소스이므로 boardId가 항상 필요합니다.

Commands:
  login                                     로그인 후 토큰 저장 (kdy987/1111)
  create <boardId>                          게시글 생성 (이미지+첨부파일)
  get    <boardId> <postId>                 게시글 단건 조회
  edit   <boardId> <postId> [fileId ...]    게시글 수정 (선택: 삭제할 첨부파일)
  delete <boardId> <postId>                 게시글 삭제
  list   <boardId> [page] [size]            게시글 목록 조회
  search <boardId> <keyword> [page] [size]  키워드 검색 (title+content)

예시:
  ./post_crud.sh login
  ./post_crud.sh create 1
  ./post_crud.sh list 1
  ./post_crud.sh get 1 5
  ./post_crud.sh edit 1 5 3 7      # fileId 3, 7 삭제 + 새 파일 추가
  ./post_crud.sh delete 1 5
  ./post_crud.sh search 1 "테스트"
HELP
        ;;
esac
