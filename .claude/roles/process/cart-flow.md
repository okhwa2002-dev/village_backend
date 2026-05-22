# 장바구니 프로세스

## 장바구니 구조
- 사용자당 장바구니 1개 (`carts` 테이블)
- 상품별 수량 관리 (`cart_items` 테이블)
- 현재 구현: 로그인 사용자 전용 (비회원 장바구니 미지원)

## 상품 추가 흐름

```
POST /api/cart/items
  └─ getOrCreateCart (user_id로 carts 조회, 없으면 생성)
       └─ upsertCartItem
            └─ INSERT ... ON CONFLICT (cart_id, product_id)
               DO UPDATE SET quantity = cart_items.quantity + #{quantity}
```

- 동일 상품 추가 시 수량 누적 (덮어쓰기 아님)

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/cart | 내 장바구니 조회 |
| POST | /api/cart/items | 상품 추가 |
| PUT | /api/cart/items/:itemId | 수량 변경 |
| DELETE | /api/cart/items/:itemId | 상품 제거 |
| DELETE | /api/cart | 장바구니 전체 비우기 |

## 주문 후 처리
- 주문 완료 시 장바구니 자동 비우기 (서비스 레이어에서 처리)
