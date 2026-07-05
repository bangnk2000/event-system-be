# Tactical Design — Aggregate `Event`

> Bounded Context: **Event** (Core) · Stack: **NestJS + TypeScript** · CQRS: **lightweight, 1 PostgreSQL**
> Nguyên tắc: **domain thuần** (không phụ thuộc framework), Hexagonal (ports & adapters).
>
> **Trạng thái: đã code** — `src/modules/event/` (aggregate `EventEntity`, 7 domain event, 2 contract query cung cấp).

---

> ⚠️ **Đối chiếu với code đã hiện thực (cập nhật 2026-07-02).** Tài liệu này là thiết kế ban đầu; các bảng/mã dưới đây **đã được chỉnh cho khớp code**. Những khác biệt so với bản thiết kế gốc:
> - **VO thực tế** (5): `MultilingualText`, `DateTimeRange`, `EventStatus`, `RegistrationPolicy`, `OrganizingCommitteeMember`. `location` là **interface `EventLocation`** (không phải VO), `capacity` là **`number | null`** (không phải VO `Capacity`), `EventType` là **enum** trong `event.types.ts` (không phải VO).
> - **`OrganizingCommitteeMember` là VALUE OBJECT** (`{ userId, role }`), không phải entity.
> - **Chưa hiện thực** ở MVP: `inviteOrganizer`/`removeOrganizer` + các event `OrganizerInvited/Removed`, `EventStarted/Completed`, `EventDetailsUpdated`. `publish` **không** kiểm `title.vi`. `openRegistration` chỉ từ `PUBLISHED`.
> - **Bổ sung thực tế**: event `RegistrationReopened` (sinh khi `reschedule` lúc đang mở đăng ký) + trạng thái `ONGOING`/`COMPLETED` trong state machine.
> - Business error **`return Err(...)`** (oxide.ts `Result`), không `throw DomainError` như ví dụ 8.x (ví dụ giữ nguyên để minh họa ý niệm).

---

## 1. Ubiquitous Language (Event context)

| VN | JP | EN (code) | Ý nghĩa |
|----|----|-----------|---------|
| Sự kiện | イベント | `Event` | Aggregate root |
| Ban tổ chức | 運営委員 | `OrganizingCommitteeMember` | Thành viên đồng tổ chức (entity trong aggregate) |
| Người chủ trì | 主催者 | `OWNER` | Người tạo sự kiện, quyền cao nhất |
| Công bố | 公開 | `publish` | Chuyển Nháp → Công bố |
| Mở đăng ký | 受付開始 | `openRegistration` | Bắt đầu nhận đăng ký |
| Dời lịch | 日程変更 | `reschedule` | Đổi thời gian + thông báo |
| Hủy | 中止 | `cancel` | Hủy sự kiện (terminal) |

---

## 2. Ranh giới Aggregate

```
┌─ Aggregate: Event ──────────────────────────────────────┐
│  Event (root)                                            │
│   ├─ title, description : MultilingualText (VI/JP)       │
│   ├─ type              : EventType                       │
│   ├─ status            : EventStatus  (state machine)    │
│   ├─ schedule          : DateTimeRange                   │
│   ├─ location          : Location                        │
│   ├─ capacity          : Capacity                        │
│   ├─ registrationPolicy: RegistrationPolicy              │
│   └─ committee[]       : OrganizingCommitteeMember  ◀ entity (ref userId)
└─────────────────────────────────────────────────────────┘
        │ tham chiếu bằng ID (KHÔNG nằm trong aggregate)
        ▼
   Registration / Team / Attendance   → Aggregate riêng (context Participation)
   User                               → Aggregate riêng (context IAM)
```

