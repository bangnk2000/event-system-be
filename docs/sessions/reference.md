# Reference — Event System BE (dùng chung mọi session)

> Thông tin ổn định, KHÔNG theo session. Nhật ký từng session: [logs/](./logs/) · Trạng thái: [progress-checklist.md](./progress-checklist.md) · Handoff: [session-summary.md](./session-summary.md)

## Nơi lưu
- `~/projects/event-system-be` (repo NÀY, trên WSL Ubuntu): mã nguồn backend **+ toàn bộ tài liệu** — SRS ([docs/SRS-quan-ly-su-kien.md](../SRS-quan-ly-su-kien.md)), tactical design ([docs/design/](../design/)), session log ([docs/sessions/](./)). Remote `git@github.com:bangnk2000/event-system-be.git`.
- `~/projects/knowledge-system`: chỉ còn kiến thức cá nhân + prompt convention tái sử dụng (`prompts/init-nestjs-hexagonal`). *(Docs dự án đã chuyển về đây 2026-07-05.)*

## Môi trường & lưu ý shell ⚠️
- Node 22.19 + pnpm 10.17 trong WSL. Postgres qua `docker compose` (:5432, db `event_system`).
- Bash tool = Git Bash trên Windows, `/home/...` map sai → **luôn** chạy qua `wsl.exe -d Ubuntu -- bash -lc '...'`.
- **Shell wrapper là fish**: nuốt `$(...)`, `$var`, `$?` trong lệnh `wsl.exe … bash -lc '…'` → dùng lệnh git trực tiếp (không `echo "$(…)"`), tránh `for x in …; $x` và `$?`; cần biến/loop thì viết file `.sh` rồi `bash file.sh`.
- **Commit message có dấu `'`** làm vỡ heredoc `bash -lc '…'` → tránh apostrophe.
- Path alias `@libs/*`, `@modules/*`: build/arch OK; runtime dev qua `node -r ts-node/register -r tsconfig-paths/register`. Auth dev = header `x-user-id`.

## Convention nguồn (đã tuân thủ)
`prompts/init-nestjs-hexagonal/`: 4 tầng (Interface→Application→Domain, Infra ngoài rìa), dependency rule hướng vào trong, domain zero-deps, command handler = `*.service.ts`, business error trả `Result` / technical `throw`, module privacy (no cross-module import), Command→Event→Command, shared-contracts (`libs/contracts/*`) cho giao tiếp liên context qua QueryBus. Guardrails: `.dependency-cruiser.cjs` (`pnpm arch`) + ESLint `boundaries/dependencies` (`pnpm lint`).

## Bản đồ thư mục backend (rút gọn)
```
src/
├─ libs/  ddd · exceptions(+filter) · guard · config · ports/logger · db/TypeOrmRepositoryBase
│         outbox(entity+relay) · logger(pino adapter) · decorators · auth(GoogleSsoGuard) · contracts/event
├─ modules/
│  ├─ event/         domain(+VO,state-machine) · commands(create/publish/open-reg/reschedule/cancel) · queries(list/is-organizer/is-open-for-registration) · database
│  ├─ participation/ domain · commands(register/cancel/check-in) · queries(list) · database
│  ├─ budget/        domain(Money/BudgetItem/Budget) · commands(create/add-item/record-actual/finalize) · queries(summary) · database
│  └─ notification/  adapters(ChatWork) · application(ports/notifier, event-handlers)
├─ database.module.ts · data-source.ts · app.module.ts · main.ts · migrations/
test/   event|participation|budget .e2e-spec.ts · setup/
eslint.config.mjs · jest.config.ts · jest-e2e.config.ts · .dependency-cruiser.cjs · .github/workflows/ci.yml · api.http
```

## Bảng DB
- `events` (committee jsonb, status, schedule, registration policy…)
- `registrations` (event_id, user_id, mode, team_name, member_ids jsonb, status, checked_in_at)
- `budgets` (event_id unique, owner_id, currency, status, items jsonb)
- `outbox_messages` (aggregate_id, event_name, payload jsonb, processed_at)

## Lệnh hữu ích (chạy trong WSL)
```bash
wsl.exe -d Ubuntu -- bash -lc 'cd /home/bangnk/projects/event-system-be && pnpm typecheck && pnpm arch && pnpm lint && pnpm test:cov'
# e2e cần postgres: docker compose up -d  →  pnpm test:e2e  →  docker compose down -v
git -C ~/projects/event-system-be log --oneline   # master = c60c0f0 (đã merge PR #1–#6)
```
