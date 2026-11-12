> 🇬🇧 English version: [README.md](README.md)

# Event System — Backend

Backend cho **Hệ thống Quản lý Sự kiện Nội bộ Công ty**.
NestJS 11 · TypeScript 5.7 · Hexagonal/DDD · CQRS (lightweight, 1 PostgreSQL) · Transactional Outbox.

> Khởi đầu từ một walking skeleton (`create-event`), dự án nay đã có **6 bounded context**
> chạy xuyên hết các tầng (Interface → Application → Domain → Infrastructure).
> Design chi tiết + SRS nằm ngay trong repo: [`docs/SRS-quan-ly-su-kien.md`](docs/SRS-quan-ly-su-kien.md) · [`docs/design/`](docs/design/) · nhật ký phiên làm việc: [`docs/sessions/`](docs/sessions/).

## Bounded contexts
| Context | Vai trò | Aggregate | Tóm tắt |
|---|---|---|---|
| **event** | Core | `Event` | Vòng đời sự kiện: tạo, publish, mở đăng ký, dời lịch, huỷ, báo cáo. |
| **participation** | Core | `Registration` | Đăng ký cá nhân/nhóm, check-in, huỷ đăng ký, thống kê. |
| **budget** | Supporting | `Budget` (+ `BudgetItem`, VO `Money`) | Lập & theo dõi ngân sách: kế hoạch vs thực chi, chốt sổ. |
| **notification** | Supporting | `NotificationPreference` | Tuỳ chọn nhận thông báo + handler phản ứng theo domain event → ChatWork. |
| **survey** | Supporting | `Survey`, `SurveyResponse` | Khảo sát sau sự kiện (ẩn danh). |
| **competition** | Supporting (Phase 2) | `Tournament` (+ `Competitor`, `Match`) | Thi đấu thể thao: loại trực tiếp / vòng tròn / bảng → knockout. |

## Kiến trúc
- **4 tầng, phụ thuộc hướng vào trong.** Domain thuần (zero framework/IO/SDK). Chi tiết trong [`AGENTS.md`](AGENTS.md).
- **CQRS:** command đi qua aggregate; query đọc thẳng read model (bypass domain).
- **Outbox:** domain event ghi vào bảng `outbox_messages` trong cùng transaction; `OutboxRelay` poll & phát in-process qua `EventEmitter2`.
- **Cross-context:** không import chéo module — giao tiếp qua Command/Query bus (contracts ở `src/libs/contracts/`) hoặc domain event. `notification` phản ứng theo tên event bằng `@OnEvent`.
- **`docs/architecture-map.md`** là bản kiểm kê chuẩn tự sinh (`pnpm map`); CI (`pnpm map:check`) fail nếu lệch.

## Yêu cầu
- Node ≥ 20 (khuyến nghị 22 LTS) · pnpm · Docker (cho PostgreSQL)

## Chạy
```bash
pnpm install
cp .env.example .env
docker compose up -d            # PostgreSQL 16 :5432 (DB: event_system)
pnpm migration:run             # tạo 8 bảng qua 6 migration
pnpm start:dev                 # http://localhost:3000
```

## Thử nhanh
```bash
# Tạo sự kiện (x-user-id tạm thay cho Google SSO khi chưa set GOOGLE_CLIENT_ID)
curl -X POST http://localhost:3000/v1/events \
  -H 'Content-Type: application/json' -H 'x-user-id: 11111111-1111-1111-1111-111111111111' \
  -d '{"titleVi":"Họp toàn công ty","type":"INTERNAL_MEETING",
       "startAt":"2026-07-10T02:00:00.000Z","endAt":"2026-07-10T04:00:00.000Z",
       "registrationMode":"INDIVIDUAL"}'

# Liệt kê sự kiện
curl 'http://localhost:3000/v1/events?lang=vi'
```

## API (base `/v1`)
Xác thực: `Authorization: Bearer <google-id-token>` khi có `GOOGLE_CLIENT_ID`, nếu không fallback header `x-user-id` (dev). Swagger UI khi chạy dev; spec tĩnh ở [`docs/openapi.json`](docs/openapi.json) (`pnpm openapi:gen`).

- **Event** — `POST /events` · `GET /events?lang=` · `POST /events/:id/publish` · `POST /events/:id/open-registration` · `PATCH /events/:id/schedule` · `POST /events/:id/cancel` · `GET /events/:eventId/report`
- **Participation** — `POST|GET /events/:eventId/registrations` · `POST /registrations/:id/check-in` · `POST /registrations/:id/cancel`
- **Budget** — `POST|GET /events/:eventId/budget` · `POST /budgets/:budgetId/items` · `PATCH /budgets/:budgetId/items/:itemId/actual` · `POST /budgets/:budgetId/finalize`
- **Notification** — `PUT|GET /notification-preferences`
- **Survey** — `POST|GET /events/:eventId/surveys` · `GET /surveys/:surveyId` · `GET /surveys/:surveyId/results` · `POST /surveys/:surveyId/open|close` · `POST /surveys/:surveyId/responses`
- **Competition** — `POST|GET /events/:eventId/tournaments` · `POST /tournaments/:id/seed` · `POST|DELETE /tournaments/:id/competitors[/:competitorId]` · `POST /tournaments/:id/advance-knockout` · `POST /tournaments/:id/matches/:matchId/result` · `POST /tournaments/:id/complete` · `GET /tournaments/:id` · `GET /tournaments/:id/standings`

## Scripts
| Lệnh | Việc |
|---|---|
| `pnpm build` / `pnpm typecheck` | biên dịch / `tsc --noEmit` |
| `pnpm lint` | eslint (+ boundaries) |
| `pnpm arch` | dependency-cruiser: domain thuần + module privacy |
| `pnpm test` / `pnpm test:cov` | unit test domain + handler |
| `pnpm test:e2e` | e2e supertest (cần PostgreSQL) |
| `pnpm map` / `pnpm map:check` | sinh / kiểm `docs/architecture-map.md` |
| `pnpm openapi:gen` / `pnpm openapi:check` | sinh / kiểm `docs/openapi.json` |
| `pnpm migration:run` / `pnpm migration:revert` | migration TypeORM |

## Kiểm thử
- **Unit** (`*.spec.ts` co-located): domain entity + service handler mỗi aggregate, guard, notification handler → `pnpm test`.
- **E2E** (`test/*.e2e-spec.ts`, 28 test / 7 file — event, participation, budget, notification, survey, competition, event-report): chạy thật qua HTTP vào app Nest.
  ```bash
  docker compose up -d        # cần PostgreSQL
  pnpm test:e2e
  ```
  *(NODE_ENV=test tự `synchronize` schema; mỗi test TRUNCATE bảng để cô lập.)*
- **Thủ công** — mở [`api.http`](api.http) bằng REST Client (VS Code) / JetBrains HTTP client: bộ request đã nối chuỗi cho luồng vòng đời event + participation + budget.

## Còn thiếu (theo lộ trình)
Google SSO production-hardening, i18n đầy đủ, adapter ChatWork/Calendar/Drive thật (đang stub khi chưa set env),
kiểm tra event tồn tại khi đăng ký. Xem [`AGENTS.md`](AGENTS.md) và session logs ở [`docs/sessions/`](docs/sessions/).
