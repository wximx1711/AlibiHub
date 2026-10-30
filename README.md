# AlibiHub

Ứng dụng Expo React Native + JavaScript hỗ trợ giao tiếp tiếng Việt, gọi mô phỏng trong app, thư viện/kho offline và Gemini AI qua Node.js proxy.

## Chạy và kiểm thử

```sh
npm ci
npm start
npm test
npm run test:live
npx expo-doctor
npx expo export --platform android
```

`npm test` kiểm tra mã dịch vụ thực tế với bộ nhớ native thay thế trong Node và HTTP server thật. `test:live` gọi Gemini thật cho 5 phong cách AI1, AI2, chuyển đổi dữ liệu, chỉnh sửa, lưu/đọc lại và dispatch FE1; cần `server/.env`. Không chứng minh âm thanh Android hay HTTPS production.

`node scripts/test-ui.cjs` kiểm tra bản web đã export bằng Microsoft Edge headless; ảnh chụp lưu trong `docs/screenshots`.

## Backend Render Free

Tạo Render Blueprint từ `render.yaml`, cung cấp `GEMINI_API_KEY` dưới dạng secret environment variable trong Render. Model đã xác minh: `gemini-3.1-flash-lite`; có thể đổi qua `GEMINI_MODEL`. Docker image không chứa `.env`, không cài dependency ngoài Node.

Sau khi service triển khai, kiểm tra `/api/health`, rồi gọi thật `/api/ai/message` và `/api/ai/scenario` qua HTTPS. Health chỉ xác nhận có cấu hình khóa, không chứng minh khóa hợp lệ.

Client lấy URL từ `EXPO_PUBLIC_AI_PROXY_URL`, hoặc URL HTTPS trong Cài đặt. Không đưa Gemini key vào biến `EXPO_PUBLIC_*`. Render Free có thể ngủ khi không hoạt động; mở backend trước buổi demo. Giới hạn mặc định: 40 HTTP requests/phút/IP, 3 AI requests đồng thời, 200 AI requests/ngày/process. Giới hạn trong RAM được đặt lại khi service khởi động; dùng quota Google Cloud để đặt trần chi phí lâu dài.

## Android APK

Profile `preview` đã dùng `buildType: apk`. Chỉ build sau khi backend HTTPS và kiểm thử bắt buộc đạt yêu cầu:

```sh
npx eas-cli build --platform android --profile preview
```

Thiết lập `EXPO_PUBLIC_AI_PROXY_URL` trong EAS environment trước khi build. `.easignore` loại toàn bộ server và secret khỏi upload. Không có APK hoặc URL build được giả định sẵn.

## Giới hạn minh bạch

- Cuộc gọi mô phỏng chỉ trong ứng dụng; nền/khóa màn hình dùng thông báo cần người dùng chạm. Không phải cuộc gọi viễn thông, không mở toàn màn hình ở nền.
- Lịch hẹn lưu trên máy; lịch quá hạn trên 5 phút được bỏ khi mở lại. Android có thể trì hoãn thông báo khi tiết kiệm pin/force-stop.
- Nhạc chuông và ambient tổng hợp đóng gói offline. Giọng đọc dùng TTS của thiết bị; cần cài giọng tiếng Việt offline. Ảnh đại diện HTTPS cần mạng khi tải lần đầu.
- FE4 hiện lưu liên hệ, mở trình gọi điện và bảng chia sẻ. Không giả báo gửi SOS, kết nối bạn bè hay tọa độ GPS; nhận/chấp nhận yêu cầu và chia sẻ vị trí trực tiếp chưa triển khai.
- Gợi ý Phase 3 dựa trên mục yêu thích/ghim; không tuyên bố có mô hình gợi ý AI riêng.

Không commit `.env`, token hoặc tài liệu riêng tư. Chạy `node scripts/scan-secrets.cjs` trước khi push.
