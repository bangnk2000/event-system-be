# Event System BE — Progress Checklist

> Cập nhật: 2026-07-05 · Repo: `~/projects/event-system-be` · `master` = `5397070` — đã **merge 15 PR** (6 hạ tầng #1–#6 + map-check #7–#8 + OpenAPI #9 + hủy-đăng-ký-thông-báo #10 + báo-cáo-sự-kiện #11 + khảo-sát-sau-sự-kiện #12 + **thi-đấu-thể-thao #13** + fix-migration-cli-path #14 + sync-docs-README/AGENTS #15)
> Tài liệu thiết kế: [SRS](../SRS-quan-ly-su-kien.md) · [Event aggregate](../design/event-aggregate.md) · [Survey aggregate](../design/survey-aggregate.md) · [Competition aggregate](../design/competition-aggregate.md)
> Trạng thái build (verify trên master sau merge): `typecheck` ✅ · `arch` ✅ (317 modules) · `lint` ✅ · unit 47 ✅ (coverage gate đạt) · e2e HTTP 28 ✅
> PR #14–#15 (2026-07-05) **không đổi surface** (slice/event/contract): #14 sửa path CLI migration, #15 docs-thuần → số liệu build giữ nguyên.

## Phase 0 — Brainstorm & Thiết kế
- [x] Brainstorm 6 phần (phạm vi, vai trò, vòng đời, tính năng, tích hợp, phi chức năng)
- [x] SRS (`docs/SRS-quan-ly-su-kien.md`)
- [x] Tactical design Aggregate `Event` (`docs/design/event-aggregate.md`)
- [x] Chốt stack: NestJS 11 modular monolith · DDD/Hexagonal · CQRS lightweight · TypeORM+Postgres · outbox

## Phase 1a — Lõi (đã xong)
### Hạ tầng / shared kernel
- [x] `libs/ddd` (Entity, AggregateRoot, ValueObject, DomainEvent, Command, Query, RepositoryPort, Mapper, IdResponse)
- [x] `libs/exceptions` (ExceptionBase + ArgumentInvalid/NotFound/Conflict/Forbidden + GlobalExceptionFilter)
- [x] `libs/guard`, `libs/config` (zod), `libs/ports/logger`, `libs/db/TypeOrmRepositoryBase`
- [x] `libs/outbox` (entity + relay `@Interval`) — transactional outbox
- [x] `libs/logger` (pino qua nestjs-pino — xem Polish), `libs/decorators/CurrentUserId`
- [x] `DatabaseModule` + `data-source.ts` + migrations + `docker-compose` (postgres)
- [x] Bootstrap `main.ts` (versioning URI + ValidationPipe + global filter)
- [x] Guardrails: `.dependency-cruiser.cjs` (domain purity + module privacy), `AGENTS.md`/`CLAUDE.md`

### Context `event`
- [x] Domain: `EventEntity` + VO (MultilingualText, DateTimeRange, EventStatus state-machine, RegistrationPolicy, OrganizingCommitteeMember)
- [x] `create-event` (command) · `get-event-list` (query, i18n VI/JA)
- [x] Lifecycle: `publish` · `open-registration` · `reschedule` (auto close/reopen) · `cancel`
- [x] Guard ban tổ chức (403) · invalid-state (409) · invalid-schedule (400)
- [x] Domain unit tests (lifecycle)

### Context `participation`
- [x] Domain: `RegistrationEntity` (individual/team, status, check-in)
- [x] `register-for-event` · `cancel-registration` · `check-in` · `list-registrations`
- [x] Rule: trùng đăng ký 409 · team-no-name 400 · non-registrant 403 · double check-in 409
- [x] Domain unit tests

### Context `notification` + Auth
- [x] `NotifierPort` → `ChatWorkAdapter` (stub khi chưa cấu hình token)
- [x] Event-handler `@OnEvent` phản ứng domain event relay từ outbox (cross-context bằng tên event)
- [x] `GoogleSsoGuard` (verify Bearer Google ID token, fallback `x-user-id` dev)

### Kiểm thử
- [x] Unit tests (jest)
- [x] **HTTP REST e2e** (supertest) — `test/*.e2e-spec.ts` + `pnpm test:e2e`
- [x] `api.http` (REST Client collection)

## Phase 1b — Budget (đã xong)
- [x] Cross-context contract `IsEventOrganizerQuery` (`libs/contracts/event/`) + handler trong `event`
- [x] Domain: `Money` VO · `BudgetItem` · `BudgetEntity` (DRAFT→FINALIZED) · 4 domain event
- [x] `create-budget` (uỷ quyền qua cross-context query) · `add-budget-item` · `record-actual` (+hóa đơn) · `finalize-budget`
- [x] `get-budget-summary` (dự toán vs thực tế + chênh lệch/variance)
- [x] Domain unit tests + e2e (403/404/variance/finalize-lock)

## Phase 1b còn lại / Polish (chưa làm)
- [ ] PWA **Web Push** (VAPID) cho thông báo đẩy
- [x] Kiểm tra sự kiện đang mở đăng ký khi `register` (cross-context query `IsEventOpenForRegistrationQuery` → 404 nếu không tồn tại · 409 nếu chưa mở)
- [x] Thay `ConsoleLoggerAdapter` → **pino** (nestjs-pino) — JSON ở prod, pretty ở dev, redact `authorization`/`x-user-id` *(đã merge · PR #3)*
- [x] Bật **enforce** Google SSO (bỏ fallback `x-user-id`) khi có `GOOGLE_CLIENT_ID` → 401 nếu thiếu/sai token *(đã merge · PR #4)*
- [ ] ChatWork API thật (điền `CHATWORK_API_TOKEN`/`CHATWORK_ROOM_ID`)
- [ ] Google Calendar API (đồng bộ lịch) · Google Drive API (lưu ảnh/tài liệu)
- [ ] Đồng bộ user từ hệ thống HR (context `iam`)
- [x] CI workflow chạy `typecheck + arch + lint + test:cov + test:e2e` (GitHub Actions + postgres service) *(đã merge · PR #2)*
- [x] eslint boundaries + naming lint — flat config: `boundaries/dependencies` (soi domain purity/module privacy/libs-no-modules như dependency-cruiser) + naming-convention *(đã merge · PR #5)*
- [x] Coverage gate — jest threshold trên tầng domain (stmts80/branch60/func68/lines80) + `test:cov` *(đã merge · PR #6)*

## Tooling cho agent (2026-07-01, đã trên `master`)
- [x] **Auto-generated architecture map** — `scripts/gen-map.mjs` sinh `docs/architecture-map.md` (17 slices→folder+endpoint+spec · 14 domain event→raiser+consumer · 2 contract); `pnpm map` / `pnpm map:check` + bước CI chống lỗi thời. Đọc map + `AGENTS.md` là đủ context, khỏi grep repo mỗi session.
- [x] **`map:check` ổn định** — bỏ HEAD hash khỏi map để check không lệch *(đã merge · PR #7, #8)* + **husky pre-commit** tự regen & stage map.

## Tài liệu API — OpenAPI/Swagger (2026-07-01, **đã merge · PR #9** vào `master`)
> Quyết định + lý do: [ADR 0001 — API documentation strategy](../design/adr/0001-api-documentation-strategy.md) (**code-first Swagger**, KHÔNG contract-first).
- [x] **`@nestjs/swagger` v11 code-first** — Swagger UI `/docs` (+ JSON `/docs-json`); 1 nguồn `src/swagger.ts` dùng chung cho UI + script gen.
- [x] **`docs/openapi.json` commit trong repo** — `scripts/gen-openapi.ts` (Nest **preview mode**, không cần DB). FE/AI agent dùng spec này codegen client, KHỎI đọc code BE.
- [x] Decorator **tường minh** trên 11 DTO + 15 controller (không dùng CLI plugin vì repo chạy `ts-node` → spec deterministic). `libs/api-docs`: `IdResponseDto`, `ApiErrorDto` (khớp `SerializedException`), `ApiStandardErrors`. Security `bearer`/`x-user-id` khớp `GoogleSsoGuard`.
- [x] `pnpm openapi:gen` / `openapi:check` + bước CI **"OpenAPI spec is fresh"** (mirror `map:check`). Verify local: typecheck ✅ · arch ✅ (176 modules) · lint ✅ · unit 17 ✅ · gen ✅.
- [ ] (FE) chọn trình codegen từ `openapi.json`: `openapi-typescript` (chỉ type) hoặc `orval`/`@hey-api/openapi-ts` (type + React Query hooks).

## Phase 1 — Tính năng SRS còn thiếu
- [x] Khảo sát sau sự kiện (chỉ ban tổ chức xem kết quả) — **ẩn danh với BTC**
  - [x] **Tài liệu (2026-07-02)**: SRS §3.6.1 (FR-SRV-01…10) + [tactical design `survey-aggregate.md`](../design/survey-aggregate.md) (2 aggregate Survey/SurveyResponse, state machine, cross-context contract `IsEventParticipantQuery` mới, 7 slice + endpoint)
  - [x] **Code (2026-07-02, PR #12 đã merge → `master` `906a990`)**: context `survey` mới — slices `create-survey`/`open-survey`/`close-survey`/`submit-response` + `get-survey-detail`/`list-event-surveys`/`get-survey-results`; **ẩn danh** = lưu `respondentToken=HMAC(SURVEY_RESPONDENT_SALT, surveyId+userId)`, không lưu danh tính; migration `1730000004000`; contract **`IsEventParticipantQuery`** mới trong `participation`. Verify: typecheck ✅ · arch ✅ (254 modules) · lint ✅ · unit 36 ✅ · e2e 23 ✅ · map/openapi regen.
- [ ] Lưu ảnh/tài liệu sự kiện (Google Drive)
- [x] Báo cáo tổng kết sự kiện — `GET /v1/events/:id/report` (chỉ BTC): tổng hợp đăng ký/check-in + ngân sách qua 2 cross-context contract query *(đã merge · PR #11)*
- [x] Hủy đăng ký **tự thông báo** (qua outbox → notification): báo BTC (room chung) + báo registrant nếu chưa opt-out *(đã merge · PR #10)*
  - Kèm **setting bật/tắt theo user**: slice mới trong `notification` (`NotificationPreference` aggregate opt-out) + `PUT`/`GET /v1/notification-preferences`

## Phase 2
- [x] **Thi đấu thể thao** — context `competition` mới (Tournament/Competitor/Match, BXH) — **PR #13 đã merge → `master` `f28ef32`**
  - [x] **Tài liệu (2026-07-02, session 07)**: brainstorm + SRS §3.9 (FR-CMP-01…12) + [tactical design `competition-aggregate.md`](../design/competition-aggregate.md). Chốt: 3 thể thức (single-elim/round-robin/group→knockout, bỏ double-elim) · competitor suy ra từ `participation` · chỉ BTC nhập tỉ số · điểm generic · contract mới `GetEventRegistrationsQuery`.
  - [x] **Code (2026-07-02, session 08 — PR #13 đã merge → `master` `f28ef32`)**: context `competition` đủ tầng — 4 domain service seed thuần (single-elim bye+auto-advance · round-robin circle method · chia bảng serpentine · standings 3/1) + 7 command slice (chỉ BTC) + 3 query (bracket/standings/list) + contract `GetEventRegistrationsQuery` + migration `1730000005000` (jsonb). Verify: typecheck ✅ · arch ✅ (317 modules) · lint ✅ · unit 47 (+11) ✅ · e2e 28 (+5) ✅ · coverage gate ✅ · map/openapi regen. Điểm mở (chưa code): roll-back sửa tỉ số · displayName cá nhân (chờ HR) · lịch/sân+chống trùng (Phase 2.1) · gắn kết quả vào report.
- [ ] Quản lý công việc ban tổ chức (checklist/Kanban) — context `task` · **pending** (brainstorm/design chưa làm)
- [ ] Phân quyền tạo sự kiện theo phòng ban — **hoãn** (phụ thuộc đồng bộ HR)

## Frontend (chưa làm)
- [ ] React + PWA, i18n Việt–Nhật, đăng nhập Google, ghép đầu-cuối với BE

## Nhánh đang mở (chưa merge)
> _Không còn._ Toàn bộ 15 PR đã vào `master`.

## Đã merge vào master — `master` = `5397070`
> 15 PR đã merge (PR #1–#10: 2026-07-01 · PR #11–#13: 2026-07-02 · PR #14–#15: 2026-07-05).

| PR | Nhánh | Nội dung |
|----|-------|----------|
| #1 | `fix/register-open-registration-guard` | Chặn `register` nếu sự kiện chưa mở (404/409) qua `IsEventOpenForRegistrationQuery` |
| #2 | `infra/ci-workflow` | GitHub Actions: typecheck+arch+lint+test:cov+e2e + postgres service |
| #3 | `infra/pino-logger` | nestjs-pino thay ConsoleLoggerAdapter (JSON/pretty, redact) |
| #4 | `infra/enforce-google-sso` | Enforce SSO khi có `GOOGLE_CLIENT_ID` (401) + guard spec |
| #5 | `infra/eslint-boundaries` | ESLint flat config: `boundaries/dependencies` + naming + bước CI lint |
| #6 | `infra/coverage-gate` | jest coverage threshold (domain) + `test:cov` + bước CI |
| #7, #8 | `fix/map-check-deterministic` | Bỏ HEAD hash khỏi architecture map (`map:check` ổn định) + husky pre-commit regen/stage map |
| #9 | `infra/openapi-swagger` | Code-first Swagger `/docs` + `docs/openapi.json` committed + CI `openapi:check` (`13abae1`) |
| #10 | `feat/registration-cancelled-notification` | Hủy đăng ký → thông báo (BTC + registrant opt-out) + slice `notification-preferences` PUT/GET + migration `1730000003000` (`1b8e4f4`) |
| #11 | `feat/event-summary-report` | Báo cáo tổng kết sự kiện `GET /v1/events/:id/report` (BTC) — tổng hợp participation + budget qua 2 cross-context contract query (`get-event-participation-stats`, `get-event-budget-summary`) (`7e24379`) |
| #12 | `feat/post-event-survey` | Khảo sát sau sự kiện — context `survey` mới (**ẩn danh với BTC**: token HMAC, không lưu danh tính) + 7 slice + contract `IsEventParticipantQuery` + migration `1730000004000` (`906a990`) |
| #13 | `feat/sports-competition` | Thi đấu thể thao — context `competition` mới (3 thể thức single-elim/round-robin/group→knockout, seed thuần + auto-advance, **chỉ BTC** nhập tỉ số) + 10 slice + contract `GetEventRegistrationsQuery` + migration `1730000005000` (`f28ef32`) |
| #14 | `fix/typeorm-migration-cli-paths` | Sửa resolution path alias cho TypeORM migration CLI (`7d4d998`) |
| #15 | `docs/sync-readme-agents` | Đồng bộ `README.md` + `AGENTS.md` của BE về trạng thái hiện tại (6 bounded context, endpoint/migration/scripts/e2e; `AGENTS` thêm survey+competition vào mục Contexts) (`5397070`) |

> ✅ CI trên GitHub Actions đã chạy **xanh** (typecheck + arch + lint + test:cov + e2e với postgres service).
