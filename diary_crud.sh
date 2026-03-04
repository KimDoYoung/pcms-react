#!/usr/bin/env bash
# diary_crud.sh - Diary CRUD API 테스트 스크립트
# 사용법: ./diary_crud.sh <command> [args]

BASE_URL="http://localhost:8585/pcms"
TOKEN_FILE="/tmp/.diary_test_token"
ATTACH_FILE="${HOME}/tmp/1.docx"

# 1×1 빨간 픽셀 PNG (base64) — 에디터 이미지 추출 테스트용
RED_DOT_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=="

# ── 유틸리티 ───────────────────────────────────────────
die()  { echo "오류: $*" >&2; exit 1; }
info() { printf "\033[1;36m>>> %s\033[0m\n" "$*"; }

need_token() {
    [[ -f "$TOKEN_FILE" ]] || die "먼저 로그인하세요: $0 login [userId] [userPw]"
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
    [[ -f "$ATTACH_FILE" ]] || die "첨부파일 없음: $ATTACH_FILE"
    info "POST /diary  (에디터 이미지 + 첨부파일 포함)"

    local json_file
    json_file=$(mktemp /tmp/diary_XXXXXX.json)
    cat > "$json_file" <<EOF
{
  "ymd": "$(date +%Y%m%d)",
  "summary": "curl 테스트 다이어리",
  "content": "<p>안녕하세요, 테스트입니다.</p><img src=\"data:image/png;base64,${RED_DOT_PNG}\"><p>이미지 포함 내용입니다.</p>"
}
EOF

    curl -sS -X POST "$BASE_URL/diary" \
        -H "Authorization: Bearer $TOKEN" \
        -F "diary=@${json_file};type=application/json" \
        -F "files=@${ATTACH_FILE}" | pp

    rm -f "$json_file"
}

cmd_get() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 get <id>"
    info "GET /diary/$id"

    curl -sS "$BASE_URL/diary/$id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_edit() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 edit <id> [삭제할_fileId ...]"
    shift

    # 나머지 인자 = 삭제할 첨부파일 fileId 목록
    local deleted_json="[]"
    if [[ $# -gt 0 ]]; then
        deleted_json="[$(IFS=,; echo "$*")]"
    fi

    info "PUT /diary  (id=$id, 새 이미지+첨부파일, 삭제 대상: $deleted_json)"

    local json_file
    json_file=$(mktemp /tmp/diary_XXXXXX.json)
    cat > "$json_file" <<EOF
{
  "id": $id,
  "ymd": "$(date +%Y%m%d)",
  "summary": "수정된 다이어리",
  "content": "<p>수정된 내용입니다.</p><img src=\"data:image/png;base64,${RED_DOT_PNG}\"><p>새 이미지도 포함.</p>",
  "deletedAttachmentIds": $deleted_json
}
EOF

    local -a args=(
        -sS -X PUT "$BASE_URL/diary"
        -H "Authorization: Bearer $TOKEN"
        -F "diary=@${json_file};type=application/json"
    )
    [[ -f "$ATTACH_FILE" ]] && args+=(-F "files=@${ATTACH_FILE}")

    curl "${args[@]}" | pp
    rm -f "$json_file"
}

cmd_delete() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 delete <id>"
    info "DELETE /diary/$id"

    curl -sS -X DELETE "$BASE_URL/diary/$id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_list() {
    need_token
    local page="${1:-1}" size="${2:-5}"
    info "GET /diary?page=$page&size=$size"

    curl -sS "$BASE_URL/diary?page=$page&size=$size" \
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
사용법: ./diary_crud.sh <command> [args]

Commands:
  login  [userId] [userPw]         로그인 후 토큰 저장 (기본: admin/admin)
  create                           오늘 날짜로 일기 생성 (이미지+첨부파일)
  get    <id>                      일기 단건 조회
  edit   <id> [fileId ...]         일기 수정 (선택: 삭제할 첨부파일 fileId)
  delete <id>                      일기 삭제
  list   [page] [size]             목록 조회 (기본: page=1, size=5)

예시:
  ./diary_crud.sh login admin admin
  ./diary_crud.sh create
  ./diary_crud.sh get 1
  ./diary_crud.sh edit 1 3 7        # fileId 3, 7 삭제 + 새 파일 추가
  ./diary_crud.sh delete 1
  ./diary_crud.sh list
HELP
        ;;
esac
