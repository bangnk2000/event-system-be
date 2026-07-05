# Tactical Design — Context `Competition` (Thi đấu thể thao)

> Bounded Context: **Competition** (Supporting, Phase 2) · Stack: **NestJS + TypeScript** · CQRS: **lightweight, 1 PostgreSQL**
> Nguyên tắc: **domain thuần** (không phụ thuộc framework), Hexagonal (ports & adapters), transactional outbox.
> SRS: [`SRS-quan-ly-su-kien.md` §3.9 (FR-CMP-01…12)](../SRS-quan-ly-su-kien.md) · Tham chiếu context lõi: [`event-aggregate.md`](./event-aggregate.md) · [`participation-aggregate.md`](./participation-aggregate.md)
>
> **Quyết định brainstorm (2026-07-02):** 3 format = single-elim + round-robin + group→knockout (**bỏ** double-elim) · competitor **suy ra từ participation** (không tạo lại danh tính) · **chỉ BTC** nhập tỉ số · điểm **generic** (scoreA/scoreB, không nhúng luật từng môn).
>
> **✅ ĐÃ CODE (2026-07-02, session 08) — PR #13 đã merge → `master` `f28ef32`.** **Sai khác so với thiết kế dưới đây, theo pattern repo:**
> - **Lưu trữ jsonb** trên 1 bảng `tournaments` (config/competitors/matches là jsonb — theo pattern `budget`), **KHÔNG** tách bảng `competitors`/`matches` như §12 phác. Migration `1730000005000`.
> - Domain nhận **`idFactory: () => string`** cho `seed`/`advanceToKnockout` (inject id, không gọi crypto trong domain). Service truyền `() => repo.nextId()`.
> - Bỏ `set-match-schedule` (lịch/sân) khỏi MVP — Match không có `scheduledAt`/`venue` (hoãn Phase 2.1).
> - `MatchScore` VO gộp thành `scoreA`/`scoreB` nullable trên `Match` (YAGNI). `competition.types` chỉ giữ enum+config; `TournamentProps` nằm trong `tournament.entity.ts` (tránh circular với `match.ts`).

---

## 1. Ubiquitous Language (Competition context)

| VN | JP | EN (code) | Ý nghĩa |
|----|----|-----------|---------|
| Giải đấu | 大会 | `Tournament` | Aggregate root — 1 giải thi đấu gắn với 1 sự kiện |
| Thể thức | 方式 | `TournamentFormat` | single-elim / round-robin / group→knockout |
| Đấu thủ / Đội | 出場者 | `Competitor` | Entity trong `Tournament` — suy ra từ 1 registration |
| Trận đấu | 試合 | `Match` | Entity trong `Tournament` — 1 cặp đấu + tỉ số |
| Vòng | ラウンド | `round` | Số thứ tự vòng (elim: R1→chung kết; round-robin: lượt) |
| Bảng | 組 | `groupLabel` | Nhãn bảng (A/B/C…) cho thể thức group→knockout |
| Seed / Hạt giống | シード | `seed` | Thứ tự ưu tiên khi sinh cặp (1 = mạnh nhất) |
| Bảng xếp hạng | 順位表 | `Standing` | **Read model** tính từ Match (thắng/hòa/thua/hiệu số) |
| Sinh cặp | 組み合わせ | `seed()` | DRAFT → SEEDED: sinh Match theo thể thức |
| Ghi tỉ số | スコア記録 | `recordResult` | Nhập scoreA/scoreB → winner, tự tiến quân |

---

## 2. Ranh giới Aggregate

Một aggregate root `Tournament` **giữ luôn** `Competitor` và `Match` bên trong (giống cặp `Budget` ↔ `BudgetItem`). Lý do: seed + auto-advance là **invariant nhất quán tức thời** phải nằm trong 1 consistency boundary; quy mô giải nội bộ nhỏ (≤ vài chục đấu thủ) nên nạp cả aggregate là chấp nhận được.

