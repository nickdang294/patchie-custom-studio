# Patchie v51 — Best-seller, Christmas & admin

## Nội dung đã cập nhật

- Popup best-seller ở Studio: 3 mẫu do shop chọn, thứ tự theo admin. Desktop dùng 3 card; mobile dùng các card gọn với ảnh bên trái. Ảnh có khung cố định và object-fit: contain.
- Bấm ảnh để mở chi tiết với nút Trước/Sau, Custom mẫu này và Shopee. Bấm Custom trên card cũng áp dụng trực tiếp, chuyển đúng base/màu, size duy nhất (nếu có), patch và góc xoay. Mẫu khác base sẽ xóa lịch sử undo của base cũ để tránh hoàn tác sang bố cục không tương thích.
- Link Shopee lấy từ từng design mẫu, không lấy từ sản phẩm base. Thiếu link thì nút mua chưa khả dụng.
- Popup hiện một lần mỗi phiên tab/tháng, sau khi trang tải và trình duyệt có thời gian rảnh. Không hiện lại khi khách xóa hết patch sau khi đã bắt đầu custom. Có nút đóng, Escape, click nền và nút đi thẳng vào tự phối; native dialog quản lý focus.
- Admin → Best-seller tháng này: tìm theo tên mẫu/base, chọn đủ 3 mẫu, đổi thứ tự, nhập tiêu đề và bật/tắt. Mẫu bị ẩn, thiếu thumbnail, patch hết hàng/coming soon hoặc không phù hợp base sẽ không được hiện. Nếu tình trạng mẫu thay đổi sau khi lưu thì popup có thể hiện ít hơn 3 mẫu; không có mẫu hợp lệ thì không mở popup.
- Gỡ quà tặng, tarot và giá patch miễn phí khỏi frontend, admin và API tạo đơn. Server bỏ qua cờ gift do client cũ gửi và luôn dùng giá patch hiện tại trong database. Đơn hàng đã lưu trước đây được giữ nguyên.
- Thay Halloween bằng Christmas nhẹ: màu thông, điểm nhấn berry, bông tuyết và cây thông CSS; không chạy vòng lặp hiệu ứng JavaScript. Bật/tắt tại Website & Christmas.
- Menu admin thống nhất trên các trang: Bán hàng / Sản phẩm / Cửa hàng / Thiết lập. Tách Thương hiệu & nội dung khỏi Website & Christmas; thêm tìm kiếm thư viện patch và dùng thumbnail/lazy loading ở các danh sách patch.

## Performance

Giữ cấu trúc v50.20: H1/logo trên server, màn hình chờ “Đang dán chút đáng yêu lên shop…”, cache catalog 30 giây và invalidation khi dữ liệu thay đổi. Best-seller không thêm truy vấn vào đường render server ban đầu; code/CSS và dữ liệu popup tải riêng, chỉ khi shop đã bật. Khung popup không đẩy nội dung trang; scrollbar-gutter có trong CSS ban đầu để hạn chế dịch chuyển khi khóa cuộn.

- CSS Studio: 129.902 → 115.497 bytes trước nén; gzip 24.806 → 22.235 bytes.
- CSS các dialog cũ: 28.941 → 17.463 bytes; gzip 6.394 → 4.166 bytes. Popup best-seller có stylesheet nhỏ riêng.
- Build trang /: first-load JS khoảng 126 → 123 kB.

Đây là số build, không phải điểm Lighthouse. Popup mới vẫn có ảnh cần tải; trên một số thiết bị nội dung popup có thể trở thành phần tử LCP. Cần đo lại trên deployment thật, cả phiên mở popup và phiên đã đóng popup. Không cam kết trước FCP/LCP/CLS hoặc INP từ các kiểm tra code.

## Cách upload và bật

