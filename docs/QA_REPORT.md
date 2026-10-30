# Kiểm chứng AlibiHub — 30/10/2026

Nguồn đối chiếu: đọc toàn bộ `AlibiHub_Product_Concept.docx` tại máy. Tài liệu riêng tư không đưa lên GitHub.

| Hạng mục | Kết quả | Bằng chứng / phạm vi |
|---|---|---|
| FE1 thiết lập, nhận, mute, kết thúc | PASS trên web; UNTESTED thiết bị Android | Playwright Microsoft Edge, viewport 390×844; ảnh `screenshots/` |
| FE1 ringtone, ambient, TTS Android | UNTESTED thiết bị | Đã thay API chỉ dùng web bằng expo-audio/expo-speech; asset WAV offline; cần nghe và kiểm tra rung thực tế |
| FE1 lưu lịch, phục hồi, hủy | PASS logic + web | Test service thật và tải lại trình duyệt; notification Android nền/khóa màn hình còn UNTESTED |
| FE2 thư viện Việt, search | PASS web | Không có kết quả sai cho truy vấn không khớp; tùy chỉnh chuyển vào FE1 |
| FE3 CRUD, lịch sử, dữ liệu rỗng, đồng thời | PASS service + caller CRUD web | Không mất bản ghi do ghi đồng thời; xóa hết không tái sinh mẫu; history còn sau reload |
| AI1 5 phong cách tiếng Việt | PASS Gemini thật qua proxy cục bộ | `live-ai-results.json`; không dùng mock AI trong test live |
| AI2 JSON → sửa → lưu → đọc lại → FE1 dispatch | PASS Gemini thật + service | `live-ai-results.json`; không xác nhận âm thanh/thiết bị qua test này |
| API thay khóa công khai | PASS bảo vệ | HTTP 403; key chỉ ở environment máy chủ; health không trả prefix |
| JSON lỗi/body quá lớn/rate limit/thiếu key | PASS HTTP thật | Test server Node listening trên loopback |
| Expo Doctor / dependency compatibility | PASS | 18/18; dependencies up to date |
| Android + web export | PASS | Metro export; **không phải APK build** |
| Backend HTTPS Render | UNTESTED / BLOCKED | Chưa có xác thực Render để tạo service |
| EAS preview APK | CHƯA CHẠY | Đợi backend HTTPS được kiểm chứng; không có build URL/APK URL |
| Thiết bị Android vật lý | UNTESTED | ADB không có thiết bị kết nối |

`npm test`: 6 nhóm kiểm thử trên mã production. Native AsyncStorage/notification boundaries được thay trong Node; đây không phải bằng chứng chạy Android. Tests giả lập cũ đã được thay vì chúng kiểm tra bản sao thuật toán và chấp nhận endpoint thay khóa công khai.

## Vấn đề đã sửa

- Bỏ model Gemini đã lỗi 404; `gemini-3.8-flash` timeout, dùng model xác minh được `gemini-3.1-flash-lite`.
- JSON schema phía Gemini + kiểm tra bắt buộc phía server/client; bỏ nội dung AI dự phòng tự bịa; giữ delay 0.
- Khóa AI chỉ trong server environment; cấm API đổi khóa; timeout, giới hạn kích thước và tần suất; không ghi nội dung bí mật vào log.
- Clipboard native, chỉnh sửa tin nhắn AI1 và nội dung AI2; chỉnh toàn bộ cấu hình trước khi gọi/lưu.
- Mẫu lưu có caller phẳng đúng định dạng Vault; cập nhật không tạo mục trùng; ghi AsyncStorage tuần tự; báo lỗi thay vì ghi đè dữ liệu hỏng.
- Lịch hẹn có timestamp và persistence; không tự mở cuộc gọi khi app ở nền; dùng notification trigger đúng SDK.
- Ringtone/ambient offline và TTS native, mixer/volume 0, mute, replay, tùy chọn rung/chuông; hủy âm thanh web không gây unhandled rejection.
- Safe-area Android, các nút nhận/từ chối, caller avatar URL, giờ tùy chọn, ghim Trang chủ và lỗi thao tác được phản hồi.
- FE4 bỏ tuyên bố gửi SOS/GPS giả. Giữ danh bạ, gọi thật qua dialer, chia sẻ tin nhắn qua hệ thống. GPS trực tiếp chưa triển khai.

## Hạn chế / kiểm thử còn bắt buộc

1. Cấp xác thực Render; chạy `deploy-render.cjs`, đợi `live`, rồi `test-https.cjs` cho URL thực. Free có cold start; xem [Render Free](https://render.com/docs/free).
2. Đặt URL HTTPS thật trong EAS preview `env.EXPO_PUBLIC_AI_PROXY_URL`, chạy `npm run verify:build`, rồi EAS build. Hook chặn cấu hình trống/localhost.
3. Android: kiểm tra giọng Việt offline, âm nền/chuông/rung, mute, từ chối quyền notification, nền/khóa màn hình, force-stop, mở lại, clipboard/share và toàn bộ AI workflow bằng mạng di động.
4. `npm audit`: đã loại các cảnh báo high bằng bản vá PostCSS và image-size tương thích; còn 9 cảnh báo low liên quan deepmerge/tooling Expo SDK 54. Không tự nâng SDK/đổi stack để ép audit về 0.

Quét source và lịch sử trước khi push bằng `scan-secrets.cjs`; `.env`, DOCX riêng tư và server secrets không nằm trong Git/EAS archive. Build thành công và URL APK chỉ được báo sau khi EAS trả trạng thái hoàn tất.
