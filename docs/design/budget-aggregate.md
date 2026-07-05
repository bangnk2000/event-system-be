# Tactical Design — Aggregate `Budget` (Context `Budget`)

> Bounded Context: **Budget** (Supporting) · Stack: **NestJS + TypeScript** · CQRS: **lightweight, 1 PostgreSQL**
> Nguyên tắc: **domain thuần** (không phụ thuộc framework), Hexagonal (ports & adapters), transactional outbox.
> Tham chiếu: [`event-aggregate.md`](./event-aggregate.md) · [`SRS-quan-ly-su-kien.md`](../SRS-quan-ly-su-kien.md)
>
> **Trạng thái: đã code** — `src/modules/budget/` (aggregate `BudgetEntity` + entity nội bộ `BudgetItem` + VO `Money`, 4 domain event, 4 command + 1 query slice, ủy quyền qua contract `IsEventOrganizerQuery`).

---

## 1. Ubiquitous Language (Budget context)

| VN | JP | EN (code) | Ý nghĩa |
|----|----|-----------|---------|
| Ngân sách | 予算 | `Budget` | Aggregate root — **1 ngân sách / 1 sự kiện** |
| Khoản mục | 予算項目 | `BudgetItem` | Entity nội bộ trong `Budget` (1 dòng dự toán/thực chi) |
| Dự toán | 予算額 | `planned` | Số tiền dự kiến (Money) |
| Thực chi | 実績額 | `actual` | Số tiền chi thực tế (Money) |
| Hóa đơn | 請求書 | `invoiceUrl` | Link hóa đơn cho khoản đã chi |
| Chênh lệch | 差異 | `variance` | `planned − actual` (dương = dưới ngân sách) |
| Quyết toán | 決算 | `finalize` | DRAFT → FINALIZED (khóa, không sửa nữa) |

---

## 2. Ranh giới Aggregate

```
┌─ Aggregate: Budget ─────────────────────────────────────┐
│  BudgetEntity (root)                                     │
│   ├─ eventId   : string   (tham chiếu context event — 1:1) │
│   ├─ ownerId   : string   (BTC đã tạo ngân sách)         │
│   ├─ currency  : string   (mã tiền tệ chung cho mọi item) │
│   ├─ status    : BudgetStatus (DRAFT | FINALIZED)        │
│   └─ items[]   : BudgetItem  ◀ entity nội bộ             │
│        ├─ itemId, name, category                         │
│        ├─ planned : Money   (VO)                         │
│        ├─ actual  : Money   (VO, mặc định 0)             │
│        └─ invoiceUrl : string | null                     │
└──────────────────────────────────────────────────────────┘
        │ tham chiếu bằng ID (KHÔNG import module `event`)
        ▼
   Event → context Event (ủy quyền BTC qua IsEventOrganizerQuery)
```

**Quyết định ranh giới:**
- ✅ **Khoản mục nằm TRONG `Budget`**: invariant "chỉ sửa khi DRAFT", tổng dự toán/thực chi phải nhất quán tức thời → là entity nội bộ, không aggregate riêng.
- ✅ **`BudgetItem` bất biến (immutable)**: cập nhật thực chi trả về **instance mới** qua `withActual()` (thay vì mutate tại chỗ).
- ❌ **Không import module `event`**: ủy quyền "ai được quản ngân sách" bằng **contract query** `IsEventOrganizerQuery` (libs/contracts) trên QueryBus.
- ❌ **Không lưu tổng** trong aggregate: `totalPlanned()`/`totalActual()` **tính từ items** khi cần (tránh lệch số).

---

## 3. Value Objects & Entities

| VO/Entity | Thuộc tính | Invariant |
|-----------|-----------|-----------|
| `Money` (VO) | `{ amount: number; currency: string }` | `amount` hữu hạn & **≥ 0**; `currency` không rỗng; `add()` chặn cộng khác tiền tệ; helper `zero(currency)` |
| `BudgetStatus` | enum: `DRAFT`, `FINALIZED` | không có VO class; là field props |
| `BudgetItem` (entity) | `itemId, name, category, planned: Money, actual: Money, invoiceUrl: string \| null` | **immutable**; `withActual(actual, invoiceUrl)` → instance mới |
| `BudgetProps` | `{ eventId, ownerId, currency, status, items[] }` | props aggregate |

---

## 4. Vòng đời (`BudgetStatus`)

```
   create
     │
     ▼
   DRAFT ──addItem / recordActual (nhiều lần)──▶ DRAFT
     │
     └─finalize──▶ FINALIZED   (terminal — khóa: mọi addItem/recordActual/finalize → Err BudgetFinalizedError)
```

- Mọi thao tác sửa (`addItem`, `recordActual`) chỉ hợp lệ khi `DRAFT`.
- `finalize` lần 2 trên `FINALIZED` → `BudgetFinalizedError` (409).
- Không có trạng thái quay lại DRAFT sau khi quyết toán (MVP).

---

## 5. Invariants

