# 에러 처리 규칙

## 레이어별 역할

```
Service  → 의미 있는 에러 문자열을 throw  (예: throw new Error('ORDER_NOT_FOUND'))
Controller → 에러 문자열을 HTTP 상태코드로 변환
```

Service에서 HTTP 상태코드 직접 사용 금지.
Controller에서 비즈니스 로직 처리 금지.

## Controller 에러 처리 패턴

```ts
export const handler = async (req, reply) => {
  try {
    const result = await someService(...);
    return reply.send(successResponse(result));
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'NOT_FOUND') return reply.code(404).send(errorResponse('...'));
      if (err.message === 'FORBIDDEN')  return reply.code(403).send(errorResponse('...'));
      if (err.message === 'INVALID')    return reply.code(400).send(errorResponse('...'));
    }
    throw err;  // 미처리 에러는 Fastify 전역 핸들러로 위임
  }
};
```

## 공통 에러 코드 목록

### 인증/권한
| 에러 코드 | HTTP | 설명 |
|-----------|------|------|
| INVALID_CREDENTIALS | 401 | 이메일/비밀번호 불일치 |
| ACCOUNT_NOT_ACTIVE | 403 | 미승인/정지 계정 |
| UNAUTHORIZED | 401 | 토큰 없음 또는 유효하지 않음 |
| FORBIDDEN | 403 | 권한 없음 또는 본인 리소스 아님 |

### 공통 리소스
| 에러 코드 | HTTP | 설명 |
|-----------|------|------|
| NOT_FOUND | 404 | 리소스 없음 (도메인 prefix 붙여 사용) |

### 농민
| 에러 코드 | HTTP | 설명 |
|-----------|------|------|
| FARMER_NOT_FOUND | 404 | 농민 프로필 없음 |
| ALREADY_ACTIVE | 400 | 이미 승인된 농민 |
| ALREADY_SUSPENDED | 400 | 이미 정지된 농민 |

### 상품
| 에러 코드 | HTTP | 설명 |
|-----------|------|------|
| PRODUCT_NOT_FOUND | 404 | 상품 없음 |
| PRODUCT_NOT_AVAILABLE | 400 | 판매 중지 상품 |
| INSUFFICIENT_STOCK | 400 | 재고 부족 |

### 주문
| 에러 코드 | HTTP | 설명 |
|-----------|------|------|
| EMPTY_ORDER | 400 | 주문 상품 없음 |
| ORDER_NOT_FOUND | 404 | 주문 없음 |
| CANNOT_CANCEL | 400 | 취소 불가 상태 |

## 전역 에러 핸들러

`src/app.ts`에 Fastify 전역 에러 핸들러 등록:
```ts
app.setErrorHandler((error, req, reply) => {
  reply.code(500).send(errorResponse('서버 오류가 발생했습니다'));
});
```

미처리 에러(`throw err`)는 전역 핸들러가 500으로 응답.
에러 상세는 서버 로그에만 기록, 클라이언트에 노출 금지.