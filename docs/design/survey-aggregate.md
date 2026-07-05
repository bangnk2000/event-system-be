# Tactical Design — Context `Survey` (Khảo sát sau sự kiện)

> Bounded Context: **Survey** (Supporting) · Stack: **NestJS + TypeScript** · CQRS: **lightweight, 1 PostgreSQL**
> Nguyên tắc: **domain thuần** (không phụ thuộc framework), Hexagonal (ports & adapters), transactional outbox.
> SRS: [`SRS-quan-ly-su-kien.md` §3.6.1 (FR-SRV-01…10)](../SRS-quan-ly-su-kien.md) · Tham chiếu context lõi: [`event-aggregate.md`](./event-aggregate.md)

---

## 1. Ubiquitous Language (Survey context)

| VN | JP | EN (code) | Ý nghĩa |
|----|----|-----------|---------|
| Khảo sát | アンケート | `Survey` | Aggregate root — bộ câu hỏi thu thập phản hồi cho 1 sự kiện |
| Câu hỏi | 設問 | `SurveyQuestion` | Entity trong aggregate `Survey` |
| Lựa chọn | 選択肢 | `QuestionOption` | VO trong `SurveyQuestion` (chỉ cho câu chọn) |
| Phản hồi | 回答 | `SurveyResponse` | Aggregate riêng — 1 lượt trả lời của 1 người |
| Câu trả lời | 回答項目 | `SurveyAnswer` | Entity trong `SurveyResponse` (1 answer / 1 question) |
| Đối tượng trả lời | 回答対象 | `RespondentScope` | Ai được trả lời: người đăng ký / người điểm danh |
| Mở khảo sát | 公開 | `open` | DRAFT → OPEN |
| Đóng khảo sát | 締切 | `close` | OPEN → CLOSED (terminal) |

---

## 2. Ranh giới Aggregate

Hai aggregate tách biệt (giống cặp `Event` ↔ `Registration`):

```
┌─ Aggregate: Survey ─────────────────────────────────────┐
│  Survey (root)                                           │
│   ├─ eventId          : EventId   (tham chiếu context event) │
│   ├─ title, description : MultilingualText (VI/JP)       │
│   ├─ status           : SurveyStatus (state machine)     │
│   ├─ respondentScope  : RespondentScope                  │
│   ├─ createdBy        : UserId                           │
│   └─ questions[]      : SurveyQuestion  ◀ entity (order, type, required, options[]) │
└─────────────────────────────────────────────────────────┘
        │ tham chiếu bằng ID (KHÔNG nằm trong aggregate)
        ▼
┌─ Aggregate: SurveyResponse ─────────────────────────────┐
│  SurveyResponse (root)  — ẩn danh với BTC                │
│   ├─ surveyId        : SurveyId                          │
│   ├─ respondentToken : RespondentToken  (HMAC, KHÔNG lộ danh tính) │
│   ├─ submittedAt     : Date                             │
│   └─ answers[]       : SurveyAnswer  ◀ entity (questionId + value theo type) │
└─────────────────────────────────────────────────────────┘
```

**Quyết định ranh giới:**
- ✅ **Câu hỏi nằm TRONG `Survey`**: invariant "≥1 câu hỏi mới mở được", "chỉ sửa câu hỏi khi DRAFT" phải nhất quán tức thời với Survey.
- ❌ **`SurveyResponse` nằm NGOÀI**: số lượng lớn, vòng đời độc lập, ghi (submit) tách khỏi đọc (results) → aggregate riêng, chỉ giữ `surveyId`.
- ❌ **Không lưu số lượt trả lời trong `Survey`**: tránh contention; đếm khi tổng hợp kết quả (read side).
- 🕶️ **Ẩn danh với BTC (chốt 2026-07-02):** response **KHÔNG lưu `respondentId`/`eventId`**. Chỉ lưu `respondentToken = HMAC(secret, surveyId + userId)`:
  - Chặn gửi trùng: unique `(surveyId, respondentToken)` (INV-R3).
  - Kiểm tra diện trả lời: dùng `userId` **tức thời** lúc submit (cross-context query), **không lưu**.
  - `eventId` để tính tỷ lệ phản hồi → lấy từ `Survey` (không cần lưu trên response).
  - Token không đảo ngược ra `userId` → BTC xem kết quả không suy ra danh tính.

