-- 상품 상태 공통 코드
WITH grp AS (
    INSERT INTO common_code_groups (code, name, description)
    VALUES ('PRODUCT_STATUS_CD', '상품 상태', '상품 판매 상태 구분')
    RETURNING id
)
INSERT INTO common_codes (group_id, code, name, sort_order)
SELECT id, v.code, v.name, v.sort_order FROM grp,
(VALUES
    ('ACTIVE',   '판매중', 1),
    ('HIDDEN',   '숨김',   2),
    ('SOLDOUT',  '품절',   3)
) AS v(code, name, sort_order);