```
┌─ Aggregate: Tournament (root) ───────────────────────────────────┐
│  Tournament                                                      │
│   ├─ eventId        : EventId        (tham chiếu context event)   │
│   ├─ name           : MultilingualText (VI/JP)                    │
│   ├─ format         : TournamentFormat                            │
│   ├─ status         : TournamentStatus  (state machine)          │
│   ├─ stage          : TournamentStage | null  (chỉ group→knockout)│
│   ├─ config         : TournamentConfig  (numGroups, advancePerGroup, seedMethod) │
│   ├─ createdBy      : UserId                                      │
│   ├─ competitors[]  : Competitor  ◀ entity (registrationId, seed, displayName snapshot, groupLabel?) │
│   └─ matches[]      : Match       ◀ entity (round, groupLabel?, A/B, score, winner, nextMatchId, schedule?) │
└──────────────────────────────────────────────────────────────────┘
        │ competitor tham chiếu registration bằng ID (KHÔNG nhập lại danh tính)
        ▼  cross-context query GetEventRegistrationsQuery (context participation)
```

**Quyết định ranh giới:**
- ✅ **`Competitor` + `Match` nằm TRONG `Tournament`**: invariant "chỉ sửa competitor khi DRAFT", "auto-advance winner", "complete khi đủ trận" phải nhất quán tức thời.
- ✅ **`Competitor` là snapshot**: lưu `registrationId` + `displayName` (chụp lúc add qua contract). Đọc bracket **không** gọi lại `participation`.
- ❌ **`Standing` KHÔNG lưu**: là read model tính trên query từ `matches[]` (tránh contention, luôn khớp tỉ số mới nhất).
- ⚠️ **Trần quy mô**: round-robin N đấu thủ = `N(N-1)/2` trận (N=16 → 120; N=32 → 496). MVP nhắm giải nội bộ ≤ ~16/bảng; nếu về sau cần lớn hơn thì tách `Match` thành aggregate riêng (advance qua domain event).

---

## 3. Value Objects & Entities

| VO/Entity | Thuộc tính | Invariant |
|-----------|-----------|-----------|
| `TournamentId` | uuid | — |
| `MultilingualText` | `{ vi: string; ja?: string }` | `vi` bắt buộc *(tái dùng shared-kernel)* |
| `TournamentFormat` | enum: `SINGLE_ELIM`, `ROUND_ROBIN`, `GROUP_KNOCKOUT` | — |
| `TournamentStatus` | enum + state machine (§4) | chỉ chuyển theo state machine |
| `TournamentStage` | enum: `GROUP`, `KNOCKOUT` | chỉ dùng khi `format = GROUP_KNOCKOUT`; null với 2 thể thức kia |
| `SeedMethod` | enum: `MANUAL_ORDER`, `RANDOM` | `MANUAL_ORDER` = theo thứ tự add; `RANDOM` = xáo tất định theo seed cho trước |
| `TournamentConfig` | `{ numGroups?: number; advancePerGroup?: number; seedMethod: SeedMethod }` | `numGroups`/`advancePerGroup` **bắt buộc & chỉ dùng** khi `GROUP_KNOCKOUT` |
| `Competitor` (entity) | `id, registrationId, seed:number, displayName:string, groupLabel?:string` | `seed` duy nhất trong giải; `groupLabel` gán khi seed group→knockout |
| `MatchScore` (VO) | `{ scoreA:number; scoreB:number }` | cả hai `≥0`; elim **cấm hòa** (`scoreA≠scoreB`); round-robin cho hòa |
| `Match` (entity) | `id, round, groupLabel?, stage?, competitorA:CompetitorId\|null, competitorB:CompetitorId\|null, score:MatchScore\|null, winner:CompetitorId\|null, status:MatchStatus, nextMatchId?:MatchId, nextSlot?:'A'\|'B', scheduledAt?:Date, venue?:string, detail?:string` | slot `null` = chưa xác định đối thủ (chờ vòng trước); `nextMatchId` chỉ có ở elim |
| `MatchStatus` | enum: `PENDING` (chưa đủ 2 đấu thủ), `SCHEDULED` (đủ đôi, chờ đá), `PLAYED` (đã có tỉ số), `BYE` (miễn đấu, tự thắng) | — |
| `Standing` (read) | `{ competitorId, displayName, played, won, drawn, lost, scoreFor, scoreAgainst, diff, points }` | `points = won*3 + drawn*1`; xếp: points → diff → scoreFor → head-to-head |

