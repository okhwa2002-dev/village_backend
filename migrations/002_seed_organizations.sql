-- 초기 조직 데이터: 대한민국 > 전라도 > 안덕마을
WITH org_top AS (
    INSERT INTO organizations (name, code, level, sort_order)
    VALUES ('대한민국', 'KR', 1, 1)
    RETURNING id
),
org_mid AS (
    INSERT INTO organizations (parent_id, name, code, level, sort_order)
    SELECT id, '전라도', 'KR_JEONLA', 2, 1 FROM org_top
    RETURNING id
)
INSERT INTO organizations (parent_id, name, code, level, sort_order)
SELECT id, '안덕마을', 'KR_JEONLA_ANDEOK', 3, 1 FROM org_mid;