**Quyết định ranh giới:**
- ✅ **Ban tổ chức nằm TRONG** aggregate: vì invariant "ai được sửa sự kiện" và "luôn có ≥1 người chủ trì" phải nhất quán tức thời với Event.
- ❌ **Registration nằm NGOÀI**: số lượng lớn, vòng đời độc lập, ghi/đọc tách biệt → aggregate riêng, chỉ giữ `eventId`.
- ❌ **Số người đã đăng ký KHÔNG lưu trong Event**: tránh contention. Event chỉ giữ *chính sách* (capacity, deadline); việc kiểm tra sức chứa do context Participation thực hiện khi đăng ký.

---

## 3. Value Objects

| VO / Type | Thuộc tính | Invariant |
|-----------|-----------|-----------|
| `MultilingualText` (VO) | `{ vi: string; ja?: string }` | `vi` bắt buộc (ngôn ngữ mặc định) |
| `DateTimeRange` (VO) | `startAt`, `endAt` | `endAt > startAt` |
| `EventStatus` (VO) | enum + bảng chuyển trạng thái | chỉ chuyển theo state machine |
| `RegistrationPolicy` (VO) | `{ mode: RegistrationMode; deadline: Date \| null }` | `deadline` (nếu có) `≤ schedule.startAt` khi reschedule |
| `OrganizingCommitteeMember` (VO) | `{ userId: string; role: OrganizerRole }` | `userId` không rỗng; helper `owner()`/`member()` |
| `EventType` (enum) | `INTERNAL_MEETING`, `TRAINING`, `TEAM_BUILDING`, `TRAVEL` | (Phase 2: `SPORTS`) |
| `RegistrationMode` (enum) | `INDIVIDUAL`, `TEAM`, `BOTH` | — |
| `OrganizerRole` (enum) | `OWNER`, `MEMBER` | người tạo mặc định là `OWNER` |
| `EventLocation` (interface, **không phải VO**) | `{ kind: 'ONLINE'\|'OFFLINE'; address?; url? }` · `null` được | (MVP không guard address/url) |
| `capacity` (**`number \| null`**, không phải VO) | số chỗ | `null` = không giới hạn; nếu có thì `> 0` (guard trong `validate()`) |

---

## 4. State Machine (`EventStatus`)

Bảng chuyển trạng thái thực tế (`TRANSITIONS` trong `event-status.value-object.ts`):

```
DRAFT ──▶ PUBLISHED, CANCELLED
PUBLISHED ──▶ REGISTRATION_OPEN, ONGOING, CANCELLED
REGISTRATION_OPEN ⇄ REGISTRATION_CLOSED ──▶ ONGOING, CANCELLED   (cả hai chiều mở/đóng)
ONGOING ──▶ COMPLETED, CANCELLED
COMPLETED, CANCELLED ──▶ (terminal, không chuyển tiếp)
```

- `reschedule`: cho phép ở **mọi trạng thái chưa terminal** → **giữ nguyên status**, đổi `schedule`, raise `EventRescheduled`. Nếu đang `REGISTRATION_OPEN` thì **tự** raise thêm `RegistrationClosed` + `RegistrationReopened` (không đổi status) để downstream thông báo lại.
- Terminal: `COMPLETED`, `CANCELLED`. Không mutate trên trạng thái terminal (trả `Err(InvalidEventStateError)`).
- *(MVP hiện có handler cho: `publish`, `openRegistration`, `closeRegistration`, `reschedule`, `cancel`. Chuyển sang `ONGOING`/`COMPLETED` đã có trong bảng nhưng chưa có slice command riêng.)*

---

## 5. Invariants

