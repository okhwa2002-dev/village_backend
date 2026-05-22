# 주문 프로세스

## 주문 생성 흐름

```
POST /api/orders
  └─ createOrderHandler (controller)
       └─ createOrder (service)
            └─ withTransaction (DB 트랜잭션)
                 ├─ 1. 상품 유효성 검사 (items 순회)
                 │       ├─ product 존재 여부 확인  → PRODUCT_NOT_FOUND
                 │       ├─ product.status === 'active' 확인 → PRODUCT_NOT_AVAILABLE
                 │       └─ product.stock >= quantity 확인   → INSUFFICIENT_STOCK
                 ├─ 2. 총액 계산 (price_at_order = 현재 가격)
                 ├─ 3. orders 레코드 생성
                 ├─ 4. order_items 레코드 생성 (items 순회)
                 └─ 5. products.stock 감소 (items 순회)
```

## 주문 상태 전이

```
pending → confirmed → shipping → delivered
    └──────────────────────────── cancelled
```

- `pending`: 주문 생성 직후
- `confirmed`: 관리자/농민 확인 완료
- `shipping`: 배송 중
- `delivered`: 배송 완료
- `cancelled`: 취소 (pending 상태에서만 사용자 취소 가능)

## 에러 코드

| 에러 메시지 | HTTP | 설명 |
|------------|------|------|
| EMPTY_ORDER | 400 | 주문 상품 없음 |
| PRODUCT_NOT_FOUND | 404 | 존재하지 않는 상품 |
| PRODUCT_NOT_AVAILABLE | 400 | 판매 중지 상품 포함 |
| INSUFFICIENT_STOCK | 400 | 재고 부족 |
| ORDER_NOT_FOUND | 404 | 주문 없음 |
| FORBIDDEN | 403 | 본인 주문 아님 |
| CANNOT_CANCEL | 400 | 취소 불가 상태 |

## 주문번호 생성
- 형식: `ORD-{YYYYMMDD}-{랜덤6자리}` (예: `ORD-20260521-A3F9K2`)
- `generateOrderNumber()` 유틸 함수 사용
