# Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)
## Hệ thống Quản lý Sự kiện Nội bộ Công ty

| | |
|---|---|
| **Phiên bản** | 0.3 (Draft) |
| **Ngày** | 2026-07-02 |
| **Trạng thái** | Bản nháp + chi tiết hóa **Thi đấu thể thao (Phase 2)** |
| **Phạm vi** | MVP (Phase 1a/1b) + chi tiết Phase 2 (Thi đấu thể thao) |

> **Nhật ký thay đổi**
> - v0.3 (2026-07-02): brainstorm + chi tiết hóa tính năng **Thi đấu thể thao** (§3.9 FR-CMP-01…12) — 3 thể thức (loại trực tiếp / vòng tròn / vòng bảng→knockout), competitor suy ra từ đăng ký, điểm generic, chỉ BTC nhập tỉ số. Bổ sung mô hình dữ liệu Tournament/Competitor/Match (§6), lộ trình Phase 2 (§7), câu hỏi mở (§8). Tactical design: [`docs/design/competition-aggregate.md`](design/competition-aggregate.md).
> - v0.2 (2026-07-02): chi tiết hóa tính năng **Khảo sát sau sự kiện** (§3.6.1 FR-SRV-01…10) trước khi triển khai; bổ sung mô hình dữ liệu Survey/Question/Response/Answer (§6) và câu hỏi mở về ẩn danh (§8). Tactical design: [`docs/design/survey-aggregate.md`](design/survey-aggregate.md).
> - v0.1 (2026-06-30): bản nháp đầu từ phiên brainstorm 6 phần.

---

## 1. Giới thiệu

### 1.1 Mục đích
Tài liệu mô tả yêu cầu cho phần mềm quản lý sự kiện nội bộ của công ty, giúp **bộ phận tổ chức (HR/Admin)** và **nhân viên** quản lý toàn bộ vòng đời sự kiện: từ lập kế hoạch, công bố, đăng ký, điểm danh đến tổng kết sau sự kiện.

### 1.2 Phạm vi
- **Trong phạm vi (Phase 1):** sự kiện nội bộ (họp, đào tạo), team building/du lịch; quản lý vòng đời sự kiện, đăng ký, điểm danh, thông báo, sau sự kiện (khảo sát/ảnh/báo cáo), ngân sách.
- **Phase 2:** sự kiện thi đấu thể thao (cầu lông, phi tiêu, esport…) với bảng đấu/lịch thi đấu/tỉ số/BXH; quản lý công việc ban tổ chức.
- **Ngoài phạm vi:** cổng dành cho khách mời bên ngoài; quy trình phê duyệt nhiều cấp.

### 1.3 Đối tượng sử dụng tài liệu
Product Owner, đội phát triển, QA, bộ phận IT/HR của công ty.

### 1.4 Thuật ngữ
| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| **Ban tổ chức (BTC)** | Người tạo sự kiện + những người được họ mời đồng tổ chức. Quyền gắn theo **từng sự kiện**. |
| **Người tham gia** | Nhân viên đăng ký/tham dự sự kiện. |
| **Vòng đời sự kiện** | Nháp → Công bố → Đăng ký → Diễn ra → Tổng kết. |
| **SSO** | Đăng nhập một lần bằng tài khoản Google domain công ty. |

---

## 2. Mô tả tổng quan

### 2.1 Bối cảnh
Hệ thống là **web responsive + PWA** (cài như app, hỗ trợ push), xoay quanh hệ sinh thái **Google** (SSO, Calendar, Drive) và tích hợp **ChatWork** để thông báo. Hạ tầng dự kiến đặt trên **AWS**.

### 2.2 Vai trò người dùng
| Vai trò | Mô tả | Quyền chính |
|---------|-------|-------------|
| **Ban tổ chức** | Theo từng sự kiện | Tạo/sửa sự kiện, mời thành viên BTC, quản lý đăng ký, điểm danh, xem kết quả khảo sát, quản lý ngân sách, tổng kết |
| **Người tham gia** | Toàn bộ nhân viên | Xem, đăng ký (cá nhân/đội), tự điểm danh, gửi khảo sát, xem ảnh/tài liệu |

