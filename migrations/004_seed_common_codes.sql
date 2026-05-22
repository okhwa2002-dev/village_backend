-- 공통 코드 초기 데이터
-- 그룹 코드 네이밍 규칙: {도메인}_{분류유형}_CD
WITH groups AS (
    INSERT INTO common_code_groups (code, name, description)
    VALUES
        ('PRODUCT_CATEGORY_CD',    '상품 카테고리',   '농산물 상품 분류'),
        ('DELIVERY_TYPE_CD',       '배송 유형',       '주문 배송 방식'),
        ('ORDER_CANCEL_REASON_CD', '주문 취소 사유',  '주문 취소 시 선택 사유'),
        ('VILLAGE_SECTION_CD',     '마을 콘텐츠 섹션','마을 소개 페이지 섹션 구분')
    RETURNING id, code
),
grp_product AS (SELECT id FROM groups WHERE code = 'PRODUCT_CATEGORY_CD'),
grp_delivery AS (SELECT id FROM groups WHERE code = 'DELIVERY_TYPE_CD'),
grp_cancel   AS (SELECT id FROM groups WHERE code = 'ORDER_CANCEL_REASON_CD'),
grp_village  AS (SELECT id FROM groups WHERE code = 'VILLAGE_SECTION_CD'),

ins_product AS (
    INSERT INTO common_codes (group_id, code, name, sort_order)
    SELECT id, v.code, v.name, v.sort_order FROM grp_product,
    (VALUES
        ('VEGETABLE',  '채소',      1),
        ('FRUIT',      '과일',      2),
        ('GRAIN',      '곡류',      3),
        ('MUSHROOM',   '버섯',      4),
        ('HERB',       '나물/약초', 5),
        ('PROCESSED',  '가공식품',  6)
    ) AS v(code, name, sort_order)
    RETURNING id
),
ins_delivery AS (
    INSERT INTO common_codes (group_id, code, name, sort_order)
    SELECT id, v.code, v.name, v.sort_order FROM grp_delivery,
    (VALUES
        ('COURIER', '택배',      1),
        ('DIRECT',  '직접 배송', 2),
        ('PICKUP',  '현장 수령', 3)
    ) AS v(code, name, sort_order)
    RETURNING id
),
ins_cancel AS (
    INSERT INTO common_codes (group_id, code, name, sort_order)
    SELECT id, v.code, v.name, v.sort_order FROM grp_cancel,
    (VALUES
        ('CHANGE_MIND',    '단순 변심',  1),
        ('OUT_OF_STOCK',   '품절',       2),
        ('WRONG_ORDER',    '잘못 주문',  3),
        ('DELIVERY_DELAY', '배송 지연',  4),
        ('OTHER',          '기타',       5)
    ) AS v(code, name, sort_order)
    RETURNING id
)
INSERT INTO common_codes (group_id, code, name, sort_order)
SELECT id, v.code, v.name, v.sort_order FROM grp_village,
(VALUES
    ('INTRO',     '마을 소개', 1),
    ('HISTORY',   '마을 역사', 2),
    ('SPECIALTY', '특산물',    3),
    ('NEWS',      '마을 소식', 4)
) AS v(code, name, sort_order);