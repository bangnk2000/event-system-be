# Event System — Backend (Walking Skeleton)

Backend cho **Hệ thống Quản lý Sự kiện Nội bộ Công ty**.
NestJS 11 · TypeScript · Hexagonal/DDD · CQRS (lightweight, 1 PostgreSQL) · Transactional Outbox.

> Đây là **walking skeleton**: một vertical slice `create-event` chạy xuyên hết các tầng
> (Interface → Application → Domain → Infrastructure) + read slice `get-event-list`,
> để chứng minh kiến trúc trước khi mở rộng các bounded context khác.

## Kiến trúc
- **Bounded context:** `event` (lõi). Sẽ thêm `participation`, `iam`, `notification`… sau.
- **4 tầng, phụ thuộc hướng vào trong.** Domain thuần (zero framework/IO). Xem `AGENTS.md`.
- **CQRS:** command qua aggregate; query đọc thẳng read model (bypass domain).
- **Outbox:** domain event ghi vào bảng `outbox` trong cùng transaction; `OutboxRelay` poll & phát.

## Yêu cầu
- Node 22 LTS · pnpm · Docker (cho PostgreSQL)

## Chạy
```bash
pnpm install
cp .env.example .env
docker compose up -d            # PostgreSQL :5432
pnpm migration:run             # tạo bảng events + outbox
pnpm start:dev                 # http://localhost:3000
```

## Thử nhanh
```bash
# Tạo sự kiện (x-user-id tạm thay cho Google SSO)
curl -X POST http://localhost:3000/v1/events \
  -H 'Content-Type: application/json' -H 'x-user-id: 11111111-1111-1111-1111-111111111111' \
  -d '{"titleVi":"Họp toàn công ty","type":"INTERNAL_MEETING",
       "startAt":"2026-07-10T02:00:00.000Z","endAt":"2026-07-10T04:00:00.000Z",
       "registrationMode":"INDIVIDUAL"}'

# Liệt kê sự kiện
curl 'http://localhost:3000/v1/events?lang=vi'
```

## Kiểm tra kiến trúc
```bash
pnpm build      # biên dịch
pnpm arch       # dependency-cruiser: domain thuần + module privacy
pnpm test       # unit test domain + handler
```

## Kiểm thử HTTP REST
- **Tự động (supertest e2e)** — `test/*.e2e-spec.ts`, chạy thật qua HTTP vào app Nest:
  ```bash
  docker compose up -d        # cần PostgreSQL
  pnpm test:e2e               # event + participation: 9 test
  ```
  *(NODE_ENV=test tự `synchronize` schema; mỗi test TRUNCATE bảng để cô lập.)*
- **Thủ công** — mở [`api.http`](api.http) bằng REST Client (VS Code) / JetBrains HTTP client:
  bộ request đã nối chuỗi (`{{createEvent.response.body.id}}`) cho toàn bộ luồng vòng đời + đăng ký.

## Còn thiếu (theo lộ trình)
Google SSO thật (đang stub qua header `x-user-id`), i18n đầy đủ, các slice publish/reschedule/cancel,
ChatWork/Calendar/Drive adapters, eslint boundaries + naming lint, e2e. Xem `AGENTS.md`.
