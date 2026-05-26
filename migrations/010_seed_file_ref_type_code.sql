-- 파일 업무 구분 공통 코드
WITH grp AS (
    INSERT INTO common_code_groups (code, name, description)
    VALUES ('FILE_REF_TYPE_CD', '파일 업무 구분', '파일 그룹이 속한 업무 영역')
    RETURNING id
)
INSERT INTO common_codes (group_id, code, name, sort_order)
SELECT id, v.code, v.name, v.sort_order FROM grp,
(VALUES
    ('PRODUCT', '상품',        1),
    ('FARMER',  '농민 프로필', 2),
    ('VILLAGE', '마을 콘텐츠', 3),
    ('BOARD',   '게시판',      4)
) AS v(code, name, sort_order);