> **Điểm số generic:** domain chỉ biết `scoreA/scoreB` + suy ra `winner`. Chi tiết set/leg/map để ở `detail` (freeform, chỉ hiển thị). Không nhúng luật cầu lông/phi tiêu/esport vào domain.

---

## 4. State Machine (`TournamentStatus` + `stage`)

```
DRAFT ──seed──▶ SEEDED ──(record kết quả đầu tiên)──▶ IN_PROGRESS ──complete──▶ COMPLETED
  │                                                        │
  │  (chỉ DRAFT) addCompetitor / removeCompetitor          │  (mọi trạng thái ≠ COMPLETED) cancel ─▶ CANCELLED
  │                                                        │
  └── GROUP_KNOCKOUT: seed → stage=GROUP ─(advanceToKnockout khi xong vòng bảng)─▶ stage=KNOCKOUT
```

- `seed` (DRAFT→SEEDED): sinh `matches[]` theo thể thức. **Tất định** theo thứ tự seed của competitor. Yêu cầu số competitor tối thiểu (INV-T3).
- `recordResult`: hợp lệ khi tournament `SEEDED`/`IN_PROGRESS` và match `SCHEDULED`. Lần ghi đầu chuyển `SEEDED→IN_PROGRESS`. Elim: tự tiến quân (§6).
- `advanceToKnockout` (chỉ `GROUP_KNOCKOUT`, `stage=GROUP→KNOCKOUT`): sinh bracket loại trực tiếp từ **top-K mỗi bảng** theo `Standing`; chỉ khi **tất cả trận vòng bảng `PLAYED`**.
- `complete` (→COMPLETED): chỉ khi **mọi trận `PLAYED`/`BYE`** (INV-T7); raise `TournamentCompleted` (champion = winner trận cuối elim, hoặc top standing của round-robin).
- `cancel` (→CANCELLED): terminal, cho phép từ mọi trạng thái ≠ COMPLETED.

---

## 5. Thuật toán sinh cặp (seed) — 3 thể thức

### 5.1 `SINGLE_ELIM` (loại trực tiếp)
1. Sắp competitor theo `seed` (1..N). `P = ` lũy thừa 2 nhỏ nhất ≥ N. `byes = P − N`.
2. Xếp vào cây kiểu chuẩn (seed 1 và seed 2 ở hai nửa đối lập; hạt giống cao nhận bye). Số vòng = `log2(P)`.
3. Tạo trước **mọi slot match** của toàn cây; nối `nextMatchId`/`nextSlot` (thắng match `m` → vào slot của match cha).
4. Match có 1 bên là bye → `status = BYE`, competitor kia auto-advance ngay (điền vào `nextMatch`).
5. Match đủ 2 đấu thủ → `SCHEDULED`; còn thiếu → `PENDING`.

### 5.2 `ROUND_ROBIN` (vòng tròn)
1. Mọi cặp gặp nhau đúng 1 lần: `N(N−1)/2` trận.
2. Chia **lượt (round)** bằng *circle method*: N chẵn → `N−1` lượt × `N/2` trận/lượt; N lẻ → thêm 1 "bye" ảo, `N` lượt, mỗi lượt 1 người nghỉ.
3. Tất cả match `SCHEDULED` ngay sau seed (không phụ thuộc kết quả nhau).
4. Không có `nextMatchId`. Xếp hạng qua `Standing` (§3).

