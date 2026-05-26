-- Village Market Database Schema
-- PostgreSQL

-- ENUM 타입 정의
CREATE TYPE user_role AS ENUM ('admin', 'farmer', 'consumer');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE product_status AS ENUM ('active', 'hidden', 'soldout');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- 사용자
CREATE TABLE users (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        user_role    NOT NULL,
    status      user_status  NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  BIGINT       REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT       REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  users            IS '서비스 사용자 (소비자/농민/관리자 통합)';
COMMENT ON COLUMN users.id         IS '사용자 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN users.email      IS '로그인 이메일 (유일값)';
COMMENT ON COLUMN users.password   IS 'bcrypt 해시된 비밀번호';
COMMENT ON COLUMN users.role       IS '역할: admin=관리자, farmer=농민, consumer=소비자';
COMMENT ON COLUMN users.status     IS '계정 상태 (공통코드 USER_STATUS_CD 참조: PENDING=승인대기, ACTIVE=정상, INACTIVE=비활성)';
COMMENT ON COLUMN users.created_at IS '계정 생성 일시';
COMMENT ON COLUMN users.created_by IS '최초 생성자 ID (자가 가입이면 NULL)';
COMMENT ON COLUMN users.updated_at IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN users.updated_by IS '마지막 수정자 ID';
COMMENT ON COLUMN users.deleted_at IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN users.deleted_by IS '삭제 처리한 관리자 ID';
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- 농민 프로필
CREATE TABLE farmer_profiles (
    id               BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    bio              TEXT,
    file_group_id    BIGINT,
    farm_description TEXT,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by       BIGINT       REFERENCES users(id),
    updated_at       TIMESTAMP,
    updated_by       BIGINT       REFERENCES users(id),
    deleted_at       TIMESTAMP,
    deleted_by       BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  farmer_profiles                  IS '농민 프로필 (users.role=farmer인 경우에만 존재)';
COMMENT ON COLUMN farmer_profiles.id               IS '농민 프로필 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN farmer_profiles.user_id          IS 'users.id 참조 (1:1 관계)';
COMMENT ON COLUMN farmer_profiles.name             IS '농민 표시 이름';
COMMENT ON COLUMN farmer_profiles.bio              IS '농민 소개글';
COMMENT ON COLUMN farmer_profiles.file_group_id IS 'file_groups.id 참조 (NULL이면 사진 없음)';
COMMENT ON COLUMN farmer_profiles.farm_description IS '농장 상세 설명';
COMMENT ON COLUMN farmer_profiles.created_at       IS '프로필 생성 일시';
COMMENT ON COLUMN farmer_profiles.created_by       IS '생성자 ID';
COMMENT ON COLUMN farmer_profiles.updated_at       IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN farmer_profiles.updated_by       IS '마지막 수정자 ID';
COMMENT ON COLUMN farmer_profiles.deleted_at       IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN farmer_profiles.deleted_by       IS '삭제 처리자 ID';
CREATE INDEX idx_farmer_profiles_user_id    ON farmer_profiles(user_id);
CREATE INDEX idx_farmer_profiles_deleted_at ON farmer_profiles(deleted_at) WHERE deleted_at IS NULL;

-- 상품
CREATE TABLE products (
    id          BIGINT         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farmer_id   BIGINT         NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
    name        VARCHAR(200)   NOT NULL,
    description TEXT,
    price       INTEGER        NOT NULL,
    stock       INTEGER        NOT NULL DEFAULT 0,
    category    VARCHAR(50)    NOT NULL,
    file_group_id BIGINT,
    status      product_status NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    created_by  BIGINT         REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT         REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT         REFERENCES users(id)
);
COMMENT ON TABLE  products             IS '농민이 등록한 판매 상품';
COMMENT ON COLUMN products.id          IS '상품 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN products.farmer_id   IS 'farmer_profiles.id 참조';
COMMENT ON COLUMN products.name        IS '상품명';
COMMENT ON COLUMN products.description IS '상품 상세 설명';
COMMENT ON COLUMN products.price       IS '판매 가격 (원 단위, 정수)';
COMMENT ON COLUMN products.stock       IS '현재 재고 수량 (주문 시 차감)';
COMMENT ON COLUMN products.category    IS '상품 카테고리 (예: 채소, 과일, 곡류)';
COMMENT ON COLUMN products.file_group_id IS 'file_groups.id 참조 (NULL이면 이미지 없음)';
COMMENT ON COLUMN products.status      IS '판매 상태 (공통코드 PRODUCT_STATUS_CD 참조: ACTIVE=판매중, HIDDEN=숨김, SOLDOUT=품절)';
COMMENT ON COLUMN products.created_at  IS '상품 등록 일시';
COMMENT ON COLUMN products.created_by  IS '등록자 ID';
COMMENT ON COLUMN products.updated_at  IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN products.updated_by  IS '마지막 수정자 ID';
COMMENT ON COLUMN products.deleted_at  IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN products.deleted_by  IS '삭제 처리자 ID';
CREATE INDEX idx_products_farmer_id  ON products(farmer_id);
CREATE INDEX idx_products_status     ON products(status);
CREATE INDEX idx_products_category      ON products(category);
CREATE INDEX idx_products_file_group_id ON products(file_group_id);
CREATE INDEX idx_products_deleted_at    ON products(deleted_at) WHERE deleted_at IS NULL;

-- 장바구니
CREATE TABLE carts (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT       REFERENCES users(id) ON DELETE CASCADE,
    guest_token VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  BIGINT       REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT       REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT       REFERENCES users(id),
    CONSTRAINT cart_owner CHECK (
        (user_id IS NOT NULL AND guest_token IS NULL) OR
        (user_id IS NULL AND guest_token IS NOT NULL)
    )
);
COMMENT ON TABLE  carts             IS '장바구니 (로그인 사용자 또는 비회원 guest_token 중 하나만 사용)';
COMMENT ON COLUMN carts.id          IS '장바구니 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN carts.user_id     IS '로그인 사용자 ID (비회원이면 NULL)';
COMMENT ON COLUMN carts.guest_token IS '비회원 장바구니 식별 토큰 (로그인 사용자이면 NULL)';
COMMENT ON COLUMN carts.created_at  IS '장바구니 생성 일시';
COMMENT ON COLUMN carts.created_by  IS '생성자 ID';
COMMENT ON COLUMN carts.updated_at  IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN carts.updated_by  IS '마지막 수정자 ID';
COMMENT ON COLUMN carts.deleted_at  IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN carts.deleted_by  IS '삭제 처리자 ID';
CREATE INDEX idx_carts_user_id    ON carts(user_id);
CREATE INDEX idx_carts_deleted_at ON carts(deleted_at) WHERE deleted_at IS NULL;

-- 장바구니 상품
CREATE TABLE cart_items (
    id         BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id    BIGINT    NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   INTEGER   NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT    REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by BIGINT    REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by BIGINT    REFERENCES users(id),
    UNIQUE (cart_id, product_id)
);
COMMENT ON TABLE  cart_items             IS '장바구니 상품 목록';
COMMENT ON COLUMN cart_items.id          IS '장바구니 상품 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN cart_items.cart_id     IS 'carts.id 참조';
COMMENT ON COLUMN cart_items.product_id  IS 'products.id 참조';
COMMENT ON COLUMN cart_items.quantity    IS '담은 수량 (동일 상품 추가 시 누적)';
COMMENT ON COLUMN cart_items.created_at  IS '항목 추가 일시';
COMMENT ON COLUMN cart_items.created_by  IS '생성자 ID';
COMMENT ON COLUMN cart_items.updated_at  IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN cart_items.updated_by  IS '마지막 수정자 ID';
COMMENT ON COLUMN cart_items.deleted_at  IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN cart_items.deleted_by  IS '삭제 처리자 ID';
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- 주문
CREATE TABLE orders (
    id             BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number   VARCHAR(30)  NOT NULL UNIQUE,
    user_id        BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    consumer_name  VARCHAR(100) NOT NULL,
    consumer_phone VARCHAR(20)  NOT NULL,
    consumer_email VARCHAR(255) NOT NULL,
    address        TEXT         NOT NULL,
    memo           TEXT,
    status         order_status NOT NULL DEFAULT 'pending',
    total_price    INTEGER      NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by     BIGINT       REFERENCES users(id),
    updated_at     TIMESTAMP,
    updated_by     BIGINT       REFERENCES users(id),
    deleted_at     TIMESTAMP,
    deleted_by     BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  orders                IS '주문 (비회원 주문 가능, user_id는 NULL 허용)';
COMMENT ON COLUMN orders.id             IS '주문 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN orders.order_number   IS '주문 번호 (예: ORD-20260521-A3F9K2), 외부 노출용';
COMMENT ON COLUMN orders.user_id        IS '로그인 회원 주문이면 연결, 비회원이면 NULL';
COMMENT ON COLUMN orders.consumer_name  IS '수령인 이름';
COMMENT ON COLUMN orders.consumer_phone IS '수령인 연락처';
COMMENT ON COLUMN orders.consumer_email IS '수령인 이메일';
COMMENT ON COLUMN orders.address        IS '배송지 주소';
COMMENT ON COLUMN orders.memo           IS '배송 메모';
COMMENT ON COLUMN orders.status         IS '주문 상태 (공통코드 ORDER_STATUS_CD 참조: PENDING=주문대기, CONFIRMED=주문확인, SHIPPED=배송중, DELIVERED=배송완료, CANCELLED=취소)';
COMMENT ON COLUMN orders.total_price    IS '최종 결제 금액 (원 단위, 정수)';
COMMENT ON COLUMN orders.created_at     IS '주문 생성 일시';
COMMENT ON COLUMN orders.created_by     IS '생성자 ID';
COMMENT ON COLUMN orders.updated_at     IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN orders.updated_by     IS '마지막 수정자 ID';
COMMENT ON COLUMN orders.deleted_at     IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN orders.deleted_by     IS '삭제 처리자 ID';
CREATE INDEX idx_orders_user_id    ON orders(user_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NULL;

-- 주문 상품
CREATE TABLE order_items (
    id             BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id       BIGINT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id     BIGINT    NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity       INTEGER   NOT NULL,
    price_at_order INTEGER   NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by     BIGINT    REFERENCES users(id),
    updated_at     TIMESTAMP,
    updated_by     BIGINT    REFERENCES users(id),
    deleted_at     TIMESTAMP,
    deleted_by     BIGINT    REFERENCES users(id)
);
COMMENT ON TABLE  order_items                IS '주문 상품 목록';
COMMENT ON COLUMN order_items.id             IS '주문 상품 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN order_items.order_id       IS 'orders.id 참조';
COMMENT ON COLUMN order_items.product_id     IS 'products.id 참조 (삭제 제한, 주문 이력 보존)';
COMMENT ON COLUMN order_items.quantity       IS '주문 수량';
COMMENT ON COLUMN order_items.price_at_order IS '주문 시점의 상품 가격 (이후 가격 변동과 무관하게 보존)';
COMMENT ON COLUMN order_items.created_at     IS '항목 생성 일시';
COMMENT ON COLUMN order_items.created_by     IS '생성자 ID';
COMMENT ON COLUMN order_items.updated_at     IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN order_items.updated_by     IS '마지막 수정자 ID';
COMMENT ON COLUMN order_items.deleted_at     IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN order_items.deleted_by     IS '삭제 처리자 ID';
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 조직
CREATE TABLE organizations (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id   BIGINT       REFERENCES organizations(id),
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    level       INTEGER      NOT NULL DEFAULT 1,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  BIGINT       REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT       REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  organizations            IS '조직 (계층형, parent_id로 상하위 관계 표현)';
COMMENT ON COLUMN organizations.id         IS '조직 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN organizations.parent_id  IS '상위 조직 ID (NULL이면 최상위)';
COMMENT ON COLUMN organizations.name       IS '조직 표시 이름';
COMMENT ON COLUMN organizations.code       IS '조직 식별 코드 (예: HQ, REGION_SOUTH, VILLAGE_A)';
COMMENT ON COLUMN organizations.level      IS '조직 깊이 (1=최상위, 2=중간, 3=하위 ...)';
COMMENT ON COLUMN organizations.sort_order IS '같은 레벨 내 표시 순서';
COMMENT ON COLUMN organizations.created_at IS '조직 생성 일시';
COMMENT ON COLUMN organizations.created_by IS '생성자 ID';
COMMENT ON COLUMN organizations.updated_at IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN organizations.updated_by IS '마지막 수정자 ID';
COMMENT ON COLUMN organizations.deleted_at IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN organizations.deleted_by IS '삭제 처리자 ID';
CREATE INDEX idx_organizations_parent_id  ON organizations(parent_id);
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;

-- 사용자-조직 매핑
CREATE TABLE user_organizations (
    id              BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id BIGINT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      BIGINT    REFERENCES users(id),
    updated_at      TIMESTAMP,
    updated_by      BIGINT    REFERENCES users(id),
    deleted_at      TIMESTAMP,
    deleted_by      BIGINT    REFERENCES users(id),
    UNIQUE (user_id, organization_id)
);
COMMENT ON TABLE  user_organizations                 IS '사용자-조직 매핑 (다대다)';
COMMENT ON COLUMN user_organizations.id              IS '매핑 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN user_organizations.user_id         IS 'users.id 참조';
COMMENT ON COLUMN user_organizations.organization_id IS 'organizations.id 참조';
COMMENT ON COLUMN user_organizations.created_at      IS '매핑 생성 일시';
COMMENT ON COLUMN user_organizations.created_by      IS '생성자 ID';
COMMENT ON COLUMN user_organizations.updated_at      IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN user_organizations.updated_by      IS '마지막 수정자 ID';
COMMENT ON COLUMN user_organizations.deleted_at      IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN user_organizations.deleted_by      IS '삭제 처리자 ID';
CREATE INDEX idx_user_organizations_user_id         ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_organization_id ON user_organizations(organization_id);

-- 메뉴 그룹
CREATE TABLE menu_groups (
    id         BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(50)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    icon       VARCHAR(100),
    sort_order INTEGER      NOT NULL DEFAULT 0,
    use_yn     CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y', 'N')),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by BIGINT       REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by BIGINT       REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  menu_groups            IS '메뉴 그룹 (사이드바 카테고리)';
COMMENT ON COLUMN menu_groups.code       IS '그룹 식별 코드 (예: SYSTEM_ADMIN, SERVICE_ADMIN)';
COMMENT ON COLUMN menu_groups.use_yn     IS '사용 여부 (Y=사용, N=미사용)';
CREATE INDEX idx_menu_groups_deleted_at ON menu_groups(deleted_at) WHERE deleted_at IS NULL;

-- 메뉴
CREATE TABLE menus (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id    BIGINT       REFERENCES menu_groups(id),
    parent_id   BIGINT       REFERENCES menus(id),
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    path        VARCHAR(200),
    icon        VARCHAR(100),
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    is_visible  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  BIGINT       REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT       REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  menus            IS '메뉴 목록 (계층형, parent_id로 상하위 관계 표현)';
COMMENT ON COLUMN menus.id         IS '메뉴 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN menus.group_id   IS '메뉴 그룹 ID (menu_groups.id 참조)';
COMMENT ON COLUMN menus.parent_id  IS '상위 메뉴 ID (NULL이면 최상위)';
COMMENT ON COLUMN menus.name       IS '메뉴 표시 이름';
COMMENT ON COLUMN menus.code       IS '메뉴 식별 코드 (예: SHOP, ADMIN_ORDER)';
COMMENT ON COLUMN menus.path       IS '프론트엔드 라우트 경로 (예: /admin/orders)';
COMMENT ON COLUMN menus.icon       IS '아이콘 식별자 (예: i-lucide-home)';
COMMENT ON COLUMN menus.sort_order IS '같은 레벨 내 표시 순서 (오름차순)';
COMMENT ON COLUMN menus.is_visible IS '네비게이션 노출 여부 (false=숨김 메뉴)';
COMMENT ON COLUMN menus.created_at IS '메뉴 생성 일시';
COMMENT ON COLUMN menus.created_by IS '생성자 ID';
COMMENT ON COLUMN menus.updated_at IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN menus.updated_by IS '마지막 수정자 ID';
COMMENT ON COLUMN menus.deleted_at IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN menus.deleted_by IS '삭제 처리자 ID';
CREATE INDEX idx_menus_parent_id  ON menus(parent_id);
CREATE INDEX idx_menus_group_id   ON menus(group_id);
CREATE INDEX idx_menus_deleted_at ON menus(deleted_at) WHERE deleted_at IS NULL;

-- 권한
CREATE TABLE permissions (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  BIGINT       REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT       REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  permissions             IS '권한 (명칭 단위 독립 엔티티)';
COMMENT ON COLUMN permissions.code        IS '권한 식별 코드 (예: SUPER_ADMIN, ORDER_MANAGER)';
COMMENT ON COLUMN permissions.description IS '권한 설명';
CREATE INDEX idx_permissions_deleted_at ON permissions(deleted_at) WHERE deleted_at IS NULL;

-- 조직-권한 매핑
CREATE TABLE org_permissions (
    id              BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id BIGINT    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permission_id   BIGINT    NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      BIGINT    REFERENCES users(id),
    updated_at      TIMESTAMP,
    updated_by      BIGINT    REFERENCES users(id),
    deleted_at      TIMESTAMP,
    deleted_by      BIGINT    REFERENCES users(id),
    UNIQUE (organization_id, permission_id)
);
COMMENT ON TABLE  org_permissions                 IS '조직-권한 매핑 (조직에 권한을 부여, 소속 사용자에게 자동 적용)';
COMMENT ON COLUMN org_permissions.id              IS '매핑 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN org_permissions.organization_id IS 'organizations.id 참조';
COMMENT ON COLUMN org_permissions.permission_id   IS 'permissions.id 참조';
COMMENT ON COLUMN org_permissions.created_at      IS '매핑 생성 일시';
COMMENT ON COLUMN org_permissions.created_by      IS '생성자 ID';
COMMENT ON COLUMN org_permissions.updated_at      IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN org_permissions.updated_by      IS '마지막 수정자 ID';
COMMENT ON COLUMN org_permissions.deleted_at      IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN org_permissions.deleted_by      IS '삭제 처리자 ID';
CREATE INDEX idx_org_permissions_organization_id ON org_permissions(organization_id);
CREATE INDEX idx_org_permissions_permission_id   ON org_permissions(permission_id);

-- 권한별 메뉴 접근 범위
CREATE TABLE permission_menus (
    id            BIGINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permission_id BIGINT    NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    menu_id       BIGINT    NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    edit_yn       CHAR(1)   NOT NULL DEFAULT 'N' CHECK (edit_yn IN ('Y', 'N')),
    delete_yn     CHAR(1)   NOT NULL DEFAULT 'N' CHECK (delete_yn IN ('Y', 'N')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by    BIGINT    REFERENCES users(id),
    updated_at    TIMESTAMP,
    updated_by    BIGINT    REFERENCES users(id),
    deleted_at    TIMESTAMP,
    deleted_by    BIGINT    REFERENCES users(id)
);
COMMENT ON TABLE  permission_menus               IS '권한별 메뉴 접근 범위 (행 존재=읽기, edit_yn/delete_yn으로 수정/삭제 제어)';
COMMENT ON COLUMN permission_menus.permission_id IS 'permissions.id 참조';
COMMENT ON COLUMN permission_menus.menu_id       IS 'menus.id 참조';
COMMENT ON COLUMN permission_menus.edit_yn       IS '수정 가능 여부 (Y=가능)';
COMMENT ON COLUMN permission_menus.delete_yn     IS '삭제 가능 여부 (Y=가능)';
COMMENT ON COLUMN permission_menus.deleted_at    IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN permission_menus.deleted_by    IS '삭제 처리자 ID';
CREATE UNIQUE INDEX uidx_permission_menus ON permission_menus(permission_id, menu_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_permission_menus_permission_id ON permission_menus(permission_id);
CREATE INDEX idx_permission_menus_menu_id       ON permission_menus(menu_id);
CREATE INDEX idx_permission_menus_deleted_at    ON permission_menus(deleted_at) WHERE deleted_at IS NULL;

-- 마을 콘텐츠
CREATE TABLE village_content (
    id         BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    section    VARCHAR(50)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    body       TEXT,
    file_group_id BIGINT,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    published  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by BIGINT       REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by BIGINT       REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  village_content            IS '마을 소개 콘텐츠 (section별로 구분하여 관리)';
COMMENT ON COLUMN village_content.id         IS '콘텐츠 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN village_content.section    IS '콘텐츠 구분 (예: intro, history, specialty)';
COMMENT ON COLUMN village_content.title      IS '콘텐츠 제목';
COMMENT ON COLUMN village_content.body       IS '콘텐츠 본문 (마크다운 또는 HTML)';
COMMENT ON COLUMN village_content.file_group_id IS 'file_groups.id 참조 (NULL이면 이미지 없음)';
COMMENT ON COLUMN village_content.sort_order IS '같은 section 내 표시 순서 (오름차순)';
COMMENT ON COLUMN village_content.published  IS '공개 여부 (false=임시저장, true=공개)';
COMMENT ON COLUMN village_content.created_at IS '콘텐츠 생성 일시';
COMMENT ON COLUMN village_content.created_by IS '생성자 ID';
COMMENT ON COLUMN village_content.updated_at IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN village_content.updated_by IS '마지막 수정자 ID';
COMMENT ON COLUMN village_content.deleted_at IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN village_content.deleted_by IS '삭제 처리자 ID';
CREATE INDEX idx_village_section             ON village_content(section);
CREATE INDEX idx_village_content_deleted_at  ON village_content(deleted_at) WHERE deleted_at IS NULL;

-- 파일 그룹
CREATE TABLE file_groups (
    id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ref_type   VARCHAR(50) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by BIGINT      REFERENCES users(id)
);
COMMENT ON TABLE  file_groups            IS '파일 그룹 컨테이너 (엔티티당 하나의 그룹)';
COMMENT ON COLUMN file_groups.id         IS '파일 그룹 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN file_groups.ref_type   IS '업무 구분 (공통코드 FILE_REF_TYPE_CD: PRODUCT=상품, FARMER=농민프로필, VILLAGE=마을콘텐츠, BOARD=게시판)';
COMMENT ON COLUMN file_groups.created_at IS '생성 일시';
COMMENT ON COLUMN file_groups.created_by IS '생성자 ID';
CREATE INDEX idx_file_groups_ref_type ON file_groups(ref_type);

-- 개별 파일
CREATE TABLE files (
    id            BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_group_id BIGINT       NOT NULL REFERENCES file_groups(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    file_size     BIGINT       NOT NULL,
    storage_type  VARCHAR(20)  NOT NULL DEFAULT 'LOCAL' CHECK (storage_type IN ('LOCAL', 'S3')),
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    is_main_yn    CHAR(1)      NOT NULL DEFAULT 'N' CHECK (is_main_yn IN ('Y', 'N')),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by    BIGINT       REFERENCES users(id),
    updated_at    TIMESTAMP,
    updated_by    BIGINT       REFERENCES users(id),
    deleted_at    TIMESTAMP,
    deleted_by    BIGINT       REFERENCES users(id)
);
COMMENT ON TABLE  files               IS '개별 파일 메타데이터';
COMMENT ON COLUMN files.id            IS '파일 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN files.file_group_id IS 'file_groups.id 참조';
COMMENT ON COLUMN files.original_name IS '원본 파일명 (업로드 시 사용자 파일명)';
COMMENT ON COLUMN files.stored_name   IS '저장 파일명 (UUID 기반, 중복/보안 방지)';
COMMENT ON COLUMN files.file_path     IS '서버 상대 저장 경로 (예: uploads/product/abc.jpg)';
COMMENT ON COLUMN files.file_url      IS '클라이언트 접근 URL (예: /files/product/abc.jpg)';
COMMENT ON COLUMN files.mime_type     IS 'MIME 타입 (예: image/jpeg, image/png)';
COMMENT ON COLUMN files.file_size     IS '파일 크기 (bytes)';
COMMENT ON COLUMN files.storage_type  IS '저장소 유형: LOCAL=로컬 디스크, S3=AWS S3';
COMMENT ON COLUMN files.sort_order    IS '그룹 내 표시 순서 (오름차순)';
COMMENT ON COLUMN files.is_main_yn    IS '대표 이미지 여부 (Y=대표, 그룹 내 1개만 Y)';
COMMENT ON COLUMN files.created_at    IS '업로드 일시';
COMMENT ON COLUMN files.created_by    IS '업로드 사용자 ID';
COMMENT ON COLUMN files.updated_at    IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN files.updated_by    IS '마지막 수정자 ID';
COMMENT ON COLUMN files.deleted_at    IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN files.deleted_by    IS '삭제 처리자 ID';
CREATE INDEX idx_files_file_group_id ON files(file_group_id);
CREATE INDEX idx_files_deleted_at    ON files(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uidx_files_main  ON files(file_group_id) WHERE is_main_yn = 'Y' AND deleted_at IS NULL;

-- 파일 그룹 FK
ALTER TABLE products        ADD CONSTRAINT fk_products_file_group        FOREIGN KEY (file_group_id) REFERENCES file_groups(id) ON DELETE SET NULL;
ALTER TABLE farmer_profiles ADD CONSTRAINT fk_farmer_profiles_file_group FOREIGN KEY (file_group_id) REFERENCES file_groups(id) ON DELETE SET NULL;
ALTER TABLE village_content ADD CONSTRAINT fk_village_content_file_group FOREIGN KEY (file_group_id) REFERENCES file_groups(id) ON DELETE SET NULL;

-- 공통 코드 그룹
CREATE TABLE common_code_groups (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    use_yn      CHAR(1)     NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y', 'N')),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by  BIGINT      REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT      REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT      REFERENCES users(id)
);
COMMENT ON TABLE  common_code_groups             IS '공통 코드 그룹 (코드 분류 단위)';
COMMENT ON COLUMN common_code_groups.id          IS '코드 그룹 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN common_code_groups.code        IS '그룹 식별 코드 (예: PRODUCT_CATEGORY, DELIVERY_TYPE)';
COMMENT ON COLUMN common_code_groups.name        IS '그룹 표시 이름 (예: 상품 카테고리, 배송 유형)';
COMMENT ON COLUMN common_code_groups.description IS '그룹 설명';
COMMENT ON COLUMN common_code_groups.use_yn      IS '사용 여부 (Y=사용, N=미사용)';
COMMENT ON COLUMN common_code_groups.created_at  IS '생성 일시';
COMMENT ON COLUMN common_code_groups.created_by  IS '생성자 ID';
COMMENT ON COLUMN common_code_groups.updated_at  IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN common_code_groups.updated_by  IS '마지막 수정자 ID';
COMMENT ON COLUMN common_code_groups.deleted_at  IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN common_code_groups.deleted_by  IS '삭제 처리자 ID';
CREATE INDEX idx_common_code_groups_deleted_at ON common_code_groups(deleted_at) WHERE deleted_at IS NULL;

-- 공통 코드
CREATE TABLE common_codes (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id    BIGINT       NOT NULL REFERENCES common_code_groups(id) ON DELETE CASCADE,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    extra_value VARCHAR(255),
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    use_yn      CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_yn IN ('Y', 'N')),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  BIGINT       REFERENCES users(id),
    updated_at  TIMESTAMP,
    updated_by  BIGINT       REFERENCES users(id),
    deleted_at  TIMESTAMP,
    deleted_by  BIGINT       REFERENCES users(id),
    UNIQUE (group_id, code)
);
COMMENT ON TABLE  common_codes             IS '공통 코드 (common_code_groups 하위 개별 코드 값)';
COMMENT ON COLUMN common_codes.id          IS '코드 고유 식별자 (자동 증가 정수)';
COMMENT ON COLUMN common_codes.group_id    IS 'common_code_groups.id 참조';
COMMENT ON COLUMN common_codes.code        IS '코드 값 (같은 그룹 내 유일, 예: VEGETABLE, FRUIT)';
COMMENT ON COLUMN common_codes.name        IS '코드 표시 이름 (예: 채소, 과일)';
COMMENT ON COLUMN common_codes.extra_value IS '부가 데이터 (예: 색상 코드, 단위 등 자유 형식)';
COMMENT ON COLUMN common_codes.sort_order  IS '같은 그룹 내 표시 순서 (오름차순)';
COMMENT ON COLUMN common_codes.use_yn      IS '사용 여부 (Y=사용, N=미사용)';
COMMENT ON COLUMN common_codes.created_at  IS '생성 일시';
COMMENT ON COLUMN common_codes.created_by  IS '생성자 ID';
COMMENT ON COLUMN common_codes.updated_at  IS '마지막 수정 일시 (수정된 적 없으면 NULL)';
COMMENT ON COLUMN common_codes.updated_by  IS '마지막 수정자 ID';
COMMENT ON COLUMN common_codes.deleted_at  IS 'NULL이면 유효, 값이 있으면 소프트 삭제';
COMMENT ON COLUMN common_codes.deleted_by  IS '삭제 처리자 ID';
CREATE INDEX idx_common_codes_group_id   ON common_codes(group_id);
CREATE INDEX idx_common_codes_deleted_at ON common_codes(deleted_at) WHERE deleted_at IS NULL;
