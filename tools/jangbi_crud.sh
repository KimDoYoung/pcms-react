#!/usr/bin/env bash
# jangbi_crud.sh - Jangbi(장비) CRUD API 테스트 스크립트
# 사용법: ./jangbi_crud.sh <command> [args]

BASE_URL="http://localhost:8585/pcms"
TOKEN_FILE="/tmp/.diary_test_token"
ATTACH_FILE="${HOME}/tmp/1.docx"

# Windows Git Bash(MSYS) 경로 자동변환 방지 (Linux에서는 무시됨)
export MSYS_NO_PATHCONV=1

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
    [[ -f "$TOKEN_FILE" ]] || die "먼저 로그인하세요: diary_crud.sh login"
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
    info "POST /jangbi"

    local json_file
    json_file=$(mktemp /tmp/jangbi_XXXXXX.json)
    json_file=$(winpath "$json_file")
    cat > "$json_file" <<EOF
{
  "ymd": "$(date +%Y%m%d)",
  "item": "curl 테스트 장비",
  "location": "서버실 A-1",
  "cost": 150000,
  "spec": "테스트 스펙 정보",
  "lvl": "2"
}
EOF

    local -a args=(-sS -X POST "$BASE_URL/jangbi"
        -H "Authorization: Bearer $TOKEN"
        -F "jangbi=@${json_file};type=application/json"
    )
    local attach_file
    attach_file=$(winpath "$ATTACH_FILE")
    [[ -f "$ATTACH_FILE" ]] && args+=(-F "files=@${attach_file}")

    curl "${args[@]}" | pp
    rm -f "$json_file"
}

cmd_get() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 get <id>"
    info "GET /jangbi/$id"

    curl -sS "$BASE_URL/jangbi/$id" \
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

    info "PUT /jangbi  (id=$id, 삭제 대상: $deleted_json)"

    local json_file
    json_file=$(mktemp /tmp/jangbi_XXXXXX.json)
    json_file=$(winpath "$json_file")
    cat > "$json_file" <<EOF
{
  "id": $id,
  "ymd": "$(date +%Y%m%d)",
  "item": "수정된 장비명",
  "location": "서버실 B-2",
  "cost": 250000,
  "spec": "수정된 스펙 정보",
  "lvl": "2",
  "deletedAttachmentIds": $deleted_json
}
EOF

    local -a args=(
        -sS -X PUT "$BASE_URL/jangbi"
        -H "Authorization: Bearer $TOKEN"
        -F "jangbi=@${json_file};type=application/json"
    )
    local attach_file
    attach_file=$(winpath "$ATTACH_FILE")
    [[ -f "$ATTACH_FILE" ]] && args+=(-F "files=@${attach_file}")

    curl "${args[@]}" | pp
    rm -f "$json_file"
}

cmd_delete() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 delete <id>"
    info "DELETE /jangbi/$id"

    curl -sS -X DELETE "$BASE_URL/jangbi/$id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_list() {
    need_token
    local page="${1:-1}" size="${2:-5}"
    info "GET /jangbi?page=$page&size=$size"

    curl -sS "$BASE_URL/jangbi?page=$page&size=$size" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_search() {
    need_token
    local keyword="${1:-}" page="${2:-1}" size="${3:-5}"
    [[ -n "$keyword" ]] || die "사용법: $0 search <keyword> [page] [size]"
    info "GET /jangbi?keyword=$keyword&page=$page&size=$size"

    curl -sS "$BASE_URL/jangbi?keyword=$keyword&page=$page&size=$size" \
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
사용법: ./jangbi_crud.sh <command> [args]

Commands:
  login                            로그인 후 토큰 저장 (kdy987/1111)
  create                           장비 등록 (첨부파일 선택)
  get    <id>                      장비 단건 조회
  edit   <id> [fileId ...]         장비 수정 (선택: 삭제할 첨부파일 fileId)
  delete <id>                      장비 삭제
  list   [page] [size]             목록 조회 (기본: page=1, size=5)
  search <keyword> [page] [size]   키워드 검색 (item/location/spec)

예시:
  ./jangbi_crud.sh login
  ./jangbi_crud.sh create
  ./jangbi_crud.sh get 1
  ./jangbi_crud.sh edit 1 3 7      # fileId 3, 7 삭제 + 새 파일 추가
  ./jangbi_crud.sh delete 1
  ./jangbi_crud.sh list
  ./jangbi_crud.sh search 서버
HELP
        ;;
esac
