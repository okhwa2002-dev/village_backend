-- 013: JWT → DB 세션 전환, login_id/name/phone/last_login_at/password_changed_at 추가

-- 1. users 컬럼 추가
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS login_id            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS name                VARCHAR(100),
    ADD COLUMN IF NOT EXISTS phone               VARCHAR(20),
    ADD COLUMN IF NOT EXISTS last_login_at       TIMESTAMP,
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- email NOT NULL 제약 해제
ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id
    ON users(login_id) WHERE deleted_at IS NULL;

-- 2. user_sessions 신규
CREATE TABLE IF NOT EXISTS user_sessions (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id),
    token      VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP   NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token
    ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
    ON user_sessions(expires_at);