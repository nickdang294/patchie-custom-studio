# Patchie Studio — Vercel + Supabase

Website độc lập để khách tự phối patch ủi lên áo base, tải mockup và gửi yêu cầu cho shop qua Messenger. Website không thu tiền. Mã nguồn không gọi OpenAI hoặc ChatGPT API.


## Scale patch theo từng sản phẩm base

Sản phẩm base mới cần có kích thước vùng mockup thật (`reference_width_cm`, `reference_height_cm`) và tỉ lệ ảnh sản phẩm chiếm khung theo hai trục: `image_fit_percent` là chiều ngang, `image_fit_height_percent` là chiều dọc. Ví dụ: sản phẩm thật rộng 3 cm, cao 8 cm; ảnh trong khung vuông chiếm 30% ngang và 80% dọc. Admin dùng riêng hai tỉ lệ để quy đổi rộng/cao patch; ảnh patch vẫn giữ nguyên tỉ lệ hiển thị. Sản phẩm cũ chưa có tỉ lệ dọc sẽ tạm dùng tỉ lệ ngang để giữ cách scale cũ cho đến khi admin nhập số dọc.

Với database đang chạy, chạy một lần `supabase/product-image-fit-axes-migration.sql` trong Supabase SQL Editor trước khi deploy code. Không cần chạy lại toàn bộ `schema.sql`.

Sản phẩm base có editor điểm hút riêng theo từng mặt: chạm để thêm điểm, kéo điểm để chỉnh vị trí và bấm dấu × để xóa. Khi thêm hoặc di chuyển điểm gần thẳng hàng ngang, dọc hoặc chéo với các điểm khác, admin hiện guide và tự căn giúp bạn.

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

## Bật Vercel Web Analytics và Speed Insights

Mã nguồn đã thêm hai công cụ vào layout chung và ghi nhận các thao tác chính: chọn base/màu, thêm patch, mở hoặc làm mới gợi ý, hoàn tất custom, tạo yêu cầu đơn, mở lookbook và thêm patch vào giỏ.

Sau khi deploy:

1. Mở **Vercel → Project → Analytics**, bấm **Enable**.
2. Mở **Vercel → Project → Speed Insights**, bấm **Enable**.
3. Vào site đã deploy và thử vài trang/luồng custom. Vercel bắt đầu thu page views, nguồn truy cập, thiết bị và dữ liệu hiệu năng; dữ liệu có thể cần một thời gian mới hiện trong dashboard.
4. Xem số liệu tại **Analytics** và **Speed Insights** trong project Vercel.

Trên Hobby, Web Analytics cơ bản và Speed Insights có hạn mức miễn phí. Các sự kiện tương tác riêng như `Patch Added`, `Customization Completed` và `Custom Order Created` cần Vercel Pro hoặc Enterprise để xem trong Analytics. Code đã gắn sẵn các sự kiện này để dùng khi tài khoản có hỗ trợ. Website không gửi tên, số điện thoại, địa chỉ hoặc nội dung ghi chú khách hàng sang Analytics.

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


### Giới hạn kích thước patch theo sản phẩm base

Trong **Admin → Sản phẩm base**, mỗi SKU/màu có thể đặt chiều rộng và chiều cao tối thiểu/tối đa của patch được phép dùng. Để trống hoặc nhập `0` nghĩa là không giới hạn. Các giới hạn lọc cả danh sách Tự Phối, danh sách Patchie Gợi Ý và patch quà; server cũng từ chối đơn nếu có patch nằm ngoài giới hạn. Với database đang chạy, chạy một lần `supabase/base-patch-dimension-limits-migration.sql` trong Supabase SQL Editor trước khi deploy code.


## Patch thumbnails

Run `supabase/patch-thumbnail-migration.sql` once before deploying this update. Patch uploads from the admin editor and bulk import create a full-size original plus a transparent WebP thumbnail automatically. Both are stored under `Patch Bulk Upload/YYYY-MM-DD/`; thumbnails are placed in that day's `thumbnail/` subfolder. The picker and suggestion cards use the thumbnail, while mockups continue to use the original.

After deployment, open Admin → Thư viện patch and use **Tạo thumbnail còn thiếu** once for existing patches. The backfill runs in batches of five and leaves original images untouched. New uploads create both files without changing the CSV template.


## Mẫu phối sẵn

Admin có thể tạo mẫu tại `/admin/product-designs`. Chọn đúng biến thể base/màu, thêm và kéo patch trên từng mặt, đặt ngưỡng patch trùng rồi lưu. Mẫu chỉ được gợi ý khi khách đang chọn cùng `product_id`; danh sách tối đa 9 mẫu, xếp theo số patch trùng rồi theo ưu tiên admin. Khách có thể bật/tắt gợi ý cho phiên hiện tại, xem preview dựng từ base/patch và xác nhận trước khi thay toàn bộ patch đang đặt. Nút “Patchie gợi ý thêm” chỉ bật khi có mẫu khác sau khi khách thêm patch; nếu chưa có mẫu mới, nút mờ và nhắc khách thêm patch. Mẫu và preview không hiển thị giá.

Trước khi deploy lên database hiện có, chạy `supabase/product-design-suggestions-migration.sql` một lần. Thumbnail WebP được lưu trong bucket `product-design-thumbnails` tại `product-design-thumbnails/YYYY-MM-DD/<design-id>.webp`; hệ thống thử nén xuống tối đa 30 KB. Mỗi mẫu lưu ngày tạo và ngày cập nhật. Khi cập nhật, ngày tạo và folder ban đầu được giữ nguyên.
