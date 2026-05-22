# 권한 (Role & Permission) 스펙

## 역할 정의

| 역할 | 설명 | 가입 방법 |
|------|------|----------|
| user | 일반 소비자 | 자유 가입, 즉시 활성화 |
| farmer | 농산물 판매 농민 | 가입 후 관리자 승인 필요 |
| admin | 시스템 관리자 | DB 직접 등록 |

## 권한 매트릭스

| 기능 | user | farmer (active) | admin |
|------|------|-----------------|-------|
| 상품 조회 | ✅ | ✅ | ✅ |
| 장바구니 | ✅ | ✅ | ✅ |
| 주문 생성 | ✅ | ✅ | ✅ |
| 내 주문 조회 | ✅ | ✅ | ✅ |
| 상품 등록/수정 | ❌ | ✅ (본인 상품) | ✅ |
| 농민 프로필 수정 | ❌ | ✅ (본인) | ✅ |
| 농민 승인/거절 | ❌ | ❌ | ✅ |
| 전체 주문 조회 | ❌ | ❌ | ✅ |
| 주문 상태 변경 | ❌ | ❌ | ✅ |
| 마을 정보 수정 | ❌ | ❌ | ✅ |

## 라우트 가드 사용법

```ts
// 로그인 필요
{ preHandler: [authenticate] }

// 특정 역할 필요
{ preHandler: [authenticate, requireRole('admin')] }
{ preHandler: [authenticate, requireRole('farmer')] }
```

## 본인 소유권 검사
역할 검사와 별개로 리소스 소유권 확인이 필요한 경우:
- 주문 조회/취소: `order.userId === req.user.id` (service 레이어)
- 상품 수정/삭제: `product.farmerId === farmer.id` (service 레이어)
- Controller가 아닌 **Service 레이어**에서 검사 후 `FORBIDDEN` throw