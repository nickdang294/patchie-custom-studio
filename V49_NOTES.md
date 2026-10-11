# Patchie v49 — Sửa gợi ý patch và mẫu phối

## Thay đổi từ v48

- Patch trong hàng gợi ý không biến mất và không bị khóa sau khi chọn. Khách có thể bấm lại để thêm nhiều bản của cùng patch; giới hạn 12 patch hiện có vẫn giữ nguyên.
- **Gợi ý thêm patch** nằm ngay dưới hàng patch, cập nhật theo patch chọn gần nhất, ưu tiên các lựa chọn chưa có trong lượt đang hiển thị. Không gọi API mẫu phối. Số lựa chọn thay thế phụ thuộc dữ liệu và quy tắc hiện có.
- **Gợi ý thêm mẫu phối** nằm dưới phần mẫu phối và chỉ cập nhật phần đó. Sau khi tải hết kết quả cho bộ patch hiện tại, nút được khóa đến khi bộ patch thay đổi; lỗi tải vẫn cho phép thử lại.
- Hai phần dùng trạng thái riêng nhưng cùng dữ liệu hiển thị trên desktop và mobile. Lần tải đầu có thể bổ sung patch từ mẫu phối, đồng thời giữ các thẻ đã hiển thị.
- Mẫu phối bắt đầu thu gọn. Khi có kết quả, khách bật toggle để xem. Khi bấm làm mới, phần thẻ thu gọn ngay trong thao tác; dữ liệu trả về không tự mở khung. Đây là thay đổi có chủ đích để tránh đẩy preview xuống sau khi chờ mạng.
- Khi không có mẫu phối, toggle luôn tắt và bị khóa, chỉ hiện thông báo gọn. Không giữ khung thẻ rỗng. Lỗi tải có nút thử lại.

## CLS / LCP / INP

- Giữ chiều cao hàng patch và dòng trạng thái ổn định trong lúc tải; không tự mở phần mẫu phối khi API trả về.
- Giữ server render catalog, hero và base image, font cục bộ, ưu tiên tải ảnh base và trì hoãn tải các mặt còn lại của v48.
- Giữ cập nhật zoom/pan bằng requestAnimationFrame; không tính lại thứ tự gợi ý sau mỗi lần thêm bản sao patch.
- Giữ chống gọi trùng, hủy request cũ và bỏ phản hồi không còn đúng với sản phẩm/bộ patch hiện tại.

## Kiểm tra

- Production build và quét tham chiếu JS/JSX không định nghĩa: đạt.
- 15 kiểm tra trình duyệt với dữ liệu demo và phản hồi mẫu phối giả lập: đạt. Bao gồm thêm cùng patch hai lần, giữ DOM thẻ, hai nút độc lập, kết quả rỗng, lỗi/thử lại, phản hồi cũ, đổi tab, popup, zoom và desktop.
- Với API chậm 750 ms, vị trí preview trong tài liệu là 976.375 px cả khi đang tải lẫn sau khi có kết quả; lần làm mới cũng không đổi vị trí.
- Không truy cập dữ liệu Supabase production, không gửi đơn hàng. Số đo cục bộ này không phải chỉ số CLS/LCP/INP ngoài thực tế; cần xem lại số đo sau khi deploy.

## Deploy

ZIP chứa toàn bộ source v49. Deploy bằng quy trình Vercel đang dùng, giữ nguyên biến môi trường. Không cần migration database hoặc upload lại ảnh. Các thay đổi chính nằm trong `app/studio-client.jsx`, `app/components/design-suggestions.jsx`, `lib/hooks/use-suggestions.js`, `app/globals.css`.
