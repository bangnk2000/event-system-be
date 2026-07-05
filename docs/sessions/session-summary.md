# Session Summary — Event System BE (handoff để tiếp tục)

> Mục đích: đọc file này là đủ để **một session mới tiếp tục công việc** mà không cần đọc lại toàn bộ.
> Cập nhật: 2026-07-05 · Tiến độ: [progress-checklist.md](./progress-checklist.md) · Tham chiếu chung: [reference.md](./reference.md)
>
> **Nhật ký từng session** (session nào làm gì — xem `logs/`):
> - [2026-06-30 · Session 01](./logs/2026-06-30-session-01.md) — thiết kế + walking skeleton → budget (`cf98279`→`23b6fd6`)
> - [2026-07-01 · Session 02](./logs/2026-07-01-session-02.md) — register-guard + hạ tầng (PR #1–#6, `master`→`c60c0f0`, CI xanh)
> - [2026-07-01 · Session 03](./logs/2026-07-01-session-03.md) — tài liệu API OpenAPI/Swagger code-first + ADR 0001 (PR #9 **đã merge** → `master` `10f950e`)
> - [2026-07-01 · Session 04](./logs/2026-07-01-session-04.md) — hủy đăng ký → tự thông báo + slice `notification-preferences` (PR #10 **đã merge** → `master` `e9c413e`)
> - [2026-07-02 · Session 05](./logs/2026-07-02-session-05.md) — báo cáo tổng kết sự kiện `GET /events/:id/report` + 2 cross-context contract query (PR #11 **đã merge** → `master` `fdbcc2c`)
> - [2026-07-02 · Session 06](./logs/2026-07-02-session-06.md) — **khảo sát sau sự kiện** (context `survey` mới, ẩn danh với BTC) + SRS §3.6.1/tactical design + contract `IsEventParticipantQuery` (PR #12 **đã merge** → `master` `906a990`)
> - [2026-07-02 · Session 07](./logs/2026-07-02-session-07.md) — **brainstorm + thiết kế Phase 2 Thi đấu thể thao** (SRS §3.9 FR-CMP-01…12 + tactical design `competition-aggregate.md`, 3 thể thức, competitor từ participation, chỉ BTC nhập tỉ số). **Tài liệu-thuần, chưa code**; BE giữ `master` `906a990`.
> - [2026-07-02 · Session 08](./logs/2026-07-02-session-08.md) — **code context `competition`** (thi đấu thể thao) đủ tầng: 4 domain service seed + 7 command + 3 query + contract `GetEventRegistrationsQuery` + migration. Xanh toàn bộ (317 modules · unit 47 · e2e 28). **PR #13 đã merge → `master` `f28ef32`**.
> - [2026-07-05 · Session 09](./logs/2026-07-05-session-09.md) — **housekeeping tài liệu**: đồng bộ `README.md`+`AGENTS.md` của BE về trạng thái 6 context (PR #15) + refresh README gốc knowledge-system; user tự merge thêm fix path CLI migration (PR #14). BE `master` `f28ef32` → `5397070` (15 PR). **Không đổi surface** (slice/event/contract).

> **Bắt đầu 1 task thì đọc [`docs/architecture-map.md`](../architecture-map.md)** (tự sinh, `pnpm map`) + `AGENTS.md` = biết toàn bộ slice/event/contract mà KHỎI grep repo. Chỉ mở đúng folder slice + aggregate liên quan; việc dò rộng thì giao cho subagent.

## 1. Bối cảnh
Phần mềm **quản lý sự kiện nội bộ** cho một công ty Nhật (dùng ChatWork + Google Workspace).
- **Thiết kế + code cùng repo này** (`~/projects/event-system-be`): [`docs/SRS-quan-ly-su-kien.md`](../SRS-quan-ly-su-kien.md), [`docs/design/`](../design/README.md) *(chuyển từ knowledge-system về 2026-07-05)*
- Convention scaffold (tái sử dụng, KHÔNG theo dự án): `knowledge-system/prompts/init-nestjs-hexagonal` (NestJS 11 + Hexagonal/DDD/CQRS, AI-agent-first)

## 2. Stack & nguyên tắc (đã chốt — không đổi nếu không có lý do)
- NestJS 11 · Node 22 · TypeScript · `@nestjs/cqrs` · **CQRS lightweight** (1 Postgres, không event-sourcing)
- **TypeORM + PostgreSQL** · **Transactional Outbox** (bảng `outbox_messages` + `OutboxRelay` `@Interval`)
- Result type **oxide.ts** (`Ok`/`Err`/`match`); business error = `return Err`, technical = `throw` → GlobalExceptionFilter
- **Domain thuần** (zero framework), guardrails bằng dependency-cruiser (`pnpm arch`)
- Cross-context: **không import chéo module**. Chỉ qua (a) outbox → `@OnEvent` theo tên event, hoặc (b) **shared-contract query** trong `libs/contracts/*` chạy trên QueryBus.

## 3. Trạng thái hiện tại
> **`master` = `5397070`** (15 PR — thêm #14 fix path CLI migration + #15 sync docs README/AGENTS). `arch` 317 modules · unit 47 · e2e 28, tất cả xanh.

**6 bounded context, tất cả xanh:**
| Context | Slice |
|---------|-------|
| `event` | create · get-list (i18n) · publish · open-registration · reschedule(auto close/reopen) · cancel · **report (BTC — tổng hợp participation+budget qua QueryBus)** · IsEventOrganizerQuery · IsEventOpenForRegistrationQuery |
| `participation` | register(cá nhân/đội — chặn nếu sự kiện chưa mở: 404/409) · cancel · check-in · list · GetEventParticipationStatsQuery (contract) |
| `budget` | create(uỷ quyền cross-context) · add-item · record-actual(+hóa đơn) · finalize · summary(variance) · GetEventBudgetSummaryQuery (contract) |
| `notification` | ChatWork notifier qua outbox `@OnEvent` (stub khi chưa cấu hình) · **hủy đăng ký → báo BTC + registrant(opt-out)** · setting `PUT`/`GET /notification-preferences` |
| `survey` | create-survey(BTC) · open · close · submit-response(**ẩn danh** — token HMAC, không lưu danh tính; chặn diện qua `IsEventParticipantQuery`) · get-survey-detail · list-event-surveys · get-survey-results(**chỉ BTC**, tổng hợp + tỷ lệ phản hồi) |
| `competition` | create-tournament(BTC) · add/remove-competitor(promote từ `participation` qua `GetEventRegistrationsQuery`) · seed(3 thể thức: single-elim/round-robin/group→knockout) · record-match-result(**chỉ BTC**, auto-advance elim) · advance-to-knockout · complete · get-bracket · get-standings(theo bảng) · list-event-tournaments |
+ `GoogleSsoGuard` (Bearer ID token, fallback header `x-user-id` cho dev).

**Endpoints chính** (prefix `/v1`):
- `POST /events` · `GET /events?lang=` · `POST /events/:id/{publish,open-registration,cancel}` · `PATCH /events/:id/schedule` · `GET /events/:id/report` (BTC)
- `POST /events/:eventId/registrations` · `GET /events/:eventId/registrations` · `POST /registrations/:id/{cancel,check-in}`
- `POST /events/:eventId/budget` · `POST /budgets/:id/items` · `PATCH /budgets/:id/items/:itemId/actual` · `POST /budgets/:id/finalize` · `GET /events/:eventId/budget`
- `PUT /notification-preferences` · `GET /notification-preferences` (user hiện tại)
- *(survey)* `POST /events/:eventId/surveys` · `GET /events/:eventId/surveys` · `POST /surveys/:id/{open,close,responses}` · `GET /surveys/:id` · `GET /surveys/:id/results` (BTC)

## 4. Chạy & test
```bash
cd ~/projects/event-system-be
pnpm install
docker compose up -d            # PostgreSQL :5432
pnpm start                      # http://localhost:3000  (dev: synchronize tự tạo bảng)
# Kiểm thử
pnpm typecheck && pnpm arch && pnpm test
pnpm test:e2e                   # supertest (cần postgres) — test/*.e2e-spec.ts
# Chạy lệnh trong WSL: wsl.exe -d Ubuntu -- bash -lc 'cd ~/projects/event-system-be && <cmd>'
```
> Lưu ý môi trường: repo nằm trên **WSL Ubuntu**; node/pnpm có trong WSL (Git Bash trên Windows KHÔNG dùng được vì /home map sai). Auth dev dùng header `x-user-id: <uuid>`.

## 5. Quyết định thiết kế then chốt
- Vai trò **gắn theo từng sự kiện** (ban tổ chức = người tạo + người được mời) · **không có quy trình phê duyệt**
- `reschedule` khi đang mở đăng ký → **tự đóng + mở lại** (raise RegistrationClosed+Reopened, giữ status)
- **Bỏ** trạng thái `POSTPONED` ở MVP
- Outbox **tự xây** (bảng + poller `@nestjs/schedule`), không dùng thư viện
- Budget uỷ quyền bằng **IsEventOrganizerQuery** (libs/contracts) thay vì import context `event`

## 6. Việc tiếp theo nên làm (ưu tiên giảm dần)
> **Frontend đã có dev KHÁC lo** (consume `docs/openapi.json` → codegen) — BE tập trung bổ sung tính năng SRS còn thiếu + tích hợp thật.

1. *(Tùy chọn mở rộng survey)* gắn kết quả khảo sát vào `GET /events/:id/report` (contract `GetSurveyResultsSummaryQuery`) · thông báo khi mở khảo sát (FR-SRV-10, `@OnEvent('SurveyOpenedDomainEvent')`, tôn trọng opt-out).
2. **Tính năng SRS còn thiếu** khác (BE): lưu ảnh/tài liệu sự kiện (chờ Google Drive credential) — khảo sát đã xong.
3. Tích hợp ngoài (chờ credential): ChatWork token thật · Google Calendar · Google Drive · đồng bộ user HR (context `iam` — "add next").
4. **Phase 2 — Thi đấu thể thao: ✅ XONG** (PR #13 merged → `master` `f28ef32`). Điểm mở chưa code: roll-back sửa tỉ số đã tiến quân · `displayName` cá nhân (chờ HR sync) · lịch/sân từng trận + chống trùng (Phase 2.1) · gắn kết quả giải vào `GET /events/:id/report`. Kanban BTC (context `task`) **pending**; phân quyền phòng ban **hoãn** (chờ HR sync).
5. Khi có kênh gửi **per-user** thật: mở rộng `EventNotificationsHandler` định tuyến riêng thay vì post room chung.

**Đã xong gần đây:** ~~hạ tầng (pino/SSO/CI/eslint/coverage/OpenAPI — 9 PR)~~ · ~~register-open guard~~ · ~~hủy đăng ký → tự thông báo + setting opt-out (PR #10)~~ · ~~báo cáo tổng kết sự kiện (PR #11)~~ · ~~khảo sát sau sự kiện (context `survey`, ẩn danh — PR #12)~~ · ~~thi đấu thể thao (context `competition`, 3 thể thức — PR #13)~~ ✅

## 7. Cách thêm 1 use case mới (nhắc nhanh — chi tiết ở `AGENTS.md`)
- Write slice: `modules/<ctx>/commands/<verb-noun>/` gồm `*.command.ts`, `*.service.ts` (ICommandHandler trả `Result`), `*.http.controller.ts`, `*.request.dto.ts`
- Read slice: `modules/<ctx>/queries/<verb-noun>/` (query-handler đọc thẳng DataSource, bypass domain)
- Đăng ký vào `*.module.ts`; sau khi xong chạy `pnpm typecheck && pnpm arch` phải xanh
- Lỗi business → `Err(DomainError)`; map sang HTTP trong controller qua `throw<Ctx>HttpError`