### 5.3 `GROUP_KNOCKOUT` (vòng bảng + loại trực tiếp)
1. **Chia bảng**: `numGroups` bảng, rải competitor kiểu **rắn (serpentine)** theo seed để cân bằng (bảng A,B,C,C,B,A,…). Gán `groupLabel`.
2. **Vòng bảng**: mỗi bảng chạy round-robin nội bảng (§5.2) → `stage = GROUP`.
3. Khi **toàn bộ trận bảng `PLAYED`** → `advanceToKnockout`: lấy **top `advancePerGroup` (K)** mỗi bảng theo `Standing`, seed chéo bảng (nhất bảng A gặp nhì bảng B…) → sinh bracket single-elim (§5.1) với các competitor này → `stage = KNOCKOUT`.

> Cả 3 tái dùng 2 primitive: **round-robin generator + standings** và **single-elim bracket + advance**. Group→knockout = ghép hai cái đó.

---

## 6. Auto-advance (elim)

Khi `recordResult` cho 1 match elim:
1. Xác định `winner` từ `MatchScore` (cấm hòa → INV-T5).
2. Nếu match có `nextMatchId`: điền `winner` vào `nextSlot` (A/B) của match cha.
3. Nếu match cha đã đủ 2 đấu thủ → chuyển `PENDING → SCHEDULED`.
4. Round-robin: **không** advance (chỉ cập nhật Standing khi đọc).

Bye được xử lý ngay lúc seed (bước 5.1.4) nên không cần ghi tỉ số.

---

## 7. Invariants

| Mã | Quy tắc |
|----|---------|
| INV-T1 | `name.vi` bắt buộc. |
| INV-T2 | Chỉ **thêm/xóa competitor khi `DRAFT`**. |
| INV-T3 | Số competitor tối thiểu để seed: elim/round-robin **≥2**; group→knockout cần `numGroups≥2`, mỗi bảng **≥2** (⇒ N ≥ `numGroups×2`), và `advancePerGroup ≤` sĩ số bảng nhỏ nhất. |
| INV-T4 | `seed` chỉ từ `DRAFT`; kết quả **tất định** theo thứ tự `seed` competitor (test được). |
| INV-T5 | `recordResult` chỉ khi tournament `SEEDED`/`IN_PROGRESS` **và** match `SCHEDULED`; `scoreA,scoreB ≥0`; match **elim/knockout cấm hòa**; round-robin cho hòa. |
| INV-T6 | Auto-advance: `winner` truyền vào `nextMatch`; match chỉ `SCHEDULED` khi đã đủ 2 đấu thủ (§6). |
| INV-T7 | `complete` chỉ khi **mọi trận `PLAYED`/`BYE`**. |
| INV-T8 | `competitor.registrationId` phải là **registration hợp lệ của đúng `eventId`** — validate qua `GetEventRegistrationsQuery` lúc add; lưu `displayName` snapshot. |
| INV-T9 | `advanceToKnockout` chỉ khi `format=GROUP_KNOCKOUT`, `stage=GROUP`, và **mọi trận bảng `PLAYED`**. |

---

## 8. Domain Events

| Event | Khi nào | Ai subscribe |
|-------|---------|--------------|
| `TournamentCreated` | tạo nháp | (projection read model) |
| `TournamentSeeded` | sinh cặp xong | **Notification** (báo lịch đấu vòng 1 — opt-out), Calendar/None |
| `MatchResultRecorded` | ghi tỉ số 1 trận | (projection / cập nhật standing read side) |
| `KnockoutStageGenerated` | group→knockout sang vòng loại | **Notification** (báo cặp knockout) |
| `TournamentCompleted` | đủ trận, có nhà vô địch | **Notification** (báo nhà vô địch), (report) |

Side-effect ngoài (ChatWork) đi qua **Transactional Outbox** → `@OnEvent('TournamentSeeded'|'TournamentCompleted'|…)` trong context `notification`, tái dùng `NotificationPreference` (opt-out) đã có.

---

## 9. Cross-context contracts (không import chéo module)

