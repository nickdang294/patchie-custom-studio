# Patchie v50.1 — Gọn thẻ mẫu phối, làm nổi tên mẫu

Dựa trên v50, chỉ thay đổi phần trình bày trong `app/components/design-suggestions.jsx` và `app/globals.css`.

- Bỏ dòng đếm “N mẫu phối hợp gu” và dòng phụ dưới từng ảnh, bao gồm “Cùng sản phẩm · Cùng màu”. Thông tin độ trùng vẫn có trong popup xem mẫu.
- Tên mẫu 15 px, đậm 800, màu tím đậm trên nền kem riêng; tối đa hai dòng và có vùng chiều cao cố định. Tên đầy đủ vẫn dùng trong popup và thuộc tính title.
- Ảnh và tên ghép thành một thẻ gọn; đổi đường viền tím sang màu trung tính. Bỏ khoảng trống 36 px của dòng đếm cũ.
- Giữ thông báo tải/lỗi/rỗng trong vùng kết quả cố định. Thông báo cho trình đọc màn hình không chiếm chỗ trong bố cục.
- Giữ nguyên cơ chế gợi ý, toggle, tab Tự Phối, cache dữ liệu, ảnh tải theo viewport và các tối ưu LCP/INP của v50. Không thêm thư viện, font hoặc ảnh mới.

Kiểm tra: build kết thúc mã 0; quét tham chiếu chưa định nghĩa đạt. 10 kiểm tra trình duyệt đạt, gồm tên dài trên mobile 320 px, bỏ đúng ghi chú, tải thumbnail theo viewport, đổi tab, trạng thái tải/rỗng và không có lỗi runtime. Với API giả lập chậm 750 ms, vị trí preview là 1228.375 px cả khi tải lẫn khi có kết quả.

Đã xem ảnh chụp giao diện mobile. Kiểm tra dùng dữ liệu demo, không truy cập Supabase production hoặc gửi đơn. Các số CLS/LCP/INP thực tế vẫn cần theo dõi sau deploy.

Deploy toàn bộ ZIP thay v50, giữ biến môi trường. Không cần đổi database hay tải lại ảnh.