> **Lưu ý thiết kế:** Vai trò **gắn theo sự kiện**, không phải toàn cục. Một người có thể là BTC ở sự kiện A và người tham gia ở sự kiện B. Quyền *mời vào BTC* và quyền *chỉnh sửa sự kiện* nên tách bạch.

### 2.3 Giả định & Ràng buộc
- Nhân viên đều có **tài khoản Google domain công ty** → đăng nhập SSO.
- Công ty có **hệ thống thông tin HR** → đồng bộ danh sách nhân viên/phòng ban.
- Công cụ chat nội bộ là **ChatWork**.
- Giao diện **đa ngôn ngữ Việt – Nhật** (i18n từ đầu).
- **Không** có quy trình phê duyệt sự kiện.

---

## 3. Yêu cầu chức năng

### 3.1 Xác thực & Người dùng (Auth)
| Mã | Yêu cầu |
|----|---------|
| FR-AUTH-01 | Đăng nhập bằng **Google SSO** (domain công ty); chặn tài khoản ngoài domain. |
| FR-AUTH-02 | Đồng bộ thông tin nhân viên/phòng ban từ hệ thống HR. |
| FR-AUTH-03 | Hồ sơ người dùng: tên, phòng ban, ảnh, ngôn ngữ ưu tiên. |
| FR-AUTH-04 | Chuyển đổi ngôn ngữ giao diện **Việt ⇄ Nhật**. |

### 3.2 Quản lý sự kiện (Event)
| Mã | Yêu cầu |
|----|---------|
| FR-EVT-01 | Tạo sự kiện với: tên, loại (nội bộ/team building/du lịch), mô tả, thời gian, địa điểm, ảnh bìa. |
| FR-EVT-02 | Vòng đời trạng thái: **Nháp → Công bố → Mở đăng ký → Đang diễn ra → Đã kết thúc → Hủy/Hoãn**. |
| FR-EVT-03 | BTC mời thành viên khác vào ban tổ chức của **chính sự kiện đó**. |
| FR-EVT-04 | Chỉ thành viên BTC mới sửa được sự kiện; nhật ký thay đổi. |
| FR-EVT-05 | Hủy/dời sự kiện: đổi trạng thái **và** tự động gửi thông báo cho người đã đăng ký. |
| FR-EVT-06 | Cấu hình đăng ký: giới hạn số lượng, hạn chót đăng ký. |

### 3.3 Đăng ký tham gia (Registration)
| Mã | Yêu cầu |
|----|---------|
| FR-REG-01 | Đăng ký **linh hoạt**: cá nhân **hoặc** theo đội/nhóm (cấu hình theo sự kiện). |
| FR-REG-02 | Hủy đăng ký trước hạn chót. |
| FR-REG-03 | BTC xem/ xuất danh sách đăng ký; chốt danh sách. |
| FR-REG-04 | (Tùy chọn) Danh sách chờ khi vượt giới hạn. |

### 3.4 Điểm danh (Check-in)
| Mã | Yêu cầu |
|----|---------|
| FR-CHK-01 | Điểm danh qua **mã QR** (BTC quét hoặc người tham gia quét mã sự kiện). |
| FR-CHK-02 | **Tự điểm danh** trên app. |
| FR-CHK-03 | BTC **tick thủ công** trên danh sách. |
| FR-CHK-04 | (Tùy chọn) Ghi nhận thời gian/vị trí khi check-in. |
| FR-CHK-05 | Báo cáo có mặt/vắng mặt theo thời gian thực. |

### 3.5 Thông báo (Notification)
| Mã | Yêu cầu |
|----|---------|
| FR-NOT-01 | Thông báo **in-app** (chuông). |
| FR-NOT-02 | Gửi thông báo qua **ChatWork** (sự kiện mới, nhắc lịch, thay đổi/hủy). |
| FR-NOT-03 | **Push PWA** (Web Push) — *Phase 1b*. |
| FR-NOT-04 | Cấu hình loại thông báo người dùng muốn nhận. |

### 3.6 Sau sự kiện (Post-event)

#### 3.6.1 Khảo sát sau sự kiện (Survey) — *Phase 1, đang triển khai*
> Tactical design chi tiết (aggregate/VO/state machine/slice/endpoint): [`docs/design/survey-aggregate.md`](design/survey-aggregate.md).