Tái dùng cơ chế `libs/contracts/*` chạy trên `QueryBus`:

| Contract query | Ở context | Dùng để | Trả về |
|----------------|-----------|---------|--------|
| `IsEventOrganizerQuery(eventId, userId)` | `event` *(đã có)* | Ủy quyền BTC: tạo/seed/ghi tỉ số/complete + mọi thao tác quản giải | `boolean` (404 nếu event không tồn tại) |
| **`GetEventRegistrationsQuery(eventId)`** | `participation` *(mới)* | Lấy danh sách registration hợp lệ để **promote → competitor** + snapshot `displayName` | `[{ registrationId, mode, displayName }]` |

> `GetEventRegistrationsQuery` cần thêm trong context `participation` (handler đọc thẳng DataSource theo `eventId`, lọc registration còn hiệu lực). `displayName`: đội → tên đội; cá nhân → tên người nếu có (chờ HR/user sync; MVP fallback `userId`) — xem §12.

---

## 10. Ports

```ts
// modules/competition/domain/ports/out/tournament.repository.ts
export interface TournamentRepository {
  nextId(): TournamentId;
  findById(id: TournamentId): Promise<Tournament | null>;
  save(tournament: Tournament): Promise<void>;   // state + competitors + matches + domain events → outbox trong 1 transaction
}
export const TOURNAMENT_REPOSITORY = Symbol('TOURNAMENT_REPOSITORY');
```

> `Competitor`/`Match` lưu qua repository của `Tournament` (cascade), không có repository riêng. Read side (bracket/standings/list) đọc thẳng DataSource trong query-handler.

---

## 11. Slices (use cases) & Endpoints (prefix `/v1`)

### Write (commands)
| Slice | Endpoint | Authz | Ghi chú |
|-------|----------|-------|---------|
| `create-tournament` | `POST /events/:eventId/tournaments` | BTC (`IsEventOrganizerQuery`) | body: name, format, config; tạo `DRAFT` |
| `add-competitor` | `POST /tournaments/:id/competitors` | BTC | body: registrationId; validate qua `GetEventRegistrationsQuery`; chỉ `DRAFT` |
| `remove-competitor` | `DELETE /tournaments/:id/competitors/:cid` | BTC | chỉ `DRAFT` |
| `seed-tournament` | `POST /tournaments/:id/seed` | BTC | DRAFT→SEEDED; sinh match theo thể thức (§5) |
| `record-match-result` | `POST /tournaments/:id/matches/:mid/result` | BTC | body: scoreA/scoreB (+detail?); tự tiến quân; 409 nếu match không `SCHEDULED`/hòa ở elim |
| `advance-to-knockout` | `POST /tournaments/:id/advance-knockout` | BTC | chỉ `GROUP_KNOCKOUT` khi xong vòng bảng (INV-T9) |
| `complete-tournament` | `POST /tournaments/:id/complete` | BTC | chỉ khi đủ trận (INV-T7) |
| *(tùy chọn)* `set-match-schedule` | `PATCH /tournaments/:id/matches/:mid/schedule` | BTC | gán `scheduledAt`/`venue` (sân, giờ) |

### Read (queries — đọc thẳng DataSource, bypass domain)
| Slice | Endpoint | Authz | Trả về |
|-------|----------|-------|--------|
| `get-tournament-bracket` | `GET /tournaments/:id` | ai cũng xem | cấu trúc match theo vòng/bảng (để render bracket) + competitor |
| `get-tournament-standings` | `GET /tournaments/:id/standings` | ai cũng xem | BXH tính từ matches (round-robin / theo bảng) |
| `list-event-tournaments` | `GET /events/:eventId/tournaments` | ai cũng xem | danh sách giải của sự kiện + trạng thái |

