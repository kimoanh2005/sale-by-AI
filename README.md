# Oanh Shop Mobile

Ứng dụng chính của dự án là app native Android/iOS viết bằng React Native và Expo, nằm trong `ban-hang/mobile`. Backend Express + MySQL nằm trong `ban-hang/backend`.

## Chạy ứng dụng

1. Cài và chạy MySQL, sau đó thực thi `ban-hang/backend/database.sql`.
2. Sao chép `ban-hang/backend/.env.example` thành `ban-hang/backend/.env` và điền cấu hình MySQL cùng `JWT_SECRET`.
3. Mở terminal tại `ban-hang/backend` và chạy `npm run dev`.
4. Tại thư mục dự án, chạy `npm run start`.
5. Mở Android Emulator hoặc quét mã QR bằng Expo Go trên điện thoại.

Các lệnh từ thư mục dự án:

- `npm run start` — khởi chạy Expo.
- `npm run android` — chạy app trên Android.
- `npm run ios` — chạy app trên iOS (cần macOS/Xcode).
- `npm run typecheck` — kiểm tra TypeScript.
- `npm run apk` — tạo APK release sau khi đã tạo thư mục native Android.

Android Emulator kết nối backend mặc định tại `http://10.0.2.2:5000`. Để chạy trên điện thoại thật, sao chép `ban-hang/mobile/.env.example` thành `ban-hang/mobile/.env`, đặt `EXPO_PUBLIC_API_URL` thành địa chỉ IP Wi-Fi của máy tính, rồi khởi động lại Expo.

App hiện hỗ trợ đăng ký/đăng nhập, danh sách và chi tiết sản phẩm, giỏ hàng, hồ sơ người dùng và các màn hình quản trị. Xem thêm hướng dẫn tại [`ban-hang/mobile/README.md`](./ban-hang/mobile/README.md) và [`ban-hang/backend/README.md`](./ban-hang/backend/README.md).