| Mã | Quy tắc | Bảo vệ ở |
|----|---------|----------|
| INV-B1 | `eventId`, `ownerId`, `currency` không rỗng. | `validate()` |
| INV-B2 | **1 ngân sách / 1 sự kiện** (không tạo trùng). | handler + unique (`BudgetAlreadyExistsError` 409) |
| INV-B3 | Chỉ **BTC của sự kiện** mới tạo được ngân sách. | handler qua `IsEventOrganizerQuery` (`NotEventOrganizerError` 403 · event không tồn tại 404) |
| INV-B4 | Chỉ **owner của ngân sách** mới thao tác tiếp. | handler (`NotBudgetOwnerError` 403) |
| INV-B5 | Không sửa (add/record) hay finalize lại khi đã `FINALIZED`. | aggregate → `Err(BudgetFinalizedError)` |
| INV-B6 | `recordActual` phải trỏ tới khoản mục tồn tại. | aggregate → `Err(BudgetItemNotFoundError)` |
| INV-B7 | `Money.amount ≥ 0`; cộng tiền phải cùng `currency`. | VO `Money.validate()` / `add()` |

---

## 6. Domain Events

| Event | Khi nào | Payload | Ai subscribe |
|-------|---------|---------|--------------|
| `BudgetCreatedDomainEvent` | tạo ngân sách | `{ aggregateId, eventId }` | (projection) |
| `BudgetItemAddedDomainEvent` | thêm khoản mục | `{ aggregateId, itemId }` | (projection) |
| `ActualRecordedDomainEvent` | ghi thực chi | `{ aggregateId, itemId }` | (projection) |
| `BudgetFinalizedDomainEvent` | quyết toán | `{ aggregateId, eventId }` | (projection / báo cáo) |

Phát qua **Transactional Outbox** như các context khác.

---

## 7. Cross-context contracts (`libs/contracts/*` trên QueryBus)

| Contract query | Vai trò | Trả về |
|----------------|---------|--------|
| `IsEventOrganizerQuery(eventId, userId)` *(ở `event`)* | **Tiêu thụ**: ủy quyền tạo ngân sách (BTC) | `boolean` (kèm phân biệt event không tồn tại → 404) |
| `GetEventBudgetSummaryQuery(eventId)` *(ở `budget`)* | **Cung cấp** cho `event` (báo cáo tổng kết) | `{ exists, currency, status, totalPlanned, totalActual, variance }` — `exists:false` nếu chưa có ngân sách (không phải lỗi) |

---

## 8. Ports

```ts
// application/ports/budget.repository.port.ts (OUTBOUND)
export interface BudgetRepositoryPort {
  // nextId / findOneById / findByEventId (INV-B2) / save (state + events → outbox 1 transaction)
}
```

---

## 9. Slices (use cases) & Endpoints (prefix `/v1`)

### Write (commands)
| Slice | Endpoint | Authz | Lỗi chính |
|-------|----------|-------|-----------|
| `create-budget` | `POST /events/:eventId/budget` | BTC (`IsEventOrganizerQuery`) | 404 event không tồn tại · 403 không phải BTC · 409 đã có ngân sách |
| `add-budget-item` | `POST /budgets/:id/items` | owner | 404 ngân sách · 403 không phải owner · 409 đã quyết toán |
| `record-actual` | `PATCH /budgets/:id/items/:itemId/actual` | owner | 404 ngân sách/khoản mục · 403 · 409 đã quyết toán |
| `finalize-budget` | `POST /budgets/:id/finalize` | owner | 404 · 403 · 409 đã quyết toán |

### Read (queries — đọc thẳng DataSource)
| Slice | Endpoint | Trả về |
|-------|----------|--------|
| `get-budget-summary` | `GET /events/:eventId/budget` | dự toán vs thực tế theo khoản mục + tổng + **variance** |
| `event-budget-summary` | *(contract, không expose REST)* | tóm tắt cho báo cáo tổng kết |

**Map lỗi → HTTP** (`commands/map-budget-error.ts`):
`BUDGET.NOT_FOUND`/`EVENT_NOT_FOUND`/`ITEM_NOT_FOUND`→404 · `NOT_EVENT_ORGANIZER`/`NOT_OWNER`→403 · `ALREADY_EXISTS`/`FINALIZED`→409.

---

## 10. Cấu trúc thư mục module `budget` (vertical-slice thực tế)
```
modules/budget/
├─ domain/
│  ├─ budget.entity.ts · budget-item.ts · budget.types.ts · budget.errors.ts
│  ├─ value-objects/  money.value-object.ts
│  └─ events/  budget-created · budget-item-added · actual-recorded · budget-finalized .domain-event.ts
├─ commands/
│  ├─ create-budget/ · add-budget-item/ · record-actual/ · finalize-budget/
│  └─ map-budget-error.ts
├─ queries/
│  ├─ get-budget-summary/       (.query · .query-handler · .http.controller · .response.dto).ts
│  └─ event-budget-summary/      (query-handler cho contract)
├─ application/ports/  budget.repository.port.ts
├─ database/  budget.repository.ts · budget.mapper.ts · budget.persistence.model.ts
├─ dtos/  budget.response.dto.ts
└─ budget.module.ts
```