| Mã | Yêu cầu |
|----|---------|
| FR-SRV-01 | **BTC tạo khảo sát** cho một sự kiện: tiêu đề + mô tả (song ngữ VI/JA) + danh sách câu hỏi. Chỉ thành viên BTC của **chính sự kiện đó** được tạo (ủy quyền qua cross-context query, không thấy → 404, không phải BTC → 403). |
| FR-SRV-02 | Hỗ trợ nhiều **loại câu hỏi**: thang điểm (`RATING` 1–5), chọn một (`SINGLE_CHOICE`), chọn nhiều (`MULTIPLE_CHOICE`), tự luận (`TEXT`). Mỗi câu hỏi có nhãn song ngữ, cờ **bắt buộc/không**, và thứ tự hiển thị. Câu hỏi dạng chọn phải có ≥2 lựa chọn. |
| FR-SRV-03 | Vòng đời khảo sát: **Nháp (`DRAFT`) → Đang mở (`OPEN`) → Đã đóng (`CLOSED`)**. Chỉ **thêm/sửa câu hỏi khi còn `DRAFT`**; phải có ≥1 câu hỏi mới mở được. |
| FR-SRV-04 | BTC **mở** khảo sát (bắt đầu nhận phản hồi) và **đóng** khi kết thúc thu thập. Không thao tác trên trạng thái `CLOSED` (terminal). |
| FR-SRV-05 | **Đối tượng trả lời** cấu hình theo khảo sát: `REGISTRANTS` (người đã đăng ký) hoặc `ATTENDEES` (chỉ người đã điểm danh). Người ngoài diện không gửi được (**403**). Kiểm tra qua cross-context query sang context `participation`. |
| FR-SRV-06 | Mỗi người trả lời **đúng một lần** cho mỗi khảo sát (gửi trùng → **409**). Chặn trùng bằng **token băm** `HMAC(secret, surveyId + userId)`, **không lưu danh tính** người trả lời. |
| FR-SRV-07 | Chỉ gửi được khi khảo sát đang **`OPEN`** (**409** nếu `DRAFT`/`CLOSED`); câu trả lời phải **khớp loại câu hỏi** và **trả lời đủ câu bắt buộc** (**400** nếu thiếu/sai kiểu/lựa chọn không hợp lệ). |
| FR-SRV-08 | **Khảo sát ẩn danh với BTC**: phản hồi lưu **không kèm danh tính** (chỉ token băm để chặn trùng). BTC **chỉ** xem **kết quả tổng hợp** (FR-SRV-09), **không** xem được ai trả lời gì. Người tham gia chỉ thấy khảo sát để điền + xác nhận đã gửi (NFR-03). |
| FR-SRV-09 | **Kết quả tổng hợp** theo từng câu hỏi: `RATING` → điểm trung bình + phân bố theo mức; `SINGLE`/`MULTIPLE_CHOICE` → số phiếu mỗi lựa chọn; `TEXT` → danh sách câu trả lời. Kèm **số lượt trả lời** và **tỷ lệ phản hồi** (trên tổng người thuộc diện — lấy từ context `participation`). |
| FR-SRV-10 | *(Tùy chọn)* Khi **mở khảo sát** → tự **thông báo** mời người thuộc diện phản hồi (qua outbox → ChatWork), tôn trọng setting **opt-out** của người dùng (tái dùng cơ chế `notification-preferences` đã có). |

#### 3.6.2 Ảnh/tài liệu & Báo cáo
| Mã | Yêu cầu |
|----|---------|
| FR-POST-03 | Lưu **ảnh/tài liệu** sự kiện → upload vào **Google Drive công ty** qua API; hệ thống gắn link/album. |
| FR-POST-04 | **Báo cáo tổng kết**: số đăng ký, số tham dự, tỷ lệ, kết quả khảo sát *(đã có `GET /events/:id/report` cho phần đăng ký + ngân sách; sẽ mở rộng gắn kết quả khảo sát)*. |

### 3.7 Ngân sách (Budget) — *Phase 1b*
| Mã | Yêu cầu |
|----|---------|
| FR-BUD-01 | Lập **dự toán** theo hạng mục. |
| FR-BUD-02 | Ghi nhận **chi thực tế**, đính kèm **hóa đơn**. |
| FR-BUD-03 | **So sánh** dự toán vs thực tế (chênh lệch). |
| FR-BUD-04 | Quyết toán & xuất báo cáo chi phí. |

