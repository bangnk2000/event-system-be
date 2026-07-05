# Tactical Design — Context `Notification`

> Bounded Context: **Notification** (Supporting/Generic) · Stack: **NestJS + TypeScript** · CQRS: **lightweight, 1 PostgreSQL**
> Nguyên tắc: **domain thuần** (không phụ thuộc framework), Hexagonal (ports & adapters).
> Tham chiếu: [`event-aggregate.md`](./event-aggregate.md) · [`participation-aggregate.md`](./participation-aggregate.md)
>
> **Trạng thái: đã code** — `src/modules/notification/` (aggregate `NotificationPreferenceEntity` + `EventNotificationsHandler` phản ứng domain event qua outbox, `NotifierPort` → `ChatWorkAdapter`).

---

## 1. Đặc thù context

Đây là context **hai vai trò**, không giống các aggregate nghiệp vụ khác:

1. **Reactive fan-out (không state riêng cho message)** — nghe domain event của context khác (relay từ outbox) rồi gửi thông báo ra kênh chat. Xử lý trong `EventNotificationsHandler` (`@OnEvent` theo **tên event string**, không import chéo module).
2. **Aggregate `NotificationPreference`** — lưu tùy chọn opt-out của mỗi user để quyết định có gửi thông báo cá nhân hay không.

---

## 2. Ubiquitous Language

| VN | JP | EN (code) | Ý nghĩa |
|----|----|-----------|---------|
| Tùy chọn thông báo | 通知設定 | `NotificationPreference` | Aggregate root — 1 dòng / 1 user (`id` = `userId`) |
| Loại thông báo | 通知種別 | `NotificationType` | Loại user có thể tắt (opt-out) |
| Tắt nhận | オプトアウト | `disabledTypes[]` | Danh sách loại đã tắt; **vắng mặt = bật** (nhận mặc định) |
| Bộ phát thông báo | 通知送信 | `NotifierPort` | Outbound port gửi text ra kênh (ChatWork…) |

---

## 3. Ranh giới Aggregate (`NotificationPreference`)

```
┌─ Aggregate: NotificationPreference ─────────────────────┐
│  NotificationPreferenceEntity (root)                     │
│   ├─ id (= userId)   : string   ◀ aggregate id CHÍNH LÀ userId │
│   └─ disabledTypes[] : NotificationType[]   (mô hình opt-out)  │
└──────────────────────────────────────────────────────────┘
```

**Quyết định ranh giới:**
- ✅ **`id` = `userId`**: 1 user ⇒ đúng 1 bản ghi tùy chọn. User chưa từng chỉnh setting ⇒ **không có row** ⇒ mặc định nhận tất cả (`createDefault` cho set rỗng).
- ✅ **Mô hình opt-out**: chỉ lưu các loại **đã tắt**; mặc định là bật → thêm loại thông báo mới không cần migrate dữ liệu cũ.
- ❌ **Không import module `iam`/user**: chỉ tham chiếu `userId` (string).
- ⚠️ **Không lưu lịch sử message đã gửi** (MVP): context chỉ giữ *tùy chọn*, không phải hộp thư.

---

## 4. Value Objects / Types

| Type | Giá trị | Ghi chú |
|------|---------|---------|
| `NotificationType` | enum: `REGISTRATION_CANCELLED` | **Mở rộng dần** khi thêm loại thông báo user được tắt |
| `NotificationPreferenceProps` | `{ disabledTypes: NotificationType[] }` | props aggregate (id nằm ở base) |

---

## 5. Hành vi aggregate

| Method | Ý nghĩa |
|--------|---------|
| `createDefault(userId, now)` | Tạo set tùy chọn mặc định (tất cả bật) cho user chưa có row |
| `isEnabled(type)` | `type` có đang bật? (`= !disabledTypes.includes(type)`) |
| `setEnabled(type, enabled, now)` | Bật/tắt 1 loại — **idempotent**: chỉ bump `updatedAt` khi cờ thực sự đổi |

**Invariants:**

| Mã | Quy tắc |
|----|---------|
| INV-N1 | `id` (= userId) không rỗng (`validate()`). |
| INV-N2 | Mô hình opt-out: **vắng trong `disabledTypes` = bật**; không có row ⇒ nhận tất cả. |
| INV-N3 | `setEnabled` idempotent (không đổi thì không bump `updatedAt`). |

