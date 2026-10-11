# Patchie v50 — Mẫu phối cùng base/màu và khung ổn định

Bản đầy đủ dựa trên v49.1. Những hành vi dưới đây thay thế ghi chú cũ về tự tắt/thu gọn khung mẫu phối.

## Hành vi

- Mỗi `product_id` tương ứng biến thể sản phẩm/màu cụ thể. Chỉ trả mẫu đang hoạt động của đúng biến thể đó.
- Xếp mẫu theo số patch trùng giảm dần, sau đó theo ưu tiên admin và tên. Bổ sung mẫu không trùng để trả tối đa 9 mẫu hợp lệ. Có ít nhất 9 mẫu hợp lệ thì trả đủ 9; không loại theo `min_matches` nữa.
- Mẫu chứa patch bị ẩn, hết hàng, chưa phát hành hoặc không tồn tại vẫn bị loại. Mẫu không có placement cũng bị loại.
- Admin bỏ ô ngưỡng patch trùng và giải thích cách ưu tiên mới. Giữ cột `min_matches` trong database để tương thích, không cần migration.
- Lần gợi ý đầu, toggle mặc định bật. Khung có chiều cao cố định trong lúc tải, có kết quả, rỗng hoặc lỗi. Khi rỗng, giữ toggle bật và hiện “Chưa có mẫu phối sẵn.”
- Làm mới không tự đóng khung. Khách tắt toggle thì giữ lựa chọn đó khi thêm patch/làm mới. Chọn Tự Phối ẩn toàn bộ phần mẫu phối; quay lại dùng trạng thái hiện có.
- Hai nút gợi ý patch/mẫu phối độc lập. Patch đã chọn vẫn ở hàng gợi ý để thêm bản sao.

## Hiệu năng và egress

- Giữ đường tải catalog/hero/base image server-rendered, font cục bộ và ưu tiên ảnh base của v48. Không thêm tải mẫu phối vào lần tải trang đầu.
- Khung skeleton, ảnh, thông báo rỗng và lỗi có cùng chiều cao. Dòng trạng thái và nút có kích thước ổn định; dữ liệu về không tự đẩy preview.
- IntersectionObserver chỉ gán URL thumbnail khi ảnh đi vào vùng nhìn thấy, tính cả phần bị cắt trong hàng cuộn ngang. Phần desktop ẩn trên mobile không tải thumbnail. Dùng ảnh thumbnail, giải mã bất đồng bộ, ưu tiên thấp; không preload ảnh patch gốc chỉ để hiện thẻ mẫu.
- URL thumbnail giữ nguyên. Cache trình duyệt phụ thuộc header từ nơi lưu ảnh; các URL mới do admin cập nhật vẫn tải ảnh mới.
- Cache dữ liệu mô tả trong phiên, theo đúng sản phẩm và bộ patch, tối đa 20 kết quả / 60 giây. Quay lại bộ patch vừa dùng có thể không cần gọi API. Bấm làm mới/thử lại chủ động bỏ qua cache. Tình trạng tồn kho có thể trễ tối đa khoảng thời hạn cache khi dùng lại kết quả.
- API chỉ lấy các trường cần thiết và giảm từ 4 xuống tối đa 3 truy vấn database cho mỗi yêu cầu hợp lệ. Chỉ gửi tối đa 9 mẫu về trình duyệt.
- Giữ chống request trùng, bỏ phản hồi cũ, memo hóa gợi ý và đường cập nhật zoom/pan bằng requestAnimationFrame.

## Kiểm tra

- Production build và quét tham chiếu chưa định nghĩa ở các file thay đổi: đạt.
- Kiểm tra thuật toán: đúng biến thể màu, không trùng vẫn đủ 9 mẫu nếu đủ dữ liệu, mẫu trùng đứng trước, đếm patch duy nhất, bỏ ngưỡng cũ, lọc mẫu/patch không hợp lệ: đạt.
- 15 kiểm tra trình duyệt: đạt, gồm bật sẵn, hình học sau tải chậm, tải thumbnail theo viewport, thêm patch trùng, hai nút độc lập, refresh, tùy chọn toggle, rỗng, cache, lỗi/thử lại, Tự Phối, popup và không có lỗi runtime.
- Với API giả lập chậm 750 ms: preview ở vị trí 1264.375 px khi tải và khi có kết quả (không đổi). Lúc đầu chỉ 2/9 thumbnail được yêu cầu; cuộn ngang tải thêm các ảnh mới xuất hiện.
- Dữ liệu kiểm tra là demo và phản hồi giả lập, không truy cập Supabase production hoặc gửi đơn. Đây không phải số CLS/LCP/INP thực tế từ người dùng; cần đo lại sau deploy.

## Deploy

Deploy toàn bộ ZIP v50 bằng quy trình Vercel hiện có, giữ biến môi trường. Không cần migration hoặc upload lại ảnh. Các tệp thay đổi: `app/studio-client.jsx`, `app/components/design-suggestions.jsx`, `lib/hooks/use-suggestions.js`, `lib/product-design-recommendations.js`, `app/api/product-designs/route.js`, `app/admin/product-designs/page.jsx`.