### 3.8 Lịch (Calendar)
| Mã | Yêu cầu |
|----|---------|
| FR-CAL-01 | Đồng bộ sự kiện vào **Google/Outlook Calendar** cá nhân khi đăng ký, có nhắc nhở. |
| FR-CAL-02 | Xem lịch sự kiện trong app. |

### 3.9 Thi đấu thể thao (Competition) — *Phase 2, **đã code** (PR #13 merged)*
> Tactical design chi tiết (aggregate/VO/state machine/thuật toán seed/slice/endpoint): [`docs/design/competition-aggregate.md`](design/competition-aggregate.md).
> Áp dụng cho sự kiện thi đấu nội bộ: cầu lông, phi tiêu, bóng bàn, esport… Là **bounded context riêng** (`competition`) gắn với một sự kiện.

| Mã | Yêu cầu |
|----|---------|
| FR-CMP-01 | **BTC tạo giải đấu** cho một sự kiện: tên (song ngữ VI/JA) + **thể thức** + cấu hình. Chỉ thành viên BTC của **chính sự kiện đó** được tạo/quản lý (ủy quyền qua cross-context query; không thấy → 404, không phải BTC → 403). |
| FR-CMP-02 | Hỗ trợ 3 **thể thức**: **loại trực tiếp** (`SINGLE_ELIM`), **vòng tròn** (`ROUND_ROBIN`), **vòng bảng + loại trực tiếp** (`GROUP_KNOCKOUT`). *(bỏ double-elim ở Phase 2.)* |
| FR-CMP-03 | **Đấu thủ/đội suy ra từ đăng ký sự kiện**: BTC promote một registration (`participation`) thành **competitor**; hệ thống lưu snapshot tên hiển thị, không nhập lại danh tính. Chỉ registration hợp lệ của đúng sự kiện (sai → 400). |
| FR-CMP-04 | Vòng đời giải: **Nháp (`DRAFT`) → Đã sinh cặp (`SEEDED`) → Đang diễn ra (`IN_PROGRESS`) → Kết thúc (`COMPLETED`)** (+ `CANCELLED`). Chỉ **thêm/xóa competitor khi `DRAFT`**. |
| FR-CMP-05 | **Sinh cặp/lịch** (`seed`) theo thể thức, **tất định** theo thứ tự hạt giống: single-elim sinh cây (xử lý *bye* khi số đấu thủ không phải lũy thừa 2); round-robin sinh mọi cặp theo lượt; group→knockout chia bảng (rải kiểu rắn) rồi round-robin nội bảng. Cần đủ số đấu thủ tối thiểu (sai config/thiếu người → 400). |
| FR-CMP-06 | **Chỉ BTC nhập/sửa tỉ số** trận đấu (scoreA/scoreB + chi tiết tùy chọn). Điểm **generic** (không nhúng luật từng môn); elim **cấm hòa**, round-robin cho hòa. Nhập sai (âm/hòa ở elim) → 400; trận chưa sẵn sàng → 409. |
| FR-CMP-07 | **Tự tiến quân** (elim): ghi tỉ số → xác định người thắng → tự điền vào trận vòng sau; trận chỉ mở khi đủ 2 đấu thủ. |
| FR-CMP-08 | **Vòng bảng→knockout**: khi mọi trận vòng bảng có kết quả, BTC chuyển sang vòng loại; hệ thống lấy **top-K mỗi bảng** theo BXH, seed chéo bảng, sinh bracket loại trực tiếp. |
| FR-CMP-09 | **Bảng xếp hạng (BXH)** tính realtime từ tỉ số: số trận, thắng/hòa/thua, bàn thắng/thua, hiệu số, điểm (thắng 3/hòa 1). Tiebreak: điểm → hiệu số → tổng ghi → đối đầu. |
| FR-CMP-10 | **Xem bracket/lịch/BXH**: mọi nhân viên xem được sơ đồ giải, lịch đấu, tỉ số và BXH của sự kiện (read-only). |
| FR-CMP-11 | **Kết thúc giải** khi đủ trận → xác định **nhà vô địch** (winner trận chung kết elim / đầu BXH round-robin). |
| FR-CMP-12 | *(Tùy chọn)* Thông báo qua outbox → ChatWork khi **sinh cặp** (lịch đấu vòng 1), **sang vòng knockout**, và **có nhà vô địch** — tôn trọng setting opt-out (`notification-preferences`). *(Lịch/sân cho từng trận: `scheduledAt`/`venue` tùy chọn, chống trùng sân để Phase 2.1.)* |

