# ADR 0001 — Chiến lược tài liệu API (code-first Swagger, không contract-first)

> Trạng thái: **Accepted** · Ngày: 2026-07-01 · Bối cảnh: `event-system-be`
> Liên quan: [Session summary](../../sessions/session-summary.md) · [Progress checklist](../../sessions/progress-checklist.md)
> Đã triển khai: nhánh `infra/openapi-swagger` (BE) — `@nestjs/swagger` + `docs/openapi.json` + CI `openapi:check`

---

## Bối cảnh

Cần một tài liệu API để **frontend (React + PWA)** và **AI agent** dựa vào mà làm FE, **không phải đọc code backend**. Backend theo **DDD-first / Hexagonal**: domain thuần là lõi, HTTP controller là _driving adapter_ mỏng đã bám sát use case (vertical slice + CQRS + `oxide.ts Result`).

Câu hỏi đặt ra: dùng **code-first** (Swagger sinh spec từ code) hay **contract-first** (`openapi-generator` — viết spec tay rồi sinh code)?

## Quyết định

**Code-first bằng `@nestjs/swagger` cho backend.** BE là _producer_ sinh ra `docs/openapi.json`; FE là _consumer_ dùng một trình sinh client (openapi-generator / openapi-typescript / orval) ăn spec đó. Hai vai trò tách bạch, không dùng `openapi-generator` để sinh **server**.

### Lý do (gắn với DDD/Hexagonal)

1. **Domain là nguồn chân lý, không phải JSON schema.** Contract-first có cám dỗ để cấu trúc `openapi.yaml` định hình ngược DTO rồi rò xuống aggregate — đảo ngược hướng phụ thuộc của DDD (thứ ngoại vi lái lõi). Code-first giữ đúng thứ tự: `domain → use case (slice) → HTTP adapter → spec là sản phẩm phụ`.
2. **Controller là adapter mỏng đã do domain định hình.** Sinh spec ngược ra từ adapter là trung thực. Ngược lại `openapi-generator` sinh server stub generic — không biết `CommandBus`, `Result`, vertical-slice, `libs/contracts` → phải đánh nhau với generator hoặc vứt phần lớn code nó sinh.
3. **Bối cảnh tổ chức:** một team, một FE nội bộ. Contract-first chỉ đáng khi API là _Published Language_ phải đàm phán trước giữa nhiều consumer độc lập / nhiều team song song — chưa phải tình huống hiện tại.

### Chi tiết triển khai (đã làm)

- **`@nestjs/swagger` v11**, khai báo bằng **decorator tường minh** (`@ApiProperty`, `@ApiOkResponse`, …) — **không dùng CLI plugin**, vì repo chạy mọi thứ qua `ts-node` (`start`, script gen) chứ không qua `nest build`; plugin là TS transformer chỉ chạy khi build → sẽ không áp dụng. Decorator tường minh cho spec **deterministic** ở mọi runtime.
- **1 nguồn duy nhất** `src/swagger.ts` (`buildOpenApiDocument`) dùng chung cho:
  - `main.ts` → Swagger UI tại `/docs` (+ JSON tại `/docs-json`) cho **dev**.
  - `scripts/gen-openapi.ts` → emit **`docs/openapi.json`** (commit vào repo) cho **FE / AI agent / codegen**.
  - ⇒ UI và spec commit không bao giờ lệch nhau.
- **Script gen chạy Nest "preview mode"** → quét route metadata nhưng **không khởi tạo provider** → không cần DB/network.
- **Chống drift bằng CI**: `pnpm openapi:check` (mirror `map:check`) — regenerate rồi `git diff --exit-code`; PR đổi controller/DTO mà quên regenerate sẽ đỏ.
- **Bề mặt bổ sung thủ công** (plugin/tự suy không lo được): response DTO (`IdResponseDto` cho lệnh, DTO đọc cho query), **error envelope chuẩn** `ApiErrorDto` (khớp `SerializedException` của `GlobalExceptionFilter`) qua decorator `ApiStandardErrors(...)`, tag theo bounded context (`events`/`participation`/`budget`).
- **Auth**: khai báo 2 security scheme — `bearer` (Google ID token) **hoặc** `x-user-id` (dev) — ánh xạ đúng `GoogleSsoGuard` (global guard).
- **DDD purity**: không nhét decorator Swagger vào `libs/ddd` (kernel thuần); `IdResponseDto` đặt ở `libs/api-docs`, chỉ để tài liệu hoá shape của `IdResponse`.

## Hệ quả

**Tích cực**
- FE/AI agent lấy hợp đồng HTTP đúng-hiện-trạng từ `docs/openapi.json` mà không chạy server, không đọc code BE.
- Bổ trợ `docs/architecture-map.md` (map cho agent BE) — `openapi.json` là map cho agent FE.
- Spec deterministic + CI gác → không lỗi thời âm thầm.

**Tiêu cực / đánh đổi**
- Phải rải decorator Swagger tường minh trên DTO/controller (chi phí boilerplate; đổi lấy tính deterministic).
- Thêm 1 dependency (`@nestjs/swagger`).

## Khi nào xét lại (chuyển sang contract-first)

Chỉ khi: (a) mở API cho **đối tác/consumer ngoài** cần cam kết hợp đồng ổn định, hoặc (b) tách **team FE độc lập** cần khoá contract trước sprint. Lúc đó API thành một context boundary thật sự và spec-first mới bù lại được chi phí.

## Phương án đã loại

- **Contract-first sinh server (`openapi-generator`)** — chống lại kiến trúc hexagonal đã dựng (xem lý do 2).
- **Viết OpenAPI tay trong `knowledge-system/docs`** — lỗi thời nhanh, trái văn hoá auto-gen (`map`/`map:check`).