---

## 3. Value Objects & Entities

| VO/Entity | Thuộc tính | Invariant |
|-----------|-----------|-----------|
| `SurveyId` | uuid | — |
| `MultilingualText` | `{ vi: string; ja?: string }` | `vi` bắt buộc *(tái dùng từ shared-kernel)* |
| `QuestionType` | enum: `RATING`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TEXT` | — |
| `RespondentScope` | enum: `REGISTRANTS`, `ATTENDEES` | — |
| `SurveyStatus` | enum + bảng chuyển trạng thái | chỉ chuyển theo state machine |
| `QuestionOption` | `{ key: string; label: MultilingualText }` | `key` duy nhất trong 1 câu hỏi |
| `SurveyQuestion` (entity) | `id, order, type, prompt: MultilingualText, required: boolean, options: QuestionOption[]` | câu `*_CHOICE` cần **≥2** options; câu `RATING`/`TEXT` **không** có options; `order` duy nhất |
| `SurveyAnswer` (entity) | `questionId` + **đúng 1** trong: `ratingValue:1..5` \| `choiceKeys:string[]` \| `textValue:string` | giá trị phải khớp `QuestionType` của câu hỏi |
| `RespondentToken` | `value: string` (hex HMAC-SHA256) | `= HMAC(secret, surveyId + ':' + userId)`; tất định theo (survey,user); không đảo ngược |
| `ResponseRate` (read) | `{ responded: number; eligible: number; rate: number }` | `rate = responded / eligible` (0 nếu eligible=0) |

---

## 4. State Machine (`SurveyStatus`)

```
DRAFT ──open──▶ OPEN ──close──▶ CLOSED
  │
  └─ (chỉ ở DRAFT) addQuestion / updateQuestion / removeQuestion
