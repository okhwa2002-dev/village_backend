-- 초기 메뉴 데이터
WITH inserted_parents AS (
    INSERT INTO menus (name, code, path, icon, sort_order, is_visible)
    VALUES
        ('상점',       'SHOP',    '/shop',    'i-lucide-store',   1, TRUE),
        ('농민',       'FARMERS', '/farmers', 'i-lucide-wheat',   2, TRUE),
        ('마을소개',   'VILLAGE', '/village', 'i-lucide-map-pin', 3, TRUE),
        ('마이페이지', 'MY',      NULL,       'i-lucide-user',    4, TRUE),
        ('관리자',     'ADMIN',   NULL,       'i-lucide-shield',  5, TRUE)
    RETURNING id, code
),
inserted_hidden AS (
    INSERT INTO menus (name, code, path, sort_order, is_visible)
    VALUES
        ('상품 상세',  'SHOP_DETAIL',     '/shop/:id',        0, FALSE),
        ('농민 상세',  'FARMER_DETAIL',   '/farmers/:id',     0, FALSE),
        ('장바구니',   'CART',            '/cart',            0, FALSE),
        ('주문',       'ORDER',           '/order',           0, FALSE),
        ('주문 완료',  'ORDER_COMPLETE',  '/order/complete',  0, FALSE),
        ('로그인',     'AUTH_LOGIN',      '/auth/login',      0, FALSE),
        ('회원가입',   'AUTH_REGISTER',   '/auth/register',   0, FALSE)
    RETURNING id, code
),
my_parent AS (
    SELECT id FROM inserted_parents WHERE code = 'MY'
),
inserted_my AS (
    INSERT INTO menus (parent_id, name, code, path, icon, sort_order, is_visible)
    SELECT my_parent.id, v.name, v.code, v.path, v.icon, v.sort_order, TRUE
    FROM my_parent,
    (VALUES
        ('주문내역',  'MY_ORDERS',       '/my/orders',      'i-lucide-package',     1),
        ('주문 상세', 'MY_ORDER_DETAIL', '/my/orders/:id',  NULL,                   0),
        ('프로필',    'MY_PROFILE',      '/my/profile',     'i-lucide-user-circle', 2),
        ('판매상품',  'MY_PRODUCTS',     '/my/products',    'i-lucide-clipboard',   3)
    ) AS v(name, code, path, icon, sort_order)
    RETURNING id, code
),
admin_parent AS (
    SELECT id FROM inserted_parents WHERE code = 'ADMIN'
)
INSERT INTO menus (parent_id, name, code, path, icon, sort_order, is_visible)
SELECT admin_parent.id, v.name, v.code, v.path, v.icon, v.sort_order, TRUE
FROM admin_parent,
(VALUES
    ('대시보드',  'ADMIN_DASHBOARD', '/admin',           'i-lucide-layout-dashboard', 1),
    ('농민 관리', 'ADMIN_FARMERS',   '/admin/farmers',   'i-lucide-users',            2),
    ('상품 관리', 'ADMIN_PRODUCTS',  '/admin/products',  'i-lucide-boxes',            3),
    ('주문 관리', 'ADMIN_ORDERS',    '/admin/orders',    'i-lucide-shopping-bag',     4),
    ('마을 관리', 'ADMIN_VILLAGE',   '/admin/village',   'i-lucide-map',              5)
) AS v(name, code, path, icon, sort_order);