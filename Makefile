# Makefile
.PHONY: build up down logs clean

# Khởi động toàn bộ hệ thống
up:
	docker-compose up -d

# Dừng hệ thống
down:
	docker-compose down

# Build lại các image (sau khi sửa code)
build:
	docker-compose build

# Xem log của server
logs-server:
	docker-compose logs -f server

# Dọn dẹp hệ thống và volume (Xóa sạch DB)
clean:
	docker-compose down -v
	rm -rf db_data/