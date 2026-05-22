# JWT 인증 스펙

## 토큰 구조

| 항목 | Access Token | Refresh Token |
|------|-------------|---------------|
| 유효기간 | 1시간 (1h) | 7일 (7d) |
| 저장 위치 | 클라이언트 localStorage | HttpOnly Cookie (권장) |
| 용도 | API 요청 인증 | Access Token 재발급 |

## Payload 구조

```ts
interface JwtPayload {
  id: string;     // user.id (UUID)
  email: string;
  role: 'user' | 'farmer' | 'admin';
}
```

## 인증 흐름

```
로그인 요청
  └─ POST /api/auth/login
       ├─ 이메일/비밀번호 검증
       ├─ users.status === 'active' 확인
       ├─ accessToken 발급 (1h)
       └─ refreshToken 발급 (7d)

API 요청
  └─ Authorization: Bearer <accessToken>
       └─ authenticate 미들웨어 검증
            ├─ 유효 → req.user = payload
            └─ 만료 → 401

토큰 갱신
  └─ POST /api/auth/refresh
       └─ refreshToken 검증 → 새 accessToken 발급
```

## 에러 코드

| 에러 | HTTP | 설명 |
|------|------|------|
| INVALID_CREDENTIALS | 401 | 이메일/비밀번호 불일치 |
| ACCOUNT_NOT_ACTIVE | 403 | 미승인 또는 정지 계정 |
| TOKEN_EXPIRED | 401 | 토큰 만료 |
| UNAUTHORIZED | 401 | 토큰 없음/invalid |
| FORBIDDEN | 403 | 역할 권한 없음 |

## 비밀번호 처리
- `bcryptjs` 사용, saltRounds = 10
- 평문 비밀번호는 절대 저장/로깅 금지