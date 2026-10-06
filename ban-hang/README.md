# Oanh Shop

Ứng dụng bán hàng native Android/iOS được viết bằng React Native và Expo; API/backend Express + MySQL nằm trong `backend`.

## Chạy ứng dụng Android

1. Cài và chạy MySQL, sau đó thực thi `backend/database.sql`.
2. Sao chép `backend/.env.example` thành `backend/.env`, điền cấu hình MySQL và `JWT_SECRET`.
3. Mở terminal trong `backend` và chạy `npm run dev`.
4. Mở terminal khác trong `mobile` và chạy `npm start`.
5. Mở Android Emulator hoặc quét QR bằng Expo Go trên điện thoại.

Mặc định Android Emulator kết nối backend qua `http://10.0.2.2:5000`. Nếu dùng điện thoại thật, sao chép `mobile/.env.example` thành `mobile/.env`, đổi địa chỉ API thành IP Wi-Fi của máy tính, rồi chạy lại Expo. Xem [hướng dẫn mobile](./mobile/README.md) để biết thêm.

Sau khi đăng ký tài khoản, cấp quyền quản trị bằng lệnh SQL trong `backend/README.md`. Tab menu chỉ hiển thị ở khu vực chính của app; các màn đăng nhập/đăng ký là màn hình riêng.
