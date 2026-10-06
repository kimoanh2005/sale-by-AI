# Backend Oanh Shop

## Chạy lần đầu

1. Tạo database/schema bằng cách chạy `database.sql` trong MySQL Workbench hoặc MySQL client.
2. Sao chép `.env.example` thành `.env`, rồi nhập thông tin MySQL và một `JWT_SECRET` ngẫu nhiên, đủ dài.
3. Trong thư mục `backend`, chạy `npm install` (nếu chưa cài dependencies), sau đó `npm run dev`.
4. Chạy frontend trong `frontend` bằng `npm run dev`. Mặc định frontend gọi trực tiếp `http://localhost:5000/api`. Nếu backend chạy ở địa chỉ khác, đặt `VITE_API_URL` (có thể nhập URL gốc như `http://localhost:5000` hoặc URL API như `http://localhost:5000/api`) rồi khởi động lại frontend. Vite cũng được cấu hình proxy `/api` cho các môi trường chọn dùng URL tương đối.
5. Đăng ký tài khoản trong ứng dụng. Để cấp quyền quản trị cho tài khoản, chạy câu lệnh sau trong MySQL, thay email bằng email đã đăng ký:

   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
   ```

Đăng xuất/đăng nhập lại để frontend hiển thị quyền mới. Không dùng `JWT_SECRET` mặc định trong môi trường triển khai.

## Chuẩn hóa danh mục sản phẩm hiện có

Nếu database đã có danh mục trùng hoặc sản phẩm bị gán sai loại, chạy một lần tại thư mục `backend`:

```powershell
npm run fix:product-categories
```

Lệnh này gộp danh mục trùng tên, phân loại các sản phẩm nhận diện được theo tên (điện thoại, laptop, tai nghe, thời trang, đồ uống và phụ kiện), và giữ nguyên danh mục hiện tại của sản phẩm không nhận diện được.

## Ứng dụng điện thoại

Ứng dụng React Native/Expo nằm trong thư mục `../mobile`. Hướng dẫn chạy Android Emulator và điện thoại thật nằm trong [`../mobile/README.md`](../mobile/README.md).

## API chính

- `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/me`
- `GET /api/products`, `GET /api/products/categories`, `GET /api/products/:id`
- `POST /api/products`, `PUT/DELETE /api/products/:id` yêu cầu quyền quản trị
- `GET/POST /api/cart`, `PUT/DELETE /api/cart/:id` yêu cầu đăng nhập; mỗi tài khoản chỉ thao tác giỏ hàng của chính mình
- `GET/POST /api/users`, `PUT/DELETE /api/users/:id` yêu cầu quyền quản trị
