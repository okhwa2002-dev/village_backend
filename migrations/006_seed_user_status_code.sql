-- 사용자 상태 공통 코드
WITH grp AS (
    INSERT INTO common_code_groups (code, name, description)
    VALUES ('USER_STATUS_CD', '사용자 상태', '사용자 계정 상태 구분')
    RETURNING id
)
INSERT INTO common_codes (group_id, code, name, sort_order)
SELECT id, v.code, v.name, v.sort_order FROM grp,
(VALUES
    ('PENDING',  '승인대기', 1),
    ('ACTIVE',   '정상',     2),
    ('INACTIVE', '비활성',   3)
) AS v(code, name, sort_order);