---

## 6. Reactive handler — `EventNotificationsHandler`

Nghe domain event **relay từ outbox** (`OutboxRelay` phát trên `EventEmitter2` theo **tên event string**). Không import context `event`/`participation`.

| `@OnEvent` (tên event) | Hành động |
|------------------------|-----------|
| `EventPublishedDomainEvent` | Báo room BTC: "📢 Sự kiện mới đã công bố" |
| `EventCancelledDomainEvent` | Báo room BTC: "⚠️ Sự kiện đã bị hủy: <reason>" |
| `ParticipantRegisteredDomainEvent` | Báo room BTC: "✅ <user> đã đăng ký" |
| `RegistrationCancelledDomainEvent` | (1) **luôn** báo room BTC (theo dõi sĩ số) · (2) gửi **xác nhận cá nhân** cho registrant **chỉ khi** chưa opt-out `REGISTRATION_CANCELLED` |

> Logic opt-out: `pref = preferences.findOneById(userId); return pref ? pref.isEnabled(type) : true` (không có row ⇒ bật).

---

## 7. Ports & Adapter

```ts
// application/ports/notifier.port.ts (OUTBOUND)
export const NOTIFIER = Symbol('NOTIFIER');
export interface NotifierPort { notify(text: string): Promise<void>; }

// application/ports/notification-preference.repository.port.ts (OUTBOUND)
export interface NotificationPreferenceRepositoryPort {
  // findOneById(userId) / save(pref)
}
```

- **`ChatWorkAdapter`** hiện thực `NotifierPort` — gửi ra ChatWork room khi có `CHATWORK_API_TOKEN`/`CHATWORK_ROOM_ID`; **stub** (no-op/log) khi chưa cấu hình.
- ⚠️ **Kênh hiện tại là room chung**: thông báo "cá nhân" vẫn post vào cùng room. Khi có kênh **per-user** thật (DM/email) → mở rộng handler định tuyến riêng (xem việc tiếp theo trong session summary).

---

## 8. Slices (use cases) & Endpoints (prefix `/v1`)

| Slice | Endpoint | Authz | Ghi chú |
|-------|----------|-------|---------|
| `update-notification-preference` | `PUT /notification-preferences` | user hiện tại | Bật/tắt loại thông báo của **chính mình** (`CurrentUserId`); tạo row nếu chưa có |
| `get-notification-preferences` | `GET /notification-preferences` | user hiện tại | Trả tùy chọn hiện tại (mặc định tất cả bật nếu chưa có row) |

> Không có endpoint gửi thông báo thủ công — mọi thông báo là **hệ quả của domain event** qua outbox.

---

## 9. Cấu trúc thư mục module `notification` (vertical-slice thực tế)
```
modules/notification/
├─ domain/
│  ├─ notification-preference.entity.ts · notification-preference.types.ts
├─ application/
│  ├─ event-handlers/  event-notifications.handler.ts   (@OnEvent — reactive fan-out)
│  └─ ports/  notifier.port.ts · notification-preference.repository.port.ts
├─ adapters/  chatwork.adapter.ts   (NotifierPort → ChatWork, stub khi chưa cấu hình)
├─ commands/  update-notification-preference/  (.command · .service · .http.controller · .request.dto).ts
├─ queries/   get-notification-preferences/     (.query · .query-handler · .http.controller).ts
├─ database/  notification-preference.repository.ts · .mapper.ts · .persistence.model.ts
├─ dtos/  notification-preference.response.dto.ts
└─ notification.module.ts
```

---

## 10. Việc tiếp theo (mở rộng)
- [ ] **Web Push (VAPID/PWA)** cho thông báo đẩy — hiện chỉ có kênh ChatWork room chung.
- [ ] **Kênh per-user thật** (DM/email) → định tuyến riêng thay vì post room chung.
- [ ] Mở rộng `NotificationType` khi thêm thông báo opt-out (vd: mở khảo sát — FR-SRV-10, `@OnEvent('SurveyOpenedDomainEvent')`).
- [ ] ChatWork API thật (điền `CHATWORK_API_TOKEN`/`CHATWORK_ROOM_ID`).
