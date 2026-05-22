-- 주문 상태 공통 코드
WITH grp AS (
    INSERT INTO common_code_groups (code, name, description)
    VALUES ('ORDER_STATUS_CD', '주문 상태', '주문 처리 상태 구분')
    RETURNING id
)
INSERT INTO common_codes (group_id, code, name, sort_order)
SELECT id, v.code, v.name, v.sort_order FROM grp,
(VALUES
    ('PENDING',    '주문대기',   1),
    ('CONFIRMED',  '주문확인',   2),
    ('SHIPPED',    '배송중',     3),
    ('DELIVERED',  '배송완료',   4),
    ('CANCELLED',  '취소',       5)
) AS v(code, name, sort_order);
