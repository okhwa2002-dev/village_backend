-- 초기 사용자 데이터
-- 기본 비밀번호: village1234 (bcrypt hash)
WITH inserted_users AS (
    INSERT INTO users (email, password, role, status)
    VALUES
        ('admin@village.com',   '$2a$10$qjEerfLovC/HnMBMz67I0.bGW9MD7Njco8gxIcvaoXo4ugmxnWFum', 'admin',    'active'),
        ('jeonla@village.com',  '$2a$10$qjEerfLovC/HnMBMz67I0.bGW9MD7Njco8gxIcvaoXo4ugmxnWFum', 'admin',    'active'),
        ('farmer@village.com',  '$2a$10$qjEerfLovC/HnMBMz67I0.bGW9MD7Njco8gxIcvaoXo4ugmxnWFum', 'farmer',   'active'),
        ('user@village.com',    '$2a$10$qjEerfLovC/HnMBMz67I0.bGW9MD7Njco8gxIcvaoXo4ugmxnWFum', 'consumer', 'active')
    RETURNING id, email, role
),
-- 농업인 프로필 생성
farmer_user AS (
    SELECT id FROM inserted_users WHERE role = 'farmer'
),
inserted_farmer_profile AS (
    INSERT INTO farmer_profiles (user_id, name, bio, farm_description)
    SELECT id, '안덕마을 농업인', '안덕마을에서 친환경 농산물을 재배합니다.', '전라도 안덕마을에 위치한 친환경 농장입니다.'
    FROM farmer_user
),
-- 조직 ID 조회
orgs AS (
    SELECT id, code FROM organizations WHERE code IN ('KR', 'KR_JEONLA', 'KR_JEONLA_ANDEOK')
)
-- 사용자-조직 매핑
INSERT INTO user_organizations (user_id, organization_id)
SELECT u.id, o.id
FROM inserted_users u
JOIN orgs o ON (
    (u.email = 'admin@village.com'  AND o.code = 'KR')               OR
    (u.email = 'jeonla@village.com' AND o.code = 'KR_JEONLA')        OR
    (u.email = 'farmer@village.com' AND o.code = 'KR_JEONLA_ANDEOK') OR
    (u.email = 'user@village.com'   AND o.code = 'KR_JEONLA_ANDEOK')
);