| Mã | Quy tắc | Trạng thái code |
|----|---------|-----------------|
| INV-1 | Luôn có **≥1** thành viên ban tổ chức (`validate()` chặn committee rỗng). Người tạo là `OWNER`. | ✅ (guard ≥1; **chưa** có invite/remove nên chưa cần chặn xóa OWNER) |
| INV-2 | `endAt > startAt`. | ✅ `DateTimeRange.create` |
| INV-3 | `registrationPolicy.deadline` (nếu có) `≤ schedule.startAt` — kiểm khi `reschedule`. | ✅ `reschedule` → `Err(InvalidEventScheduleError)` |
| INV-4 | `capacity`, nếu có, phải `> 0`. | ✅ `validate()` |
| INV-5 | Chuyển trạng thái phải hợp lệ theo `TRANSITIONS`. | ✅ `EventStatus.canTransitionTo` |
| INV-6 | `publish` chỉ từ `DRAFT`; `openRegistration` chỉ từ `PUBLISHED`. | ✅ |
| ~~INV-7~~ | ~~`title.vi` bắt buộc trước khi `publish`~~ | ❌ **chưa hiện thực** ở MVP (chỉ guard `title` không rỗng ở `validate`) |
| ~~INV-8~~ | ~~Quản lý ban tổ chức (invite/remove) chỉ `OWNER`~~ | ❌ **chưa có** slice invite/remove ở MVP |

> Business-rule violation = **`return Err(InvalidEventStateError \| InvalidEventScheduleError)`** (oxide.ts `Result`); lỗi kỹ thuật/guard cấu trúc = `throw ArgumentInvalidException` trong `validate()`. Cả hai được map sang HTTP ở controller / GlobalExceptionFilter.

---

## 6. Domain Events

**7 domain event thực tế trong code** (`domain/events/`):

| Event | Khi nào | Payload | Ai subscribe |
|-------|---------|---------|--------------|
| `EventDraftedDomainEvent` | tạo nháp | `{ aggregateId, creatorId, title }` | (projection) |
| `EventPublishedDomainEvent` | publish | `{ aggregateId }` | **Notification** (báo room BTC) |
| `RegistrationOpenedDomainEvent` | mở đăng ký | `{ aggregateId }` | Notification |
| `RegistrationClosedDomainEvent` | đóng đăng ký (hoặc bước 1 của reschedule) | `{ aggregateId }` | Notification |
| `RegistrationReopenedDomainEvent` | reschedule khi đang mở đăng ký | `{ aggregateId }` | Notification |
| `EventRescheduledDomainEvent` | dời lịch | `{ aggregateId, startAt, endAt }` | Notification (+ Calendar tương lai) |
| `EventCancelledDomainEvent` | hủy | `{ aggregateId, reason }` | **Notification** (báo room BTC) |

> *Chưa hiện thực* (thiết kế gốc): `EventStarted/Completed`, `OrganizerInvited/Removed`, `EventDetailsUpdated`.

Side-effect ngoài (ChatWork/Calendar/Drive) đi qua **Transactional Outbox** (`OutboxRelay` phát trên `EventEmitter2` theo tên event) để không mất event.

---

## 7. Ports

```ts
// modules/event/domain/ports/out/event.repository.ts  (OUTBOUND PORT)
export interface EventRepository {
  nextId(): EventId;
  findById(id: EventId): Promise<Event | null>;
  save(event: Event): Promise<void>;   // lưu state + xả domain events vào outbox trong 1 transaction
}
export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');
```

---

## 8. Mã nguồn mẫu (NestJS, domain thuần)

### 8.1 Base (shared-kernel) — không phụ thuộc NestJS
```ts
export abstract class AggregateRoot<TId> {
  private _events: DomainEvent[] = [];
  protected constructor(public readonly id: TId) {}
  protected addEvent(e: DomainEvent) { this._events.push(e); }
  pullDomainEvents(): DomainEvent[] { const e = this._events; this._events = []; return e; }
}

export interface DomainEvent { readonly aggregateId: string; readonly occurredAt: Date; name(): string; }

export class DomainError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}
```

### 8.2 Value Object ví dụ
```ts
export class DateTimeRange {
  private constructor(public readonly startAt: Date, public readonly endAt: Date) {}
  static create(startAt: Date, endAt: Date): DateTimeRange {
    if (endAt.getTime() <= startAt.getTime())
      throw new DomainError('EVENT.SCHEDULE_INVALID', 'endAt phải sau startAt');
    return new DateTimeRange(startAt, endAt);
  }
}
```