1. Tạo nhánh mới từ main đang dùng v50.20 (ví dụ patchie-v51).
2. Giải nén ZIP, mở thư mục patchie-v51. Upload toàn bộ nội dung bên trong vào gốc repo — nơi có package.json. Đừng upload nguyên thư mục lồng thêm một cấp.
3. Xóa các file cũ đã nghỉ dùng nếu còn trong repo: app/pumpkin-spider.jsx, app/pumpkin-fireworks.jsx, app/bats-burst.jsx, app/hearts-burst.jsx, lib/halloween-theme.js, lib/popup-campaigns.js, supabase/popup-campaigns.sql. Code mới không import các file này.
4. Nếu repo còn app/page.jsx hoặc app/loading.jsx từ phiên bản trước v50.19, xóa chúng; Studio hiện dùng app/(studio)/page.jsx và app/(studio)/loading.jsx.
5. Giữ nguyên biến môi trường hiện tại, package-lock.json và cấu hình Vercel/Supabase. Không upload node_modules, .next hay file môi trường chứa key.
6. Sau khi Vercel Preview Ready, đăng nhập admin. Vào Mẫu phối sẵn, kiểm tra các design, patch/base và Link Shopee của từng design.
7. Vào Best-seller tháng này → chọn 3 mẫu → sắp thứ tự → bật popup → Lưu best-seller. Mặc định popup chưa bật nếu shop chưa chọn mẫu.
8. Kiểm tra trong cửa sổ ẩn danh hoặc phiên tab mới. Sau khi thử các luồng bên dưới, merge nhánh để triển khai production.

## Có cần SQL không?

Không cần bảng/cột mới nếu đang chạy v50.20. Cấu hình best-seller và Christmas dùng bảng settings có sẵn. Khi lưu bất kỳ settings trong admin, server sẽ xóa các key giftOffer, popupCampaigns, activePopupCampaign, halloweenThemeEnabled và halloweenFeatures. Có thể chạy riêng supabase/v51-remove-gifts.sql nếu muốn dọn các key cũ ngay. Không chạy lại toàn bộ schema.sql lên database đang hoạt động chỉ để cập nhật v51.

## Đã kiểm tra

- npm run build: PASS, Next.js 15.5.26.
- node scripts/check-v51.cjs: PASS. Kiểm tra chọn/lọc best-seller, availability, giới hạn base, mặt sản phẩm, chặn cập nhật admin khi chưa có quyền, lưu đủ 3 mẫu, gỡ cấu hình cũ, không giảm giá bằng cờ gift, áp dụng đúng base/size/rotation, render Studio.
- Render 5 dialog còn lại: PASS, gồm link Shopee, Trước/Sau, góc xoay.
- Production server với Supabase giả lập: PASS cho cache catalog, API fresh, invalidation khi tồn kho đổi, màn hình chờ, CSS theo route và deferred dialogs.

Chưa kiểm thử thao tác đầy đủ bằng trình duyệt hoặc đo PageSpeed trên production. Môi trường xem trước không mở được file HTML local; các bài test server/render không thay cho thử trên Vercel Preview.

## Bấm thử trước khi merge

- Mobile/desktop: popup 3 mẫu không crop ảnh, tên dài không che thumbnail; đóng rồi không tự mở lại trong cùng phiên.
- Best-seller thuộc base/màu khác: xem Trước/Sau, custom, kiểm tra sản phẩm/màu, size và góc xoay. Mua Shopee mở đúng link design.
- Tự phối: thêm patch, xoay/hút 15°, đổi màu/mặt, xóa hết, quay về Tự Phối, hoàn tác.
- Đặt đơn: tổng gồm base và toàn bộ patch, không còn patch tặng. Gửi mockup và mở Messenger như cũ.
- Admin: tìm patch, đổi nhóm, lưu thương hiệu, lưu settings, bật/tắt Christmas; Market và Lookbook hoạt động.
- Đo PageSpeed mobile 3 lần ở cùng deployment; ghi nhận popup có hiện ở mỗi lần đo hay không để so sánh đúng điều kiện.