```
- `open`: chỉ từ `DRAFT`, yêu cầu **≥1 câu hỏi** (INV-S3). Sau khi OPEN **không sửa câu hỏi** (bảo toàn tính nhất quán của phản hồi đã gửi).
- `close`: chỉ từ `OPEN`.
- Terminal: `CLOSED`. Không mutate trên `CLOSED`.
- **Nhận phản hồi** (`SurveyResponse`) chỉ hợp lệ khi survey `OPEN`.

---

## 5. Invariants

### Aggregate `Survey`
| Mã | Quy tắc |
|----|---------|
| INV-S1 | `title.vi` bắt buộc. |
| INV-S2 | Chỉ **thêm/sửa/xóa câu hỏi khi `DRAFT`**. |
| INV-S3 | Phải có **≥1 câu hỏi** trước khi `open`. |
| INV-S4 | Câu `SINGLE_CHOICE`/`MULTIPLE_CHOICE` cần **≥2** lựa chọn; `key` lựa chọn duy nhất trong câu. |
| INV-S5 | Chuyển trạng thái hợp lệ theo state machine (INV-S state machine §4). |

### Aggregate `SurveyResponse`
| Mã | Quy tắc |
|----|---------|
| INV-R1 | Mỗi `questionId` **required** phải có answer; answer chỉ trỏ tới câu hỏi thuộc survey. |
| INV-R2 | Giá trị answer **khớp `QuestionType`**: `RATING`→`ratingValue` 1..5; `SINGLE_CHOICE`→đúng 1 `choiceKey` hợp lệ; `MULTIPLE_CHOICE`→≥1 `choiceKey` hợp lệ; `TEXT`→`textValue` không rỗng (nếu required). |
| INV-R3 | **1 người / 1 khảo sát**: unique `(surveyId, respondentToken)` — chặn gửi trùng (409). Token ẩn danh, không lưu danh tính. |

> Invariant định-nghĩa-lại (INV-R1/R2) cần **ảnh chụp câu hỏi của Survey** tại thời điểm submit → application handler nạp `Survey` (hoặc read model câu hỏi) để validate trước khi tạo `SurveyResponse`. Aggregate `SurveyResponse` tự bảo vệ INV-R3 (không trùng) và cấu trúc answer; tính hợp lệ theo bộ câu hỏi do handler kiểm bằng dữ liệu Survey truyền vào (không import chéo aggregate).

---

## 6. Domain Events

| Event | Khi nào | Ai subscribe |
|-------|---------|--------------|
| `SurveyCreated` | tạo nháp | (projection read model) |
| `SurveyOpened` | mở khảo sát | **Notification** (mời phản hồi — FR-SRV-10, opt-out), Calendar/None |
| `SurveyClosed` | đóng khảo sát | (projection) |
| `SurveyResponseSubmitted` | gửi phản hồi | (projection / thống kê) |

Side-effect ngoài (ChatWork) đi qua **Transactional Outbox** → `@OnEvent('SurveyOpened')` trong context `notification`, tái dùng `NotificationPreference` (opt-out) đã có.

---

## 7. Cross-context contracts (không import chéo module)

Tái dùng cơ chế `libs/contracts/*` chạy trên `QueryBus` (giống budget/report):

| Contract query | Ở context | Dùng để | Trả về |
|----------------|-----------|---------|--------|
| `IsEventOrganizerQuery(eventId, userId)` | `event` *(đã có)* | Ủy quyền BTC: tạo/mở/đóng survey + xem kết quả | `boolean` (kèm phân biệt event không tồn tại → 404) |
| **`IsEventParticipantQuery(eventId, userId)`** | `participation` *(đã có — thêm ở PR #12)* | Kiểm tra diện trả lời (FR-SRV-05) | `{ registered: boolean; checkedIn: boolean }` |
| `GetEventParticipationStatsQuery(eventId)` | `participation` *(đã có)* | Mẫu số **tỷ lệ phản hồi** (FR-SRV-09) | `{ registered, cancelled, checkedIn, individual, team, checkInRate }` |

> `IsEventParticipantQuery` đã được bổ sung trong context `participation` (handler `is-event-participant` đọc thẳng DataSource theo `eventId+userId`). Đối chiếu `respondentScope`: `REGISTRANTS` cần `registered=true`; `ATTENDEES` cần `checkedIn=true`. Chi tiết: [`participation-aggregate.md`](./participation-aggregate.md).

---

## 8. Ports

```ts
// modules/survey/domain/ports/out/survey.repository.ts
export interface SurveyRepository {
  nextId(): SurveyId;
  findById(id: SurveyId): Promise<Survey | null>;
  save(survey: Survey): Promise<void>;   // state + domain events → outbox trong 1 transaction
}
export const SURVEY_REPOSITORY = Symbol('SURVEY_REPOSITORY');

// modules/survey/domain/ports/out/survey-response.repository.ts
export interface SurveyResponseRepository {
  nextId(): SurveyResponseId;
  existsBySurveyAndToken(surveyId: SurveyId, token: RespondentToken): Promise<boolean>; // INV-R3
  countBySurvey(surveyId: SurveyId): Promise<number>;   // tử số tỷ lệ phản hồi (read side có thể dùng riêng)
  save(response: SurveyResponse): Promise<void>;
}
export const SURVEY_RESPONSE_REPOSITORY = Symbol('SURVEY_RESPONSE_REPOSITORY');
```

---

## 9. Slices (use cases) & Endpoints (prefix `/v1`)

### Write (commands)
| Slice | Endpoint | Authz | Ghi chú |
|-------|----------|-------|---------|
| `create-survey` | `POST /events/:eventId/surveys` | BTC (`IsEventOrganizerQuery`) | body: title/description + questions[]; tạo `DRAFT` |
| `open-survey` | `POST /surveys/:id/open` | BTC | INV-S3 (≥1 câu hỏi) → raise `SurveyOpened` |
| `close-survey` | `POST /surveys/:id/close` | BTC | OPEN→CLOSED |
| `submit-response` | `POST /surveys/:id/responses` | người thuộc diện (`IsEventParticipantQuery` + `respondentScope`) | 409 nếu trùng / không OPEN; 400 nếu answer sai; 403 ngoài diện |

*(MVP gộp câu hỏi vào `create-survey`. Nếu cần chỉnh sau: thêm `add-question`/`remove-question` — chỉ khi `DRAFT`.)*

### Read (queries — đọc thẳng DataSource, bypass domain)
| Slice | Endpoint | Authz | Trả về |
|-------|----------|-------|--------|
| `get-survey-detail` | `GET /surveys/:id` | người thuộc diện / BTC | survey + câu hỏi (để điền); **không** kèm phản hồi |
| `list-event-surveys` | `GET /events/:eventId/surveys` | BTC / participant | BTC thấy tất cả; participant chỉ thấy `OPEN` |
| `get-survey-results` | `GET /surveys/:id/results` | **chỉ BTC** (`IsEventOrganizerQuery`) | tổng hợp theo câu hỏi (rating avg+phân bố / đếm lựa chọn / danh sách text) + `responded` + `ResponseRate` |

**Business error → HTTP** (map trong controller qua `throwSurveyHttpError`, khớp `libs/exceptions`):
`SURVEY.NOT_FOUND`→404 · `SURVEY.FORBIDDEN`→403 · `SURVEY.NOT_OPEN`→409 · `SURVEY.ALREADY_RESPONDED`→409 · `SURVEY.INVALID_ANSWER`/`SURVEY.INVALID_QUESTION`→400 · `SURVEY.INVALID_STATE`→409.

---

## 10. Cấu trúc thư mục module `survey`
```
modules/survey/
├─ domain/
│  ├─ model/        survey.aggregate.ts · survey-question.ts · survey-response.aggregate.ts · survey-answer.ts
│  │               value-objects: survey-status.ts · question-type.ts · respondent-scope.ts · question-option.ts
│  ├─ events/       survey-created.ts · survey-opened.ts · survey-closed.ts · survey-response-submitted.ts
│  └─ ports/out/    survey.repository.ts · survey-response.repository.ts
├─ application/
│  ├─ commands/     create-survey.* · open-survey.* · close-survey.* · submit-response.*
│  └─ queries/      get-survey-detail.* · list-event-surveys.* · get-survey-results.*
├─ adapters/
│  ├─ in/rest/      survey.controller.ts · survey-response.controller.ts (Google SSO guard, i18n)
│  └─ out/persistence/  survey.repository.postgres.ts · survey.orm-entity.ts · survey-question.orm-entity.ts
│                       survey-response.repository.postgres.ts · survey-response.orm-entity.ts · *.mapper.ts · *.read-model.ts
└─ survey.module.ts
```
+ Migration TypeORM: bảng `surveys`, `survey_questions`, `survey_responses`, `survey_answers` (unique `(survey_id, respondent_token)`).
+ Cross-context (đã có): `IsEventParticipantQuery` (contract trong `libs/contracts/participation/` + handler trong context `participation`).
+ Config **mới**: `SURVEY_RESPONDENT_SALT` (secret HMAC cho token ẩn danh) trong `libs/config` (zod) — bắt buộc ở prod.

---

## 11. Điểm cần chốt trước/khi code
- [x] **Ẩn danh với BTC?** ✅ **Chốt (2026-07-02): ẩn danh.** Lưu `respondentToken=HMAC(secret,surveyId+userId)`, không lưu danh tính; `get-survey-results` chỉ trả tổng hợp.
- [ ] **Nhiều khảo sát / sự kiện**: MVP cho phép nhiều; có ràng buộc đúng 1 không?
- [ ] **Sửa phản hồi**: MVP khóa sau khi gửi (không có `update-response`).
- [ ] **Gắn kết quả khảo sát vào `GET /events/:id/report`** (FR-POST-04) — làm sau khi context survey ổn định (thêm 1 cross-context query `GetSurveyResultsSummaryQuery`).
- [ ] **Tự sinh câu hỏi mặc định** khi `EventCompleted`? (tương lai — hiện BTC tạo thủ công.)

---
*Bước kế tiếp đề xuất: dựng slice `create-survey` xuyên hết các tầng (walking skeleton của context), rồi `open`/`submit-response`/`get-results`.*