---

## 4. Yêu cầu phi chức năng (NFR)

| Mã | Yêu cầu |
|----|---------|
| NFR-01 | **Nền tảng:** Web responsive + PWA (cài đặt, push, hoạt động tốt trên mobile). |
| NFR-02 | **Đa ngôn ngữ:** Việt – Nhật, i18n từ đầu. |
| NFR-03 | **Bảo mật:** OAuth2 Google, phân quyền theo sự kiện, kết quả khảo sát chỉ BTC truy cập. |
| NFR-04 | **Hiệu năng:** hỗ trợ nhiều sự kiện song song; thiết kế co giãn cho quy mô hỗn hợp. |
| NFR-05 | **Khả dụng:** giao diện đơn giản, nhân viên không kỹ thuật vẫn dùng được. |
| NFR-06 | **Triển khai:** Cloud (khả năng cao AWS) hoặc server nội bộ — kiến trúc không phụ thuộc nơi đặt. |

---

## 5. Tích hợp ngoài

| Hệ thống | Mục đích | Phase |
|----------|----------|-------|
| **Google OAuth (SSO)** | Đăng nhập domain công ty | 1a |
| **Google Calendar API** | Đồng bộ lịch cá nhân | 1a |
| **Google Drive API** | Lưu ảnh/tài liệu sự kiện | 1a |
| **ChatWork API** | Gửi thông báo | 1a |
| **Hệ thống HR** | Đồng bộ nhân viên/phòng ban | 1a/1b |

---

## 6. Mô hình dữ liệu (thực thể chính)

```
User (id, googleId, name, email, department, language)
Event (id, title, type, description, startAt, endAt, location, status, capacity, regDeadline)
EventOrganizer (eventId, userId, role)          # quan hệ BTC theo sự kiện
Registration (id, eventId, userId | teamId, status, registeredAt)
Team (id, eventId, name)                          # đăng ký theo đội
TeamMember (teamId, userId)
Checkin (id, eventId, userId, method, time, location)
Notification (id, userId, type, channel, content, status)
Survey (id, eventId, title, description, status, respondentScope, createdBy)      # DRAFT|OPEN|CLOSED · REGISTRANTS|ATTENDEES
SurveyQuestion (id, surveyId, order, type, prompt, required, options[])           # options[] chỉ dùng cho SINGLE/MULTIPLE_CHOICE
SurveyResponse (id, surveyId, respondentToken, submittedAt)                       # ẩn danh: token=HMAC(secret,surveyId+userId); unique (surveyId,respondentToken); KHÔNG lưu danh tính
SurveyAnswer (responseId, questionId, ratingValue | choiceKeys[] | textValue)     # đúng 1 loại giá trị theo QuestionType
Asset (id, eventId, driveFileId, url, type)       # ảnh/tài liệu trên Drive
Budget (id, eventId, item, planned, actual, invoiceUrl)   # Phase 1b
# --- Phase 2: Thi đấu thể thao ---
Tournament (id, eventId, name, format, status, stage, config, createdBy)   # SINGLE_ELIM|ROUND_ROBIN|GROUP_KNOCKOUT · DRAFT|SEEDED|IN_PROGRESS|COMPLETED|CANCELLED · stage=GROUP|KNOCKOUT (chỉ group→knockout) · config={numGroups,advancePerGroup,seedMethod}
Competitor (id, tournamentId, registrationId, seed, displayName, groupLabel)   # suy ra từ Registration; displayName=snapshot; groupLabel chỉ group→knockout
Match (id, tournamentId, round, groupLabel, stage, competitorA, competitorB, scoreA, scoreB, winner, status, nextMatchId, nextSlot, scheduledAt, venue, detail)   # PENDING|SCHEDULED|PLAYED|BYE · nextMatchId/nextSlot cho auto-advance (elim)
# Standing (BXH) KHÔNG lưu — tính realtime từ Match trên read side
```

---

