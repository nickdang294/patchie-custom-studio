# Patchie v49.1

- Tab Tự Phối ẩn toàn bộ phần Mẫu phối hợp gu trên mobile, gồm tiêu đề, toggle, trạng thái, thẻ và nút gợi ý thêm.
- Ẩn/hiện theo tab ngay trong lần render từ thao tác bấm; không chờ API, không thêm animation chiều cao.
- Kết quả API về khi đang Tự Phối không làm khung xuất hiện trở lại.
- Quay về Patchie Gợi Ý dùng lại dữ liệu và trạng thái toggle hiện có; đổi tab không gọi thêm API.
- Giữ các thay đổi v49 và tối ưu hiệu năng v48.

Triển khai toàn bộ source, giữ nguyên biến môi trường Vercel. Không cần migration database.
