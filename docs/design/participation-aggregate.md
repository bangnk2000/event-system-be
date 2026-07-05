# Tactical Design — Aggregate `Registration` (Context `Participation`)

> Bounded Context: **Participation** (Core) · Stack: **NestJS + TypeScript** · CQRS: **lightweight, 1 PostgreSQL**
> Nguyên tắc: **domain thuần** (không phụ thuộc framework), Hexagonal (ports & adapters), transactional outbox.
> Tham chiếu: [`event-aggregate.md`](./event-aggregate.md) · [`SRS-quan-ly-su-kien.md`](../SRS-quan-ly-su-kien.md)
>
> **Trạng thái: đã code** — `src/modules/participation/` (aggregate `RegistrationEntity`, 3 domain event, 4 slice, 2 contract query cung cấp + 1 tiêu thụ).

---

## 1. Ubiquitous Language (Participation context)

| VN | JP | EN (code) | Ý nghĩa |
|----|----|-----------|---------|
| Đăng ký | 参加登録 | `Registration` | Aggregate root — 1 lượt đăng ký của 1 người/đội cho 1 sự kiện |
| Cá nhân / Đội | 個人 / チーム | `ParticipationMode` | `INDIVIDUAL` hoặc `TEAM` |
| Đội trưởng | 代表者 | `userId` (khi TEAM) | Người đại diện đăng ký cho đội |
| Thành viên đội | チームメンバー | `memberIds[]` | Danh sách userId của đội (rỗng nếu cá nhân) |
| Điểm danh | チェックイン | `checkIn` | Đánh dấu tham dự thực tế (`checkedInAt`) |
| Hủy đăng ký | 登録キャンセル | `cancel` | REGISTERED → CANCELLED |

---

## 2. Ranh giới Aggregate

```
┌─ Aggregate: Registration ───────────────────────────────┐
│  RegistrationEntity (root)                               │
│   ├─ eventId      : string   (tham chiếu context event)  │
│   ├─ mode         : ParticipationMode (INDIVIDUAL|TEAM)  │
│   ├─ userId       : string   (cá nhân, hoặc đội trưởng)  │
│   ├─ teamName     : string | null   (bắt buộc khi TEAM)  │
│   ├─ memberIds[]  : string[]        (rỗng khi cá nhân)   │
│   ├─ status       : RegistrationStatus (REGISTERED|CANCELLED) │
│   └─ checkedInAt  : Date | null                          │
└──────────────────────────────────────────────────────────┘
        │ tham chiếu bằng ID (KHÔNG import module `event`)
        ▼
   Event  → Aggregate riêng (context Event)
   User   → context IAM (chưa có; hiện chỉ giữ userId)
```

**Quyết định ranh giới:**
- ✅ Mỗi lượt đăng ký là **1 aggregate độc lập**: vòng đời riêng, số lượng lớn, ghi/đọc tách biệt khỏi `Event`.
- ❌ **Không import module `event`**: context tự sở hữu enum `ParticipationMode` (bản sao ý niệm của `RegistrationMode` bên event, không dùng chung type). Kiểm tra sự kiện có mở đăng ký hay không đi qua **QueryBus** (`IsEventOpenForRegistrationQuery`), không truy cập trực tiếp.
- ❌ **Không lưu danh tính đội** ngoài `memberIds` (chỉ tham chiếu userId).

---

## 3. Value Objects / Types

| Type | Giá trị | Ghi chú |
|------|---------|---------|
| `ParticipationMode` | enum: `INDIVIDUAL`, `TEAM` | Context **tự sở hữu** — không import từ `event` |
| `RegistrationStatus` | enum: `REGISTERED`, `CANCELLED` | Không có VO class riêng; là field của props |
| `RegistrationProps` | `{ eventId, mode, userId, teamName, memberIds[], status, checkedInAt }` | Props của aggregate |
| `RegisterProps` | `{ eventId, mode, userId, teamName?, memberIds? }` | Input factory `register` |

> Lưu ý: context này **không có VO class riêng** (khác `event`/`budget`); trạng thái & mode là enum đơn giản trong `registration.types.ts`.

---

## 4. Vòng đời (Registration status)

```
        register
           │
           ▼
      REGISTERED ──cancel──▶ CANCELLED   (terminal — chặn cancel/check-in tiếp)
           │
           └─checkIn──▶ (vẫn REGISTERED, set checkedInAt) — chỉ khi còn REGISTERED
```

- `cancel` / `checkIn` chỉ hợp lệ khi `status === REGISTERED` → nếu không: `RegistrationNotActiveError` (409).
- `checkIn` lần 2 (đã có `checkedInAt`) → `AlreadyCheckedInError` (409).
- Điểm danh **không** đổi `status` (vẫn `REGISTERED`), chỉ set mốc `checkedInAt`.

---

## 5. Invariants

