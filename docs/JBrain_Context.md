# MENTEE CONTEXT & PROJECT MEMORY: J-BRAIN

## 1. MENTEE PROFILE (TRẦN ĐÌNH NHẬT QUANG)
- **Mục tiêu nghề nghiệp:** Kỹ sư Cầu nối (BrSE) tại Nhật Bản.
- **Mục tiêu học thuật:** Thi đạt JLPT N3 và tham gia thi đấu ICPC (tháng 3/2026).
- **Kỹ năng hiện tại:** Đã có nền tảng Java Backend (Spring Boot), SQL, đang học Cloud/DevOps. Đã có kinh nghiệm xử lý logic thuật toán cạnh tranh.
- **Phong cách làm việc yêu cầu:** Cần một Mentor "ruthless" (tàn nhẫn, nghiêm khắc), sẵn sàng chê bai nếu ý tưởng là rác, ép buộc stress-test mọi logic và kiến trúc cho đến khi đạt mức "bulletproof". Không được phép nhân nhượng hay mớm code (spoon-feeding).

## 2. PROJECT OVERVIEW: J-BRAIN (AI-Powered Japanese SRS)
- **Định vị:** Ứng dụng Web tạo Flashcard tự động bằng AI kết hợp thuật toán lặp lại ngắt quãng (Spaced Repetition System - SRS). Không phải từ điển đa năng.
- **Vấn đề giải quyết:** Tự động hóa việc tạo ví dụ ngữ cảnh thực tế (công sở, giao tiếp, anime) cho người học N3 thay vì ví dụ khô khan trong sách.
- **Phong cách UI:** Minimalist, "Global Basic" (chỉ dùng đen, trắng, xám, phẳng).

## 3. TECH STACK CHUẨN ĐÃ CHỐT
- **Frontend:** React (Vite) + Tailwind CSS + shadcn/ui.
- **Backend:** Spring Boot 3 + Spring AI + Spring Data JPA.
- **Database:** PostgreSQL kèm extension `pgvector` (để hỗ trợ Semantic Search AI sau này).
- **AI Engine:** Local LLM (Llama 3 / Qwen) chạy qua LM Studio/Ollama, expose API cho Spring Boot.
- **External API:** Jisho API (lấy nghĩa, Romaji, Furigana).
- **Deployment:** Docker Compose (tách biệt container cho DB, Server, Client).
- **Version Control & Automation:** Git, Makefile.

## 4. IN-SCOPE MVP (PHASE 1)
- **Smart Generation:** Người dùng nhập từ vựng (Romaji/Kanji) -> Backend gọi Jisho API lấy nghĩa -> Backend gọi Local AI ép sinh ra 3 câu ví dụ (Keigo, Daily, Anime) định dạng chuẩn JSON -> Lưu vào DB.
- **SRS Engine:** Implement thuật toán SuperMemo-2 (SM-2) bằng Java để tính toán `NextReviewDate` dựa trên đánh giá của user (Hard/Good/Easy).
- **Audio:** Dùng Web Speech API của trình duyệt (không dùng AI để tránh nặng hệ thống).
- **Out-of-scope (Tuyệt đối KHÔNG làm ở Phase 1):** Dịch bằng OCR, Voice-to-text, Vẽ tay Kanji, Hệ thống User Login đa người dùng.

## 5. CẤU TRÚC THƯ MỤC DỰ ÁN (ĐÃ KHỞI TẠO)
```text
j-brain/
├── client/          # React + Tailwind + shadcn/ui
├── server/          # Spring Boot + Spring AI
├── db/              # Postgres + pgvector (có Dockerfile riêng)
├── docs/            # Chứa file PRD, ERD, System Prompts
├── docker-compose.yml
└── Makefile