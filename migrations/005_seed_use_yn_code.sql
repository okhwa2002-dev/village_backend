-- 사용여부 공통 코드 (여부 코드는 _YN으로 끝내고 _CD 없음)
WITH grp AS (
    INSERT INTO common_code_groups (code, name, description)
    VALUES ('USE_YN', '사용여부', '사용/미사용 구분 코드 (Y=사용, N=미사용)')
    RETURNING id
)
INSERT INTO common_codes (group_id, code, name, sort_order)
SELECT id, v.code, v.name, v.sort_order FROM grp,
(VALUES
    ('Y', '사용',   1),
    ('N', '미사용', 2)
) AS v(code, name, sort_order);