| Mã | Quy tắc | Bảo vệ ở |
|----|---------|----------|
| INV-P1 | `eventId`, `userId` không rỗng. | `validate()` (`ArgumentInvalidException`) |
| INV-P2 | Đăng ký `TEAM` **bắt buộc** `teamName` (không rỗng). | `validate()` |
| INV-P3 | Chỉ `cancel`/`checkIn` khi đang `REGISTERED`. | aggregate → `Err(RegistrationNotActiveError)` |
| INV-P4 | Không điểm danh 2 lần. | aggregate → `Err(AlreadyCheckedInError)` |
| INV-P5 | **1 người / 1 sự kiện** (không đăng ký trùng khi còn active). | application handler + unique index (`AlreadyRegisteredError` 409) |
| INV-P6 | Chỉ đăng ký khi sự kiện đang **mở đăng ký**. | handler qua `IsEventOpenForRegistrationQuery` (404 nếu event không tồn tại · 409 nếu chưa mở) |
| INV-P7 | Chỉ **chính chủ** (registrant) mới được hủy/điểm danh lượt của mình. | handler (`NotRegistrantError` 403) |

> Business error = `return Err(...)` (oxide.ts `Result`), technical = `throw` → GlobalExceptionFilter.

---

## 6. Domain Events

| Event | Khi nào | Payload | Ai subscribe |
|-------|---------|---------|--------------|
| `ParticipantRegisteredDomainEvent` | đăng ký thành công | `{ aggregateId, eventId, userId, mode }` | **Notification** (`@OnEvent` → báo room BTC) |
| `RegistrationCancelledDomainEvent` | hủy đăng ký | `{ aggregateId, eventId, userId }` | **Notification** (báo BTC + registrant nếu chưa opt-out) |
| `ParticipantCheckedInDomainEvent` | điểm danh | `{ aggregateId, eventId, userId }` | (projection / thống kê) |

Side-effect ngoài đi qua **Transactional Outbox** → `OutboxRelay` phát trên `EventEmitter2` theo **tên event** → `@OnEvent` trong context `notification` (không import chéo module).

---

## 7. Cross-context contracts (`libs/contracts/*` trên QueryBus)

| Contract query | Vai trò | Trả về |
|----------------|---------|--------|
| `IsEventOpenForRegistrationQuery(eventId)` *(ở `event`)* | **Tiêu thụ**: kiểm tra sự kiện mở đăng ký khi `register` | phân biệt không tồn tại (404) vs chưa mở (409) |
| `IsEventParticipantQuery(eventId, userId)` *(ở `participation`)* | **Cung cấp** cho `survey`: kiểm tra diện trả lời khảo sát | `{ registered: boolean; checkedIn: boolean }` |
| `GetEventParticipationStatsQuery(eventId)` *(ở `participation`)* | **Cung cấp** cho `event` (báo cáo tổng kết) | `{ registered, cancelled, checkedIn, individual, team, checkInRate }` |

---

## 8. Ports

```ts
// application/ports/registration.repository.port.ts (OUTBOUND)
export interface RegistrationRepositoryPort {
  // nextId / findOneById / save (state + domain events → outbox trong 1 transaction)
  // + truy vấn hỗ trợ INV-P5 (đã đăng ký active cho eventId+userId chưa)
}
```

---

## 9. Slices (use cases) & Endpoints (prefix `/v1`)

### Write (commands)
| Slice | Endpoint | Authz | Lỗi chính |
|-------|----------|-------|-----------|
| `register-for-event` | `POST /events/:eventId/registrations` | user đã đăng nhập | 404 event không tồn tại · 409 chưa mở/đăng ký trùng · 400 team thiếu tên |
| `cancel-registration` | `POST /registrations/:id/cancel` | chính chủ | 404 không tìm thấy · 403 không phải chủ · 409 không còn active |
| `check-in` | `POST /registrations/:id/check-in` | chính chủ | 404 · 403 · 409 (không active / đã điểm danh) |

### Read (queries — đọc thẳng DataSource, bypass domain)
| Slice | Endpoint | Trả về |
|-------|----------|--------|
| `list-registrations` | `GET /events/:eventId/registrations` | danh sách đăng ký của sự kiện |
| `event-participation-stats` | *(contract, không expose REST)* | thống kê cho báo cáo tổng kết |
| `is-event-participant` | *(contract, không expose REST)* | diện trả lời khảo sát |

**Map lỗi → HTTP** (trong `commands/map-registration-error.ts`, khớp `libs/exceptions`):
`REGISTRATION.NOT_FOUND`/`EVENT_NOT_FOUND`→404 · `NOT_REGISTRANT`→403 · `ALREADY_REGISTERED`/`EVENT_NOT_OPEN`/`NOT_ACTIVE`/`ALREADY_CHECKED_IN`→409.

---

## 10. Cấu trúc thư mục module `participation` (vertical-slice thực tế)
```
modules/participation/
├─ domain/
│  ├─ registration.entity.ts · registration.types.ts · registration.errors.ts
│  └─ events/  participant-registered · registration-cancelled · participant-checked-in .domain-event.ts
├─ commands/
│  ├─ register-for-event/  (.command · .service · .http.controller · .request.dto).ts
│  ├─ cancel-registration/ · check-in/
│  └─ map-registration-error.ts
├─ queries/
│  ├─ list-registrations/       (.query · .query-handler · .http.controller · .response.dto).ts
│  ├─ event-participation-stats/  (query-handler cho contract)
│  └─ is-event-participant/        (query-handler cho contract)
├─ application/ports/  registration.repository.port.ts
├─ database/  registration.repository.ts · registration.mapper.ts · registration.persistence.model.ts
├─ dtos/  registration.response.dto.ts
└─ participation.module.ts
```
