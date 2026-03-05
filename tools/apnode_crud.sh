#!/usr/bin/env bash
# apnode_crud.sh - ApNode(파일관리) API 테스트 스크립트
# 사용법: ./apnode_crud.sh <command> [args]

BASE_URL="http://localhost:8585/pcms"
TOKEN_FILE="/tmp/.apnode_test_token"
UPLOAD_FILE="${HOME}/tmp/test.txt"

export MSYS_NO_PATHCONV=1

# ── 유틸리티 ───────────────────────────────────────────
die()  { echo "오류: $*" >&2; exit 1; }
info() { printf "\033[1;36m>>> %s\033[0m\n" "$*"; }

winpath() {
    if command -v cygpath &>/dev/null; then
        cygpath -m "$1"
    else
        echo "$1"
    fi
}

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
    local user="${1:-kdy987}" pw="${2:-1111}"
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

cmd_list() {
    need_token
    info "GET /apnode  (루트 목록)"
    curl -sS "$BASE_URL/apnode" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_children() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 children <nodeId>"
    info "GET /apnode/$id/children"
    curl -sS "$BASE_URL/apnode/$id/children" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_path() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 path <nodeId>"
    info "GET /apnode/$id/path  (breadcrumb)"
    curl -sS "$BASE_URL/apnode/$id/path" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_get() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 get <nodeId>"
    info "GET /apnode/$id"
    curl -sS "$BASE_URL/apnode/$id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_mkdir() {
    need_token
    local name="${1:-}" ; [[ -n "$name" ]] || die "사용법: $0 mkdir <name> [parentId]"
    local parent="${2:-}"
    local body
    if [[ -n "$parent" ]]; then
        body="{\"name\":\"$name\",\"parentId\":\"$parent\"}"
    else
        body="{\"name\":\"$name\"}"
    fi
    info "POST /apnode/directories  (name=$name, parentId=${parent:-루트})"
    curl -sS -X POST "$BASE_URL/apnode/directories" \
        -H "Authorization: Bearer $TOKEN" \
        -H 'Content-Type: application/json' \
        -d "$body" | pp
}

cmd_upload() {
    need_token
    local file="${1:-$UPLOAD_FILE}"
    local parent="${2:-}"
    [[ -f "$file" ]] || die "파일 없음: $file"

    local fpath
    fpath=$(winpath "$file")
    local -a args=(-sS -X POST "$BASE_URL/apnode/files"
        -H "Authorization: Bearer $TOKEN"
        -F "file=@${fpath}")
    [[ -n "$parent" ]] && args+=(-F "parentId=$parent")

    info "POST /apnode/files  (file=$(basename "$file"), parentId=${parent:-루트})"
    curl "${args[@]}" | pp
}

cmd_link() {
    need_token
    local name="${1:-}" targetId="${2:-}"
    [[ -n "$name" && -n "$targetId" ]] || die "사용법: $0 link <name> <targetId> [parentId]"
    local parent="${3:-}"
    local body
    if [[ -n "$parent" ]]; then
        body="{\"name\":\"$name\",\"targetId\":\"$targetId\",\"parentId\":\"$parent\"}"
    else
        body="{\"name\":\"$name\",\"targetId\":\"$targetId\"}"
    fi
    info "POST /apnode/links  (name=$name → $targetId)"
    curl -sS -X POST "$BASE_URL/apnode/links" \
        -H "Authorization: Bearer $TOKEN" \
        -H 'Content-Type: application/json' \
        -d "$body" | pp
}

cmd_rename() {
    need_token
    local id="${1:-}" name="${2:-}"
    [[ -n "$id" && -n "$name" ]] || die "사용법: $0 rename <nodeId> <newName>"
    info "PUT /apnode/$id/rename  (name=$name)"
    curl -sS -X PUT "$BASE_URL/apnode/$id/rename" \
        -H "Authorization: Bearer $TOKEN" \
        -H 'Content-Type: application/json' \
        -d "{\"name\":\"$name\"}" | pp
}

cmd_move() {
    need_token
    local id="${1:-}"
    [[ -n "$id" ]] || die "사용법: $0 move <nodeId> [targetParentId]"
    local target="${2:-}"  # 비어있으면 루트로 이동
    local body
    if [[ -n "$target" ]]; then
        body="{\"targetParentId\":\"$target\"}"
    else
        body="{\"targetParentId\":null}"
    fi
    info "PUT /apnode/$id/move  (targetParentId=${target:-루트(null)})"
    curl -sS -X PUT "$BASE_URL/apnode/$id/move" \
        -H "Authorization: Bearer $TOKEN" \
        -H 'Content-Type: application/json' \
        -d "$body" | pp
}

cmd_delete() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 delete <nodeId>"
    info "DELETE /apnode/$id  (소프트 삭제)"
    curl -sS -X DELETE "$BASE_URL/apnode/$id" \
        -H "Authorization: Bearer $TOKEN" | pp
}

cmd_download() {
    need_token
    local id="${1:-}" ; [[ -n "$id" ]] || die "사용법: $0 download <nodeId> [저장경로]"
    local out="${2:-./downloaded_$(date +%s)}"
    info "GET /apnode/$id/download  → $out"
    curl -sS -OJ -o "$out" "$BASE_URL/apnode/$id/download" \
        -H "Authorization: Bearer $TOKEN"
    info "저장 완료: $out"
}

# ── 메인 ───────────────────────────────────────────────
CMD="${1:-help}" ; shift 2>/dev/null || true

case "$CMD" in
    login)    cmd_login    "$@" ;;
    list)     cmd_list     "$@" ;;
    children) cmd_children "$@" ;;
    path)     cmd_path     "$@" ;;
    get)      cmd_get      "$@" ;;
    mkdir)    cmd_mkdir    "$@" ;;
    upload)   cmd_upload   "$@" ;;
    link)     cmd_link     "$@" ;;
    rename)   cmd_rename   "$@" ;;
    move)     cmd_move     "$@" ;;
    delete)   cmd_delete   "$@" ;;
    download) cmd_download "$@" ;;
    *)
        cat <<'HELP'
사용법: ./apnode_crud.sh <command> [args]

Commands:
  login    [userId] [userPw]              로그인 후 토큰 저장 (기본: kdy987/1111)
  list                                    루트 노드 목록 조회
  children <nodeId>                       하위 노드 목록 조회
  path     <nodeId>                       루트까지 경로(breadcrumb) 조회
  get      <nodeId>                       단일 노드 조회
  mkdir    <name> [parentId]              디렉토리 생성 (parentId 생략 시 루트에 생성)
  upload   [파일경로] [parentId]          파일 업로드 (기본 파일: ~/tmp/test.txt)
  link     <name> <targetId> [parentId]   링크 생성
  rename   <nodeId> <newName>             이름 변경
  move     <nodeId> [targetParentId]      이동 (targetParentId 생략 시 루트로 이동)
  delete   <nodeId>                       소프트 삭제
  download <nodeId> [저장경로]            파일 다운로드

예시:
  ./apnode_crud.sh login
  ./apnode_crud.sh mkdir "프로젝트"
  ./apnode_crud.sh list
  ./apnode_crud.sh mkdir "2025" <위에서_받은_id>
  ./apnode_crud.sh upload ~/tmp/test.txt <dirId>
  ./apnode_crud.sh children <dirId>
  ./apnode_crud.sh rename <nodeId> "새이름"
  ./apnode_crud.sh move <nodeId> <targetDirId>
  ./apnode_crud.sh download <fileNodeId> ./output.txt
  ./apnode_crud.sh delete <nodeId>
HELP
        ;;
esac
