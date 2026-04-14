-- ============================================================
-- kdy987_db_schema.sql
-- 생성일: 2026-02-12
-- 수정일: 2026-02-24
-- ============================================================
-- [DROP 순서 주의] FK 의존성 역순으로 제거
--   role_menu → audit_log → users → menu → company
-- ============================================================

CREATE SCHEMA IF NOT EXISTS cms;
SET search_path TO cms;

-- 1. 사용자 테이블
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    user_pw VARCHAR(200) NOT NULL,
    user_nm VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE users IS '사용자';
COMMENT ON COLUMN users.id IS '사용자ID(PK)';
COMMENT ON COLUMN users.user_id IS '사용자 로그인 ID';

-- 기본 데이터 삽입
INSERT INTO users (user_id, user_pw, user_nm) VALUES
('kdy987', '$2a$10$vUYXTNVJV7h9pXpQR0W5s.E7pGvS.0OcvJqUMo3D3VFxq4nqquM3e', 'KimDoYoung'),
('admin', '$2a$10$Z3RTwwcpMPh4Egi/3P75N.x5JCu3iiUkPz7v2mwvFTHh2.nNvZX7K', 'Admin');

-- 2. 사용자 설정
DROP TABLE IF EXISTS user_settings CASCADE;
CREATE TABLE user_settings (
    setting_id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uk_user_setting UNIQUE (user_id, setting_key)
);