## 7. Lộ trình phát hành

### 🟢 Phase 1a — Bản phát hành đầu tiên (MVP lõi)
- Google SSO + đồng bộ HR cơ bản
- Tạo/quản lý sự kiện theo vòng đời + ban tổ chức (mời thành viên)
- Đăng ký (cá nhân/đội) + điểm danh (QR + tự + thủ công)
- Thông báo **in-app + ChatWork**
- Sau sự kiện: khảo sát (chỉ BTC xem) + ảnh/tài liệu (Google Drive) + báo cáo tổng kết
- Đồng bộ Google Calendar
- Đa ngôn ngữ Việt – Nhật

### 🟡 Phase 1b
- Quản lý ngân sách (dự toán + chi thực tế + hóa đơn + quyết toán)
- Push PWA (Web Push)

### 🔵 Phase 2
- **Thi đấu thể thao** (context `competition` — *§3.9, **đã code — PR #13 merged***): 3 thể thức (loại trực tiếp / vòng tròn / vòng bảng→knockout), competitor suy ra từ đăng ký, sinh cặp/lịch, nhập tỉ số (chỉ BTC) + auto-advance, BXH realtime, nhà vô địch. ✅
- Quản lý công việc ban tổ chức (checklist/Kanban) — context `task` (làm sau thi đấu; không chờ credential ngoài)
- Phân quyền tạo sự kiện theo phòng ban (nếu cần — phụ thuộc **đồng bộ HR**, hoãn tới khi có credential)

---

## 8. Câu hỏi còn mở
- [ ] Quyền **tạo sự kiện** mở cho mọi nhân viên hay giới hạn? (tạm: mọi người đều tạo được)
- [ ] Mức độ đồng bộ HR (real-time vs định kỳ) và trường dữ liệu lấy về.
- [ ] Cơ chế xác thực gọi Google Drive: service account công ty hay OAuth từng người.
- [ ] Chính sách lưu trữ/bảo mật dữ liệu khi triển khai AWS vs server nội bộ (chờ IT).
- [x] **Khảo sát ẩn danh:** ✅ **Chốt (2026-07-02): ẩn danh với BTC.** Phản hồi lưu **token băm** `HMAC(secret, surveyId+userId)` thay danh tính → vẫn chặn gửi trùng + kiểm tra diện trả lời (dùng userId tức thời lúc submit, không lưu), BTC chỉ thấy tổng hợp.
- [ ] **Nhiều khảo sát / sự kiện:** MVP cho phép mỗi sự kiện có ≥1 khảo sát; có cần giới hạn đúng 1 hay phân loại (trước/sau) không?
- [ ] **Sửa phản hồi:** cho phép người trả lời sửa lại trước khi khảo sát đóng, hay khóa ngay sau khi gửi? (MVP: khóa sau khi gửi.)

### Thi đấu thể thao (Phase 2) — chốt từ brainstorm 2026-07-02
- [x] **Thể thức Phase 2:** ✅ single-elim + round-robin + group→knockout (**bỏ** double-elim).
- [x] **Nguồn đấu thủ:** ✅ suy ra từ `participation` (promote registration → competitor), không nhập lại danh tính.
- [x] **Ai nhập tỉ số:** ✅ chỉ BTC (tái dùng `IsEventOrganizerQuery`; chưa có vai trò trọng tài riêng).
- [x] **Mô hình điểm:** ✅ generic (scoreA/scoreB + winner), không nhúng luật từng môn; chi tiết set để ở field `detail` freeform.
- [ ] **Luật điểm round-robin:** MVP cố định thắng 3/hòa 1/thua 0 — có cần cấu hình?
- [ ] **`displayName` cá nhân:** chờ HR/user sync để có tên thật (MVP fallback `userId`).
- [ ] **Lịch/sân từng trận:** MVP `scheduledAt`/`venue` tùy chọn; chống trùng sân để **Phase 2.1**.
- [ ] **Sửa tỉ số sau khi đã tiến quân** (roll-back advance): MVP khóa khi trận kế đã sẵn sàng.
- [ ] **Gắn kết quả giải vào `GET /events/:id/report`:** thêm cross-context query sau khi context ổn định.

---
*Tài liệu sinh ra từ phiên brainstorm 6 phần. Cập nhật khi có quyết định mới.*
