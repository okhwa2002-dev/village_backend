# DB Schema 스펙

## 테이블 목록

### users
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
email       VARCHAR UNIQUE NOT NULL
password    VARCHAR NOT NULL
name        VARCHAR NOT NULL
role        VARCHAR NOT NULL  -- 'user' | 'farmer' | 'admin'
status      VARCHAR NOT NULL  -- 'active' | 'pending' | 'suspended'
created_at  TIMESTAMP DEFAULT NOW()
```

### farmers
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id) UNIQUE NOT NULL
farm_name   VARCHAR
description TEXT
address     VARCHAR
phone       VARCHAR
main_crops  VARCHAR[]
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

### products
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
farmer_id   UUID REFERENCES farmers(id) NOT NULL
name        VARCHAR NOT NULL
description TEXT
category    VARCHAR NOT NULL  -- '채소' | '과일' | '곡물' | '기타'
price       INTEGER NOT NULL
stock       INTEGER NOT NULL DEFAULT 0
status      VARCHAR NOT NULL  -- 'active' | 'inactive'
images      JSONB DEFAULT '[]'
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

### carts
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id) UNIQUE NOT NULL
created_at  TIMESTAMP DEFAULT NOW()
```

### cart_items
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
cart_id     UUID REFERENCES carts(id) NOT NULL
product_id  UUID REFERENCES products(id) NOT NULL
quantity    INTEGER NOT NULL DEFAULT 1
UNIQUE (cart_id, product_id)
```

### orders
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(id) NOT NULL
order_number  VARCHAR UNIQUE NOT NULL
total_price   INTEGER NOT NULL
status        VARCHAR NOT NULL  -- 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
address       TEXT
phone         VARCHAR
created_at    TIMESTAMP DEFAULT NOW()
updated_at    TIMESTAMP DEFAULT NOW()
```

### order_items
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
order_id        UUID REFERENCES orders(id) NOT NULL
product_id      UUID REFERENCES products(id) NOT NULL
quantity        INTEGER NOT NULL
price_at_order  INTEGER NOT NULL
```

### village_info
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        VARCHAR
description TEXT
address     VARCHAR
phone       VARCHAR
updated_at  TIMESTAMP DEFAULT NOW()
```

## 관계 다이어그램

```
users ──────────── farmers ──────────── products
  │                                        │
  ├── carts ──── cart_items ───────────────┤
  │                                        │
  └── orders ── order_items ───────────────┘
```

## 주요 제약사항
- `cart_items.UNIQUE(cart_id, product_id)` — 장바구니 중복 상품은 수량 업데이트
- `order_items.price_at_order` — 주문 시점 가격 별도 저장 (가격 변동 대비)
- `products.images` — JSONB 배열, 코드에서 `JSON.stringify` 후 저장
- 모든 PK는 UUID (`gen_random_uuid()`)