-- 3. 일기 (Diary)
DROP TABLE IF EXISTS diary CASCADE;
CREATE TABLE diary (
    id BIGSERIAL PRIMARY KEY,
    ymd VARCHAR(8) NOT NULL UNIQUE,
    content TEXT,
    summary VARCHAR(300),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_diary_ymd ON diary(ymd);

-- 4. 장비 (Jangbi)
DROP TABLE IF EXISTS jangbi CASCADE;
CREATE TABLE jangbi (
    id BIGSERIAL PRIMARY KEY,
    ymd VARCHAR(8) NOT NULL,
    item VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    cost INTEGER,
    spec TEXT,
    lvl VARCHAR(1) NOT NULL DEFAULT '2',
    modify_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 파일 정보 (Files)
DROP TABLE IF EXISTS files CASCADE;
CREATE TABLE files (
    file_id BIGSERIAL PRIMARY KEY,
    saved_folder VARCHAR(500) NOT NULL,
    org_file_name VARCHAR(255) NOT NULL,
    physical_file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_files_physical_name ON files(physical_file_name);
CREATE INDEX idx_files_org_file_name ON files(org_file_name);

-- 6. 파일 매칭 (File Match)
DROP TABLE IF EXISTS file_match CASCADE;
CREATE TABLE file_match (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    target_id BIGINT NOT NULL,
    file_id BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_file_match_file FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    CONSTRAINT uk_target_file UNIQUE (table_name, target_id, file_id, file_type)
);
CREATE INDEX idx_file_match_table_target ON file_match(table_name, target_id);
CREATE INDEX idx_file_match_type ON file_match(table_name, target_id, file_type);

-- 7. 할 일 (Todo)
DROP TABLE IF EXISTS todo CASCADE;
CREATE TABLE todo (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(300) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. 게시판 마스터 (Boards)
DROP TABLE IF EXISTS boards CASCADE;
CREATE TABLE boards (
    id BIGSERIAL PRIMARY KEY,
    board_code VARCHAR(50) NOT NULL UNIQUE,
    board_name_kor VARCHAR(100) NOT NULL,
    content_type VARCHAR(10) NOT NULL DEFAULT 'html',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_boards_name_kor ON boards(board_name_kor);

-- 9. 게시글 (Posts)
DROP TABLE IF EXISTS posts CASCADE;
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(100) NOT NULL DEFAULT '관리자',
    content TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    base_ymd VARCHAR(8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_base_ymd ON posts(base_ymd);
CREATE INDEX idx_posts_title ON posts(title);

-- 10. 캘린더 (Calendar)
DROP TABLE IF EXISTS calendar CASCADE;
CREATE TABLE calendar (
    id SERIAL PRIMARY KEY,
    gubun CHAR(1) NOT NULL,
    sorl CHAR(1) NOT NULL DEFAULT 'S',
    ymd VARCHAR(8) NOT NULL,
    content VARCHAR(200) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT 'blue' CHECK (color IN ('blue','red','green','purple','orange','pink','yellow','teal','indigo','gray','rose','sky')),
    created_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_calendar_gubun_ymd ON calendar(gubun, ymd);
CREATE INDEX idx_calendar_sorl ON calendar(sorl);

-- 11. 공공데이터 캘린더
DROP TABLE IF EXISTS calendar_public CASCADE;
CREATE TABLE calendar_public (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(10) NOT NULL,
    ymd VARCHAR(8) NOT NULL,
    content VARCHAR(200) NOT NULL,
    created_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_calendar_public_ymd_type UNIQUE (ymd, data_type)
);

-- 1. 트리 구조 (노드) 테이블
DROP TABLE IF EXISTS ap_node CASCADE;
CREATE TABLE ap_node (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- PostgreSQL 표준 UUID 사용
    node_type CHAR(1) NOT NULL CHECK (node_type IN ('F', 'D', 'L')), -- F:파일, D:디렉토리, L:링크
    parent_id UUID,
    name VARCHAR(255) NOT NULL,
    depth INT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    delete_dt TIMESTAMP WITH TIME ZONE,
    create_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modify_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 디렉토리 전용 필드 (캐시)
    child_count INT DEFAULT 0,
    total_size BIGINT DEFAULT 0,

    -- 링크 전용 필드 (L 타입일 때만 사용)
    link_target_id UUID REFERENCES ap_node(id) ON DELETE SET NULL,

    -- 제약 조건
    CONSTRAINT fk_node_parent FOREIGN KEY (parent_id) REFERENCES ap_node(id) ON DELETE RESTRICT,
    CONSTRAINT chk_depth CHECK (depth >= 0 AND depth <= 20),
    -- 동일 부모 내 이름 중복 방지 (삭제되지 않은 노드들 중에서만)
    CONSTRAINT uk_parent_name UNIQUE (parent_id, name, is_deleted)
);

-- 인덱스
CREATE INDEX idx_ap_node_parent ON ap_node(parent_id);
CREATE INDEX idx_ap_node_type_deleted ON ap_node(node_type, is_deleted);

-- 코멘트
COMMENT ON TABLE ap_node IS '파일/디렉토리 트리 노드';
COMMENT ON COLUMN ap_node.node_type IS 'F:파일, D:디렉토리, L:링크';

-- 2. 파일 상세 정보 테이블
DROP TABLE IF EXISTS ap_file CASCADE;
CREATE TABLE ap_file (
    node_id UUID PRIMARY KEY,
    saved_path VARCHAR(1000) NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    sha256_hash CHAR(64),
    
    -- 이미지 전용 필드
    width INT,
    height INT,
    thumbnail_path VARCHAR(500),
    
    upload_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_file_node FOREIGN KEY (node_id) REFERENCES ap_node(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_ap_file_hash ON ap_file(sha256_hash);
CREATE INDEX idx_ap_file_content_type ON ap_file(content_type);

COMMENT ON TABLE ap_file IS '파일 상세 메타데이터';

---
-- 3. modify_dt 자동 업데이트를 위한 트리거 (PostgreSQL 필수 단계)
---
CREATE OR REPLACE FUNCTION update_modify_dt_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modify_dt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_ap_node_modify_dt
    BEFORE UPDATE ON ap_node
    FOR EACH ROW
    EXECUTE FUNCTION update_modify_dt_column();

-- 한자 사전 캐시 테이블 (Naver 한자 사전 조회 결과를 저장해 재호출 방지)
DROP TABLE IF EXISTS hanja_dic CASCADE;
CREATE TABLE hanja_dic (
    id         BIGSERIAL PRIMARY KEY,
    korean     VARCHAR(100) NOT NULL,   -- 검색한 한글 단어 (e.g. '운명')
    hanja      VARCHAR(100) NOT NULL,   -- 한자 (e.g. '運命')
    meaning    TEXT,                    -- 뜻풀이 (첫 번째 mean_item 텍스트)
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_hanja_dic_korean ON hanja_dic(korean);