### 8.3 Aggregate Root `Event` (trích — **minh họa ý niệm**, không khớp 1:1 code)

> ⚠️ Ví dụ dưới đây dùng `throw DomainError` và có `inviteOrganizer`/`removeOrganizer` **không tồn tại trong MVP**. Code thực tế: `EventEntity` trả `Result` (`Ok`/`Err`) cho vi phạm nghiệp vụ, và chỉ có `draft`/`publish`/`openRegistration`/`closeRegistration`/`reschedule`/`cancel`. Xem `src/modules/event/domain/event.entity.ts` là nguồn chuẩn.
```ts
export class Event extends AggregateRoot<EventId> {
  private constructor(
    id: EventId,
    private title: MultilingualText,
    private description: MultilingualText | null,
    private type: EventType,
    private status: EventStatus,
    private schedule: DateTimeRange,
    private location: Location,
    private capacity: Capacity,
    private registrationPolicy: RegistrationPolicy,
    private committee: OrganizingCommitteeMember[],
  ) { super(id); }

  /** Factory: tạo sự kiện nháp; người tạo trở thành OWNER */
  static draft(props: DraftEventProps, creatorId: UserId, id: EventId): Event {
    const owner = OrganizingCommitteeMember.owner(creatorId);
    const event = new Event(
      id, props.title, props.description ?? null, props.type,
      EventStatus.draft(), props.schedule, props.location,
      props.capacity, props.registrationPolicy, [owner],
    );
    event.addEvent(new EventDrafted(id.value, creatorId.value));
    return event;
  }

  publish(): void {
    this.status.ensureCanPublish();                                  // INV-5, INV-6
    if (!this.title.hasVi()) throw new DomainError('EVENT.TITLE_REQUIRED', 'Thiếu tiêu đề tiếng Việt'); // INV-7
    this.status = this.status.toPublished();
    this.addEvent(new EventPublished(this.id.value));
  }

  reschedule(newRange: DateTimeRange, byUserId: UserId): void {
    this.ensureMutable();
    this.registrationPolicy.ensureDeadlineWithin(newRange.startAt);  // INV-3
    this.schedule = newRange;
    this.addEvent(new EventRescheduled(this.id.value, newRange));
  }

  inviteOrganizer(userId: UserId, byUserId: UserId): void {
    this.ensureOwner(byUserId);                                      // INV-8
    if (this.committee.some(m => m.userId.equals(userId))) return;   // idempotent
    this.committee.push(OrganizingCommitteeMember.member(userId));
    this.addEvent(new OrganizerInvited(this.id.value, userId.value));
  }

  removeOrganizer(userId: UserId, byUserId: UserId): void {
    this.ensureOwner(byUserId);
    const target = this.committee.find(m => m.userId.equals(userId));
    if (!target) return;
    if (target.isOwner()) throw new DomainError('EVENT.CANNOT_REMOVE_OWNER', 'Không thể xóa người chủ trì'); // INV-1
    this.committee = this.committee.filter(m => !m.userId.equals(userId));
    this.addEvent(new OrganizerRemoved(this.id.value, userId.value));
  }

  cancel(reason: string, byUserId: UserId): void {
    this.ensureOrganizer(byUserId);
    this.status.ensureCanCancel();
    this.status = this.status.toCancelled();
    this.addEvent(new EventCancelled(this.id.value, reason));
  }

  private ensureMutable() { this.status.ensureNotTerminal(); }
  private ensureOwner(u: UserId) {
    const m = this.committee.find(x => x.userId.equals(u));
    if (!m?.isOwner()) throw new DomainError('EVENT.FORBIDDEN', 'Chỉ người chủ trì được phép');
  }
  private ensureOrganizer(u: UserId) {
    if (!this.committee.some(x => x.userId.equals(u)))
      throw new DomainError('EVENT.FORBIDDEN', 'Chỉ ban tổ chức được phép');
  }
}
```

