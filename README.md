# Patchie Studio — Vercel + Supabase

Website độc lập để khách tự phối patch ủi lên áo base, tải mockup và gửi yêu cầu cho shop qua Messenger. Website không thu tiền. Mã nguồn không gọi OpenAI hoặc ChatGPT API.


## Scale patch theo từng sản phẩm base

Sản phẩm base mới cần có ba giá trị: `reference_width_cm`, `reference_height_cm` và `image_fit_percent`. Admin → Sản phẩm base có editor điểm hút riêng theo từng mặt: chạm để thêm điểm, kéo điểm để chỉnh vị trí và bấm dấu × để xóa. Khi thêm hoặc di chuyển điểm gần thẳng hàng ngang, dọc hoặc chéo với các điểm khác, admin hiện guide và tự căn giúp bạn. Hai kích thước xác định vùng vật lý dùng làm hệ quy chiếu cho patch; `image_fit_percent` cho biết chiều rộng của ảnh sản phẩm chiếm bao nhiêu phần trăm khung vuông preview. Các trường này có thể sửa trong Admin → Sản phẩm base. Sản phẩm cũ để trống sẽ tiếp tục dùng hệ quy chiếu cũ (62.5 × 62.5 cm), không cần tải lại patch. Nếu sửa base cũ, có thể điền thông số để chuyển sang scale mới.

Khi thêm cột vào database đang có, chạy `supabase/base-scale-and-snap-guides-migration.sql` trong Supabase SQL Editor:

```sql
alter table public.products
  add column if not exists reference_width_cm numeric(7,2),
  add column if not exists reference_height_cm numeric(7,2),
  add column if not exists image_fit_percent numeric(5,2),
  add column if not exists snap_points jsonb not null default '[]'::jsonb,
  add column if not exists snap_guides jsonb not null default '[]'::jsonb;
```

## Có sẵn

- Studio kéo thả patch, chọn mẫu áo và size, lưu mockup PNG/WebP, tải ảnh về máy.
- Hai cách hoàn thiện: khách tự ủi tại nhà hoặc shop ủi theo mockup.
- Form lưu yêu cầu vào Supabase; nút gửi shop sao chép thông tin để khách dán vào Messenger.
- Dashboard quản trị tại `/admin`: xem yêu cầu và mockup, đổi trạng thái, thêm/xóa mẫu áo và patch, chỉnh Messenger, size, nội dung quyền riêng tư và thời hạn lưu.
- Dashboard quản trị có campaign popup tặng patch: bật/tắt popup truyền thống hoặc Halloween Tarot, chọn campaign đang chạy, chỉnh nội dung và gán patch quà cho từng event/lá bài. Admin cũng có thể bật/tắt lớp theme Halloween cho toàn bộ Studio, Patch Market và Lookbook, rồi toggle riêng Pumpkin Spider, mạng nhện, đàn dơi và pháo hoa bí ngô.
- Khi thêm hoặc sửa patch, admin chọn trạng thái `Đã release` hoặc `Coming soon`. Patch Coming soon vẫn xuất hiện trong Studio và collection nhưng được làm mờ, hiện nhãn thay giá và không thể thêm vào mockup.
- Admin có thể chỉnh thứ tự các nhóm patch và bật/tắt spotlight nhẹ cho 3 nhóm đầu; mỗi nhóm đầu dùng một accent Patchie khác nhau.
- Chạm/click vào patch sẽ thêm ngay vào mockup ở cả desktop và mobile; không còn nút thêm patch riêng.
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
5. Nếu project đã có database và chưa có cột release patch, chạy thêm `supabase/release-status.sql` một lần.
6. Trong **Project Settings → API**, lấy Project URL, `anon`/publishable key và `service_role`/secret key.
7. Trong **Authentication → URL Configuration**, đặt Site URL là domain Vercel sau khi deploy. Thêm redirect URL `https://TEN-MIEN/auth/callback` và URL preview Vercel nếu cần thử đăng nhập ở preview.
8. Trong **Authentication → Providers → Email**, bật email OTP/magic link. Admin sẽ đăng nhập bằng link nhận qua email.

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


## Nhập nhiều patch

Sau khi deploy code có route `/admin/import`, đăng nhập bằng tài khoản admin và mở trang này. Trang có hai chế độ: `Thêm patch mới` và `Cập nhật patch theo ID`. Tạo mới cần `id,name,width_cm,height_cm` và `image_filename` hoặc `image_url`; ID đã tồn tại sẽ bị từ chối để tránh ghi đè nhầm. Chế độ cập nhật yêu cầu `id`; chỉ các cột có trong CSV được cập nhật, ô trống giữ nguyên giá trị cũ. Có thể thay ảnh bằng `image_filename` (chọn file ảnh cùng tên) hoặc `image_url`. Các cột có thể cập nhật gồm tên, ảnh, kích thước, giá, quote, group, tags, IDs gợi ý, trạng thái release, tồn kho, số đã bán, featured/new, active và sort order. Danh sách cách nhau bằng dấu chấm phẩy. Dùng `__CLEAR__` để xóa giá, quote, tags hoặc IDs gợi ý. Ảnh lưu trong bucket `patch-assets`, prefix `Patch Bulk Upload/`, tối đa 4 MB mỗi ảnh.

### Upload riêng quy tắc gợi ý

Sau khi deploy, mở `/admin/recommendations` (cũng có nút trong dashboard). Tải `recommendation-rules-template.csv`, sửa các dòng rồi upload; trang sẽ xem trước và báo lỗi trước khi lưu. Upload quy tắc không import ảnh hay cập nhật sản phẩm. Bộ quy tắc được lưu dưới key `recommendationRules` trong bảng `settings` hiện có, không cần chạy migration SQL mới.

CSV dùng các cột `rule_id,source_tags,target_tags,required_shared_prefix,score,active`. Danh sách tag dùng dấu chấm phẩy. Ví dụ `size_large` → `size_small`; hoặc `pet` → `flower` với `required_shared_prefix=color_` để chỉ ghép khi hai patch cùng có tag màu như `color_pink`. Mỗi rule đang tắt có `active=false`; đổi thành `true` để áp dụng. Upload bộ mới sẽ thay toàn bộ bộ đã lưu. Rule gợi ý được cộng điểm cùng với điểm tag trùng; `recommended_patch_ids` vẫn là gợi ý thủ công ưu tiên cao nhất.

### Gợi ý patch trong giao diện mobile

Danh sách gợi ý được hiển thị trong một khung nổi trên giao diện mobile khi khách đã thêm ít nhất một patch. Khách có thể thu gọn khung; nhãn “Patchie gợi ý” vẫn ở góc trái để mở lại. Khung tự ẩn sau khi khách bấm “Đã custom xong rồi”. Bật/tắt tính năng tại **Admin → Cài đặt → Bật Patchie gợi ý trong giao diện custom**. Cài đặt dùng bảng `settings` hiện có, không cần migration SQL.


### Default base product

The admin can choose the product/color variation shown when the storefront opens under **Admin → Thương hiệu & nội dung → Thông tin website → Sản phẩm base mở mặc định**. This preference is stored in the existing `settings` key/value table, so no SQL migration is required. If the selected product is disabled or deleted, the storefront falls back to the first active product.
