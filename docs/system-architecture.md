# TÀI LIỆU KIẾN TRÚC HỆ THỐNG VÀ CƠ SỞ DỮ LIỆU - J-BRAIN

**Tên dự án:** J-Brain (AI-Powered Japanese SRS)
**Nền tảng:** Web Application
**Định vị:** Tối giản (Minimalist), Offline-first, Tự động hóa Flashcard bằng Local AI.

---

## 1. TỔNG QUAN KIẾN TRÚC KỸ THUẬT (TECH STACK)

* **Frontend:** React (Vite), Tailwind CSS, shadcn/ui. Tối giản, tập trung Typography, tone màu Trắng/Đen/Xám/Xanh/Đỏ.
* **Backend:** Spring Boot 3, Spring AI, Spring Data JPA.
* **Database:** PostgreSQL kèm pgvector (cho AI/RAG) và pg_trgm (cho Fuzzy Search).
* **AI Engine:** LM Studio chạy trên Host OS, gọi qua Spring AI.
  * **Model thực tế:** Qwen 3 4B-Instruct (GGUF, lượng tử hóa Q4_K_M).
  * **Ràng buộc:** Nằm trọn trong 4GB VRAM của GPU RTX 3050.
* **Deployment:** Docker Compose.

---

## 2. KIẾN TRÚC THƯ MỤC

Hệ thống được tổ chức theo cấu trúc Monorepo để dễ dàng quản lý version và đóng gói:

```text
J-BRAIN_WORKSPACE/
├── client/                 # Frontend: React, Vite, Tailwind CSS
├── db/                     # Hạ tầng Database
│   ├── Dockerfile
│   └── init.sql            # Script khởi tạo DDL
├── docs/                   # Tài liệu dự án (PRD, Architecture, Prompts)
├── docker-compose.yml      # Đóng gói toàn bộ hạ tầng cục bộ
└── server/                 # Backend: Spring Boot 3
    ├── pom.xml             
    ├── data/               
    │   ├── raw/            # File JSON gốc của Jitendex
    │   └── cleaned/        # Dữ liệu sạch sau ETL
    └── src/main/java/com/trandnquang/j_brain/
        ├── JBrainApplication.java
        ├── ai/             # RAG & AI Context Generator
        └── etl/            # Luồng Extract-Transform-Load dữ liệu
```

---

## 3. QUYẾT ĐỊNH KIẾN TRÚC (ARCHITECTURE DECISIONS)

* RAG Optimization (Chuẩn bị Dữ liệu Ngữ cảnh): Tránh tràn VRAM (Giới hạn 4GB) bằng cách không nhồi toàn bộ JSON vào Prompt. Backend chỉ query cột clean_meaning từ Postgres để nạp vào Llama 3 / Qwen 3.
* ETL Isolation: Tách biệt hoàn toàn code nạp từ điển (chạy qua profile Spring riêng) khỏi code Runtime. Data JSON dung lượng lớn được đưa vào .gitignore.
* SRS Partial Indexing: Thuật toán SM-2 quét thẻ đến hạn mỗi ngày thông qua Partial Index WHERE next_review_date <= NOW(). Giảm tải cho DB từ $O(N)$ xuống $O(\log N)$.
