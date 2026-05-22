# 농민 승인 프로세스

## 농민 가입 흐름

```
POST /api/auth/register (role: 'farmer')
  └─ users.role = 'farmer'
  └─ users.status = 'pending'        ← 즉시 로그인 불가
       └─ 관리자 승인 대기
            ├─ 승인: PATCH /api/admin/farmers/:id/approve
            │        └─ users.status = 'active'
            └─ 거절: PATCH /api/admin/farmers/:id/reject
                     └─ users.status = 'suspended'
```

## 상태별 권한

| status | 로그인 | 상품 등록 | 마이페이지 |
|--------|--------|-----------|----------|
| pending | 불가 | 불가 | 불가 |
| active | 가능 | 가능 | 가능 |
| suspended | 불가 | 불가 | 불가 |

## 농민 프로필

- 가입 시 `farmers` 테이블 레코드는 자동 생성되지 않음
- 최초 로그인 후 `/my/profile`에서 농장 정보 직접 입력
- `PUT /api/farmers/me` — upsert 방식 (없으면 생성, 있으면 수정)

## 에러 코드

| 에러 메시지 | HTTP | 설명 |
|------------|------|------|
| FARMER_NOT_FOUND | 404 | 농민 프로필 없음 |
| ALREADY_ACTIVE | 400 | 이미 승인된 농민 |
| ALREADY_SUSPENDED | 400 | 이미 정지된 농민 |
