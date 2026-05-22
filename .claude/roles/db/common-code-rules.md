# 공통 코드 생성 규칙

## 코드 그룹 네이밍 규칙

```
{도메인}_{분류유형}_CD
```

### 분류유형별 접미사

| 분류유형 | 접미사 | 예시 |
|----------|--------|------|
| 상태값 | `STATUS_CD` | `ORDER_STATUS_CD`, `USER_STATUS_CD` |
| 종류/유형 | `TYPE_CD` | `DELIVERY_TYPE_CD`, `PAYMENT_TYPE_CD` |
| 카테고리/분류 | `CATEGORY_CD` | `PRODUCT_CATEGORY_CD` |
| 사유 | `REASON_CD` | `ORDER_CANCEL_REASON_CD` |
| 섹션/구분 | `SECTION_CD` | `VILLAGE_SECTION_CD` |
| 단위 | `UNIT_CD` | `WEIGHT_UNIT_CD` |
| 여부 (Y/N) | `_YN` | `USE_YN`, `PUBLISH_YN` |

### 규칙

- 대문자 + 언더스코어만 사용
- 도메인명은 해당 테이블/기능명 기준 (예: `ORDER`, `PRODUCT`, `USER`)
- 기본적으로 `_CD`로 끝남
- **예외: 여부(Y/N) 값인 경우 `_YN`으로 끝내고 `_CD`를 붙이지 않음**
- ENUM으로 관리하던 값이 동적 관리 필요 시 공통코드로 이관

## 현재 등록된 그룹

| 그룹 코드 | 이름 | 설명 |
|-----------|------|------|
| `PRODUCT_CATEGORY_CD` | 상품 카테고리 | 농산물 상품 분류 |
| `DELIVERY_TYPE_CD` | 배송 유형 | 주문 배송 방식 |
| `ORDER_CANCEL_REASON_CD` | 주문 취소 사유 | 주문 취소 시 선택 사유 |
| `VILLAGE_SECTION_CD` | 마을 콘텐츠 섹션 | 마을 소개 페이지 섹션 구분 |

## 코드 값 네이밍 규칙

- 대문자 + 언더스코어
- 의미가 명확한 영문 약어 사용
- 예: `VEGETABLE`, `OUT_OF_STOCK`, `CHANGE_MIND`

## 조회 패턴

```sql
-- 그룹 코드로 하위 코드 목록 조회
SELECT c.code, c.name, c.extra_value
FROM common_codes c
JOIN common_code_groups g ON g.id = c.group_id
WHERE g.code = 'PRODUCT_CATEGORY_CD'
  AND g.use_yn = 'Y'
  AND c.use_yn = 'Y'
  AND c.deleted_at IS NULL
ORDER BY c.sort_order;
```