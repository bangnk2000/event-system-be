# Tactical Design — Chỉ mục

> Thiết kế chiến thuật (DDD tactical) cho **Event System BE** (repo này, NestJS hexagonal).
> Nguồn chuẩn về code là source + [`docs/architecture-map.md`](../architecture-map.md) (tự sinh). Các tài liệu ở đây mô tả **ý đồ thiết kế + ranh giới aggregate**, đã đối chiếu với code (cập nhật 2026-07-02).

## Tài liệu theo bounded context

| Context | Vai trò | Aggregate(s) | Tài liệu |
|---------|---------|--------------|----------|
| **Event** | Core | `EventEntity` | [event-aggregate.md](./event-aggregate.md) |
| **Participation** | Core | `RegistrationEntity` | [participation-aggregate.md](./participation-aggregate.md) |
| **Budget** | Supporting | `BudgetEntity` (+ entity nội bộ `BudgetItem`) | [budget-aggregate.md](./budget-aggregate.md) |
| **Notification** | Supporting/Generic | `NotificationPreferenceEntity` (+ reactive handler) | [notification-aggregate.md](./notification-aggregate.md) |
| **Survey** | Supporting | `Survey`, `SurveyResponse` | [survey-aggregate.md](./survey-aggregate.md) |
| **Competition** | Supporting (Phase 2, **đã code — PR #13 merged**) | `Tournament` (+ entity nội bộ `Competitor`, `Match`) | [competition-aggregate.md](./competition-aggregate.md) |

> ADR: [adr/0001-api-documentation-strategy.md](./adr/0001-api-documentation-strategy.md) (code-first Swagger).

## Bản đồ Aggregate / Entity / VO (đối chiếu code)

| Context | Aggregate root | Entity nội bộ | Value Object | Enum/Type |
|---------|----------------|---------------|--------------|-----------|
| `event` | `EventEntity` | — | `MultilingualText`, `DateTimeRange`, `EventStatus`, `RegistrationPolicy`, `OrganizingCommitteeMember` | `EventType`, `RegistrationMode`, `OrganizerRole`, `EventLocation` (interface), `capacity: number\|null` |
| `participation` | `RegistrationEntity` | — | *(không có VO class)* | `ParticipationMode`, `RegistrationStatus` |
| `budget` | `BudgetEntity` | `BudgetItem` (immutable) | `Money` | `BudgetStatus` |
| `notification` | `NotificationPreferenceEntity` (id = userId) | — | *(không có VO class)* | `NotificationType` |
| `survey` | `Survey`, `SurveyResponse` | `SurveyQuestion`, `SurveyAnswer` | `MultilingualText`, `QuestionOption`, `RespondentToken` | `QuestionType`, `RespondentScope`, `SurveyStatus` |
| `competition` *(Phase 2, đã code — PR #13)* | `Tournament` | `Competitor`, `Match` | `MultilingualText`, `TournamentConfig`, `Standing`(read) | `TournamentFormat`, `TournamentStatus`, `TournamentStage`, `SeedMethod`, `MatchStatus` |

## Cross-context contracts (`libs/contracts/*`, chạy trên QueryBus)

| Contract query | Chủ (cung cấp) | Người tiêu thụ | Trả về |
|----------------|----------------|----------------|--------|
| `IsEventOrganizerQuery` | `event` | `budget`, `survey`, `event`(report) | `boolean` (404 nếu event không tồn tại) |
| `IsEventOpenForRegistrationQuery` | `event` | `participation` | 404 không tồn tại / 409 chưa mở |
| `IsEventParticipantQuery` | `participation` | `survey` | `{ registered, checkedIn }` |
| `GetEventParticipationStatsQuery` | `participation` | `event`(report) | `{ registered, cancelled, checkedIn, individual, team, checkInRate }` |
| `GetEventBudgetSummaryQuery` | `budget` | `event`(report) | `{ exists, currency, status, totalPlanned, totalActual, variance }` |
| `GetEventRegistrationsQuery` *(Phase 2, đã code — PR #13)* | `participation` | `competition` | `[{ registrationId, mode, displayName }]` — promote registration → competitor |

## Nguyên tắc chung (áp dụng mọi context)
- **Domain thuần** (zero framework), guardrails bằng dependency-cruiser (`pnpm arch`).
- **Không import chéo module**: chỉ qua (a) outbox → `@OnEvent` theo tên event, hoặc (b) shared-contract query trong `libs/contracts/*` trên QueryBus.
- Vi phạm nghiệp vụ = **`return Err(...)`** (oxide.ts `Result`); lỗi kỹ thuật = `throw` → GlobalExceptionFilter.
- Cấu trúc module = **vertical-slice**: `domain/` + `commands/<slice>/` + `queries/<slice>/` + `database/` + `dtos/` + `application/ports/`.
- Side-effect ngoài đi qua **Transactional Outbox** (`OutboxRelay` `@Interval` phát trên `EventEmitter2`).
