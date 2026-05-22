# DB Query 규칙

## 기본 원칙
- 모든 SQL은 `mapper/*.xml`에 작성. 코드 내 인라인 SQL 금지.
- DB 접근은 반드시 `src/db/pool.ts`의 함수를 통해서만.

## pool.ts 함수 사용법

### query — 다수 행 조회
```ts
const rows = await query<Product>('product', 'findAll', { category: 'vegetables' });
// 반환: T[] (없으면 [])
```

### queryOne — 단일 행 조회
```ts
const product = await queryOne<Product>('product', 'findById', { id });
// 반환: T | null
```

### execute — INSERT / UPDATE / DELETE
```ts
await execute('product', 'create', { id, name, price, ... });
// 반환: void
```

### 트랜잭션 — withTransaction
```ts
await withTransaction(async (client) => {
  const order = await clientQueryOne<Order>(client, 'order', 'create', { ... });
  await clientExecute(client, 'order', 'createItem', { orderId: order.id, ... });
  await clientExecute(client, 'product', 'decreaseStock', { id, quantity });
});
```
- 트랜잭션 내부는 `clientQueryOne`, `clientExecute` 사용
- 실패 시 자동 롤백

## mybatis-mapper XML 작성 규칙

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="product">

  <!-- 동적 조건 예시 -->
  <select id="findAll">
    SELECT * FROM products
    WHERE 1=1
    <if test="category != null">AND category = #{category}</if>
    <if test="farmerId != null">AND farmer_id = #{farmerId}</if>
    ORDER BY created_at DESC
  </select>

  <!-- snake_case 컬럼 → camelCase 매핑은 pool.ts에서 자동 처리 -->
  <select id="findById">
    SELECT * FROM products WHERE id = #{id}
  </select>

</mapper>
```

## 컬럼 네이밍
- DB 컬럼: `snake_case` (`created_at`, `farmer_id`)
- TypeScript 타입: `camelCase` (`createdAt`, `farmerId`)
- `pool.ts`의 `toCamel` 변환으로 자동 처리됨