### 8.4 Command handler (lightweight CQRS — @nestjs/cqrs)
```ts
@CommandHandler(CreateEventCommand)
export class CreateEventHandler implements ICommandHandler<CreateEventCommand> {
  constructor(@Inject(EVENT_REPOSITORY) private readonly repo: EventRepository) {}

  async execute(cmd: CreateEventCommand): Promise<{ id: string }> {
    const id = this.repo.nextId();
    const event = Event.draft(toDraftProps(cmd), UserId.of(cmd.creatorId), id);
    await this.repo.save(event);     // persist + đẩy domain events vào outbox (cùng transaction)
    return { id: id.value };
  }
}
```

### 8.5 Query handler (đọc thẳng read model, KHÔNG qua domain)
```ts
@QueryHandler(GetEventListQuery)
export class GetEventListHandler implements IQueryHandler<GetEventListQuery> {
  constructor(private readonly read: EventReadModel) {} // truy vấn projection tối ưu cho màn hình
  execute(q: GetEventListQuery): Promise<EventListItemView[]> {
    return this.read.list(q.filter, q.lang); // trả DTO theo ngôn ngữ VI/JP
  }
}
```

---

## 9. Cross-context contracts (`libs/contracts/event/`)

Context `event` **cung cấp** 2 contract query (chạy trên QueryBus, không cho import chéo module):

| Contract query | Cho ai dùng | Trả về |
|----------------|-------------|--------|
| `IsEventOrganizerQuery(eventId, userId)` | `budget` (tạo ngân sách), `survey` (tạo/mở/đóng + xem kết quả), `event` (báo cáo) | `boolean` (phân biệt event không tồn tại → 404) |
| `IsEventOpenForRegistrationQuery(eventId)` | `participation` (chặn `register` nếu chưa mở) | phân biệt không tồn tại (404) vs chưa mở (409) |

`event` cũng **tiêu thụ** `GetEventParticipationStatsQuery` + `GetEventBudgetSummaryQuery` cho slice báo cáo tổng kết (`GET /events/:id/report`).

---

## 10. Cấu trúc thư mục module `event` (vertical-slice thực tế)
```
modules/event/
├─ domain/
│  ├─ event.entity.ts · event.types.ts · event.errors.ts
│  ├─ value-objects/  multilingual-text · date-time-range · event-status · registration-policy · organizing-committee-member .value-object.ts
│  └─ events/  event-drafted · event-published · registration-opened · registration-closed · registration-reopened · event-rescheduled · event-cancelled .domain-event.ts
├─ commands/   create-event/ · publish-event/ · open-registration/ · reschedule-event/ · cancel-event/  (+ map-event-error.ts)
├─ queries/    get-event-list/ (i18n) · event-report/ · is-event-organizer/ (contract) · is-event-open-for-registration/ (contract)
├─ application/ports/ · database/ · dtos/
└─ event.module.ts
```
> Cấu trúc thực tế là **vertical-slice** (mỗi use case 1 folder trong `commands/`|`queries/`), không phải layout `application/adapters` ở bản thiết kế gốc. Đọc `event-system-be/docs/architecture-map.md` (tự sinh) để có danh sách slice/endpoint mới nhất.

---

## 11. Điểm đã chốt (trước là câu hỏi mở)
- [x] `reschedule` khi đang `REGISTRATION_OPEN` → **tự đóng + mở lại** (raise `RegistrationClosed` + `RegistrationReopened`, giữ status).
- [x] **Bỏ** trạng thái `POSTPONED` ở MVP (dùng `reschedule`/`cancel`).
- [x] ORM: **TypeORM** + PostgreSQL.
- [x] Outbox: **tự xây** (bảng `outbox_messages` + `OutboxRelay` `@Interval`), không dùng thư viện.
