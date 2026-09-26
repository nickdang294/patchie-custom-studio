# Patchie Studio — Vercel + Supabase

Website độc lập để khách tự phối patch ủi lên áo base, tải mockup và gửi yêu cầu cho shop qua Messenger. Website không thu tiền. Mã nguồn không gọi OpenAI hoặc ChatGPT API.

## Có sẵn

- Studio kéo thả patch, chọn mẫu áo và size, lưu mockup PNG/WebP, tải ảnh về máy.
- Hai cách hoàn thiện: khách tự ủi tại nhà hoặc shop ủi theo mockup.
- Form lưu yêu cầu vào Supabase; nút gửi shop sao chép thông tin để khách dán vào Messenger.
- Dashboard quản trị tại `/admin`: xem yêu cầu và mockup, đổi trạng thái, thêm/xóa mẫu áo và patch, chỉnh Messenger, size, nội dung quyền riêng tư và thời hạn lưu.
- Dashboard quản trị có campaign popup tặng patch: bật/tắt popup truyền thống hoặc Halloween Tarot, chọn campaign đang chạy, chỉnh nội dung và gán patch quà cho từng event/lá bài. Admin cũng có thể bật/tắt lớp theme Halloween nhẹ cho toàn bộ Studio, Patch Market và Lookbook.
- Đăng nhập admin bằng magic link Supabase Auth và danh sách email được cho phép.
- Supabase Storage lưu mockup riêng tư và ảnh patch; cron hằng ngày xóa mockup quá hạn.
- Thư viện ban đầu dùng patch tham khảo đang có trong project; kích thước patch được quản lý trong dashboard.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Nếu chưa điền Supabase, trang vẫn mở bằng danh mục mẫu để xem giao diện. Lưu yêu cầu và đăng nhập quản trị cần cấu hình Supabase.

## Tạo Supabase

1. Tạo project mới trên Supabase.
2. Mở **SQL Editor**, dán toàn bộ `supabase/schema.sql`, rồi chạy. Script tạo bảng, policy đọc catalog công khai, hai storage bucket, dữ liệu mẫu và hàm tạo đơn patch atomic.
3. Nếu project đã chạy schema cũ, chạy thêm `supabase/fast-order.sql` để mở WebP, bỏ constraint nhóm sản phẩm cũ và hỗ trợ luồng tạo đơn nhanh.
4. Nếu project đã chạy trước khi có campaign popup, chạy thêm `supabase/popup-campaigns.sql` một lần.
5. Trong **Project Settings → API**, lấy Project URL, `anon`/publishable key và `service_role`/secret key.
6. Trong **Authentication → URL Configuration**, đặt Site URL là domain Vercel sau khi deploy. Thêm redirect URL `https://TEN-MIEN/auth/callback` và URL preview Vercel nếu cần thử đăng nhập ở preview.
7. Trong **Authentication → Providers → Email**, bật email OTP/magic link. Admin sẽ đăng nhập bằng link nhận qua email.

Giữ `service_role` key ở biến môi trường server của Vercel. Không đặt key này vào biến có tiền tố `NEXT_PUBLIC_`, không commit vào GitHub và không gửi qua chat.

## Đưa mã nguồn lên GitHub

Tạo repository GitHub riêng, rồi từ thư mục project chạy:

```bash
git init
git add .
git commit -m "Build Patchie custom studio"
git branch -M main
git remote add origin https://github.com/USERNAME/patchie-custom-studio.git
git push -u origin main
```

Không commit `.env.local`; file này đã nằm trong `.gitignore`.

## Deploy Vercel

1. Đăng nhập Vercel, chọn **Add New → Project**, import repository GitHub vừa tạo.
2. Framework tự nhận là Next.js. Thêm biến môi trường cho Production, Preview và Development:

| Key | Giá trị |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL của Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role/secret key — chỉ dùng server |
| `ADMIN_EMAILS` | Email admin đầu tiên; nhiều email cách nhau bằng dấu phẩy |
| `CRON_SECRET` | Chuỗi ngẫu nhiên dài để khóa route dọn dữ liệu |

3. Chọn **Deploy**. Sau khi Vercel cấp domain, quay lại Supabase và thêm domain thật cùng preview cần dùng vào redirect URLs.
4. Mở `/admin`, nhập email có trong `ADMIN_EMAILS`, bấm gửi link và đăng nhập từ email.
5. Trong dashboard, cập nhật Messenger, giá, mẫu áo, size, patch và nội dung riêng tư trước khi công khai site.

Khi gắn domain riêng, thêm domain trong **Project → Settings → Domains** trên Vercel rồi cấu hình DNS theo bản ghi Vercel hướng dẫn. Thêm domain đó vào Supabase Auth Site URL/redirect URL.

## Biến môi trường local

Sao chép `.env.example` thành `.env.local` và điền cùng bộ Supabase keys. Tạo `CRON_SECRET` cho local nếu muốn thử endpoint dọn dữ liệu. Cấu hình đồng thời trong Vercel Project Settings → Environment Variables khi deploy.

## Lưu ý vận hành

- Số tiền chưa được ấn định; dashboard cho phép shop thêm giá khi đã chốt.
- Website không nhận thanh toán và không tự xác nhận đơn.
- Thời hạn lưu mặc định 30 ngày; Vercel Cron gọi `/api/cron/cleanup` mỗi ngày và cần biến `CRON_SECRET`.
- Nhóm sản phẩm dùng `id` ổn định và `label` có thể đổi trong dashboard. Đổi tên nhóm không cần cập nhật từng sản phẩm; sản phẩm cũ sẽ tự hiển thị label mới.
- Admin bổ sung được quản lý trong phần Cài đặt. Email admin chính vẫn do `ADMIN_EMAILS` trên Vercel kiểm soát.
- Mockup là link lưu nội bộ trong storage private, admin xem qua signed URL ngắn hạn. Messenger nhận mã thiết kế và thông tin mô tả; khách tải ảnh mockup về để gửi kèm trong Messenger.

## Kiểm tra

```bash
npm run build
```