**Business error → HTTP** (map trong controller qua `throwCompetitionHttpError`, khớp `libs/exceptions`):
`COMPETITION.NOT_FOUND`→404 · `COMPETITION.FORBIDDEN`→403 · `COMPETITION.INVALID_STATE`→409 · `COMPETITION.INVALID_SEED`→400 (không đủ competitor / config sai) · `COMPETITION.INVALID_SCORE`→400 (âm / hòa ở elim) · `COMPETITION.MATCH_NOT_PLAYABLE`→409 · `COMPETITION.INVALID_REGISTRATION`→400 (registration không thuộc event).

---

## 12. Cấu trúc thư mục module `competition`
```
modules/competition/
├─ domain/
│  ├─ model/        tournament.aggregate.ts · competitor.ts · match.ts
│  │               value-objects: tournament-format.ts · tournament-status.ts · tournament-stage.ts
│  │                              seed-method.ts · match-score.ts · match-status.ts · tournament-config.ts
│  │               services:      bracket-generator.ts (single-elim) · round-robin-generator.ts · standings-calculator.ts
│  ├─ events/       tournament-created.ts · tournament-seeded.ts · match-result-recorded.ts
│  │               knockout-stage-generated.ts · tournament-completed.ts
│  └─ ports/out/    tournament.repository.ts
├─ application/
│  ├─ commands/     create-tournament.* · add-competitor.* · remove-competitor.* · seed-tournament.*
│  │               record-match-result.* · advance-to-knockout.* · complete-tournament.*
│  └─ queries/      get-tournament-bracket.* · get-tournament-standings.* · list-event-tournaments.*
├─ adapters/
│  ├─ in/rest/      tournament.controller.ts · match.controller.ts (Google SSO guard, i18n)
│  └─ out/persistence/  tournament.repository.postgres.ts · tournament.orm-entity.ts
│                       competitor.orm-entity.ts · match.orm-entity.ts · *.mapper.ts · *.read-model.ts
└─ competition.module.ts
```
+ Migration TypeORM: bảng `tournaments`, `competitors`, `matches` (index `(tournament_id, round)`, `(tournament_id, group_label)`).
+ Cross-context **mới**: `GetEventRegistrationsQuery` (contract trong `libs/contracts/participation/` + handler trong context `participation`).
+ **Thuật toán seed là domain service thuần** (`bracket-generator`, `round-robin-generator`, `standings-calculator`) — nơi unit test tập trung (tất định, INV-T4).

---

## 13. Điểm cần chốt trước/khi code
- [ ] **Luật điểm round-robin**: MVP cố định thắng=3 / hòa=1 / thua=0, tiebreak points→diff→scoreFor→head-to-head. Có cần cấu hình được không? (đề xuất: cố định MVP)
- [ ] **`displayName` cá nhân**: chờ HR/user sync để có tên thật; MVP fallback `userId`. Có cần bổ sung tên vào `Registration` từ trước không?
- [ ] **Xáo `RANDOM`**: cần seed tất định (không dùng `Math.random`) để test + reproduce — truyền seed số vào từ request hay lưu trên tournament? (đề xuất: lưu `randomSeed` khi seed lần đầu)
- [ ] **Lịch/sân**: MVP để `scheduledAt`/`venue` nullable + slice `set-match-schedule` tùy chọn. Có cần chống trùng sân/giờ không? (đề xuất: chưa, Phase 2.1)
- [ ] **Gắn kết quả giải vào `GET /events/:id/report`**: thêm cross-context `GetEventTournamentsSummaryQuery` (nhà vô địch, số trận) — làm sau khi context ổn định.
- [ ] **Sửa tỉ số sau khi đã tiến quân**: MVP cho sửa trận `PLAYED` chưa ảnh hưởng vòng sau? (phức tạp roll-back advance — đề xuất khóa sau khi trận kế đã `SCHEDULED`, hoặc chỉ cho sửa nếu `nextMatch` chưa đá).

---
*Bước kế tiếp đề xuất: dựng slice `create-tournament` → `add-competitor` → `seed-tournament` (với `SINGLE_ELIM` trước) xuyên hết các tầng làm walking skeleton của context, rồi thêm round-robin → group→knockout → `record-match-result`/standings.*
