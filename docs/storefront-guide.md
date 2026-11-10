# Bộ sưu tập patch & Góc phối xinh

## Đăng nội dung
1. Admin → Nhóm nội dung: tạo nhóm, đặt thứ tự, hiện/ẩn nhóm. Ẩn nhóm chỉ ẩn bộ lọc; nội dung vẫn có thể xuất hiện trong Tất cả. Muốn ẩn nội dung, bỏ chọn Hiện trên website ở nội dung đó.
2. Admin → Bộ sưu tập patch: tạo bộ, chọn patch theo tên và số lượng, sắp thứ tự. 9 loại đầu tiên đại diện trên ảnh; chi tiết hiển thị đủ danh sách. Link Shopee là link cả bộ cố định. Ghi rõ nếu kèm phôi.
3. Chọn Khung thêu / Sticker vui / Tối giản và tông màu; Tạo ảnh xem trước → Lưu. Có thể upload ảnh riêng. Ảnh tự tạo sử dụng ảnh patch gốc, không vẽ lại. Thumbnail 560px (giảm 480px nếu cần); ảnh chi tiết 1200px. Không cần upload thêm ảnh cho chế độ tự động.
4. Admin → Góc phối xinh: chọn mẫu phối sẵn để tạo ảnh từ thumbnail hiện có và bật Custom từ mẫu này. Có thể gắn BST liên quan. Chọn link bán thành phẩm, bộ patch hay phôi để nút mua ghi đúng nội dung. Ảnh từ mẫu phối không phải ảnh chụp lifestyle.
5. Bỏ trống link Shopee sẽ ẩn nút mua. Nội dung mới mặc định là bản nháp; bật Hiện trên website khi sẵn sàng.

## Trải nghiệm khách
- Mỗi lần lấy 12 mục; lọc nhóm ở database. Chỉ tải ảnh lớn khi mở chi tiết. Nhớ nhóm/vị trí trong cùng tab trong 5 phút.
- Thử phối bộ → chọn phôi → xem số lượng đặt vừa → áp dụng. Không thu nhỏ patch để ép vừa. Giới hạn Workshop hiện tại 12 patch; patch không phù hợp/không khả dụng được báo. Bố cục tự xếp chỉ là điểm bắt đầu, khách cần điều chỉnh vị trí theo hình phôi.
- Thiết kế đang làm được giữ trong sessionStorage tối đa 24h, không lưu thông tin khách. Thay mẫu cần xác nhận nếu đã có patch.
- Đơn custom giữ luồng lấy mã rồi gửi Messenger/kênh riêng. Shopee dành cho sản phẩm/bộ có sẵn.
- Analytics ghi sự kiện `Shopee Click` kèm item_id/kind/location; đây là lượt nhấp, không phải doanh số Shopee.

## Kỹ thuật và phát hành
- Migration `20261110054609_storefront_collections.sql` đã áp dụng vào project Patchie; không chạy lại thủ công.
- Hai bảng mới bật RLS, không cấp quyền trực tiếp anon/authenticated. API công khai chỉ đọc mục active; API admin dùng requireAdmin trước thao tác service_role.
- Không sửa bảng kho, Notion, đơn custom hoặc dữ liệu đơn patch lịch sử. `/api/patch-orders` trả 410 cho đơn patch lẻ mới.
- Không có dữ liệu Góc phối xinh cũ trong settings lúc triển khai. Không tự tạo link bán hàng hay publish nội dung mẫu.
- Ảnh có đường dẫn phiên bản mới mỗi lần lưu, cache 1 năm. Giữ ảnh phiên bản cũ để tránh lỗi cache; cần dọn ảnh không còn dùng sau này nếu sửa nhiều.
- Kiểm tra: `node tests/storefront.mjs`, `npm run build`.
- Xem bản preview và đăng thử nội dung trước khi merge vào main. Nội dung dùng database chung; chỉ bật public khi muốn khách nhìn thấy sau phát hành.
