# Bản thử Chánh Điện Tịnh Tâm V2

Nhánh V2 dùng bản nhạc nền mới được cung cấp và không phát kinh định kỳ. Mở bảng điều khiển và overlay như hướng dẫn ở trên; trong mục **Thử tương tác**, dùng bình luận `NAM MO`, nút lượt thích và nút Hoa hồng. Mỗi người được ghi một hạt mỗi 10 giây. Các lượt thích được ghi nhận đầy đủ, còn hoạt ảnh lạy được tiết chế. Hoa được cộng ngay và xếp hàng dâng khi có overlay; hàng đợi được gộp khi đông.

Dữ liệu phiên được lưu tại `live/session-state.json` trên máy, không đưa lên GitHub. File có thông tin người xem và tiến độ; hãy giữ riêng. Để bắt đầu phiên mới, dừng server rồi đổi tên hoặc xóa file đó. Giọng chào và cảm ơn dùng Edge TTS, cần kết nối mạng và có thể không hoạt động nếu dịch vụ không khả dụng; nhạc nền vẫn có thể phát. Những sự kiện quà thiếu mã nhận dạng đủ tin cậy sẽ không tự cộng để tránh ghi trùng và được báo trong nhật ký. Kết nối TikTok và dữ liệu sự kiện thực tế chưa được kiểm thử trong bản này.

Chạy kiểm thử không cần kết nối TikTok: `cd live && node --test test/*.test.mjs`.

Bản thử theo dõi tối đa 1.000 người trong danh sách phiên; overlay hiển thị tối đa 100 người mỗi lượt và đổi lượt sau 30 giây. Con số là người trong danh sách phiên, không phải số người đang xem TikTok. Khi đạt 1.000, người ít hoạt động chưa tặng quà có thể nhường chỗ. Các nút 300 và 1.000 dùng dữ liệu mô phỏng; việc chịu tải LIVE thực chưa được kiểm chứng.

Chuông thu âm: NEPTUN-Solo-07 của the_very_Real_Horst, giấy phép CC0, https://freesound.org/people/the_very_Real_Horst/sounds/240934/. Bản thu gốc được lưu tại `assets/audio/bell-neptun.wav`; nếu thiếu hoặc không đọc được, ứng dụng dùng chuông tổng hợp. Tiếng mõ hiện được tạo bằng mã.

## Khởi động ổn định trên macOS

Mở `Bat Chanh Dien.command` ở thư mục dự án. Chỉ dùng một địa chỉ cố định: `http://127.0.0.1:3481/live/control.html`; nguồn OBS là `http://127.0.0.1:3481/live/overlay.html`, rộng 1080, cao 1920. Các địa chỉ 3000, 3479, 3480 là phiên cũ. Không đổi cổng để tránh xung đột: chương trình báo nếu 3481 đã được ứng dụng khác sử dụng. Cần Node.js và Python 3; bộ khởi động tự tìm Node.js có sẵn của Codex hoặc Node trong PATH.

Bộ giám sát chạy độc lập sau khi đóng cửa sổ Terminal và kiểm tra tình trạng mỗi 2 giây. Nếu máy chủ dừng hoặc không trả lời nhiều lần, bộ giám sát khởi động lại ở cùng cổng; sau 5 lần lỗi khởi động liên tiếp sẽ dừng để tránh lặp vô hạn. Nhật ký nằm trong `live/runtime/`, không đưa lên GitHub; file nhật ký máy chủ được giới hạn giữa các lần khởi động. Trạng thái phiên lưu tại `live/session-state.json`; link YouTube được lưu để tự nối lại sau khi máy chủ khởi động lại. Danh sách chống trùng chat ở bộ nhớ, tối đa 20.000 mã; lịch sử ở lần kết nối đầu bị bỏ qua, có thể bỏ lỡ bình luận khi mất kết nối. Chưa tự chạy lại sau khi khởi động lại máy Mac: mở lại tệp khởi động.

Khi dùng OBS, tắt tùy chọn đóng nguồn trình duyệt khi ẩn nếu muốn nhạc liên tục; giữ máy thức, cắm nguồn và ưu tiên mạng ổn định. Không cần thuê máy chủ hay mở cổng ra Internet. Hình và nhạc cục bộ không phụ thuộc kết nối chat; nếu chính máy chủ ứng dụng dừng, sẽ có khoảng gián đoạn cho tới khi phục hồi. Giọng Edge TTS vẫn phụ thuộc dịch vụ bên ngoài.

## Kết nối YouTube không cần API key

Dán link hoặc mã video LIVE công khai/không công khai, bật chat, bấm **Kết nối YouTube**. Phiên bản này dùng `youtubei.js` 18.3.0; không dùng Google Cloud API key, OAuth, cookie hay hạn mức Data API của dự án. Không tự phát LIVE. Nhận bình luận chữ và Super Chat/Sticker; không quy đổi tiền sang hoa hoặc lượt thích. NAM MO ghi một hạt mỗi tài khoản mỗi 10 giây. Không suy ra người đang xem từ người bình luận. Các tin ở lần kết nối đầu không phát lại. Kết nối lỗi sẽ tự thử lại với thời gian chờ tăng dần, tối đa 60 giây. Video chưa LIVE/đã kết thúc cần bấm kết nối lại khi bắt đầu buổi mới.

Đây là kết nối không chính thức tới YouTube; không cam kết hoạt động 24/24, độ trễ cố định hoặc quyền truy cập video riêng tư. Lần thử mạng công khai hiện chưa xác nhận nhận được chat: YouTube trả video không thể phát/không có chat cho video thử. Cần xác minh bằng buổi LIVE của người dùng trước khi dùng thực tế.

## Cầu nối dự phòng từ trang chat

Trong bảng điều khiển nhập cùng link video, bấm **Chuẩn bị cầu nối dự phòng**. Thao tác này ngắt chế độ trực tiếp. Kéo liên kết **Thiện An · nối chat** lên thanh dấu trang Chrome. Mở chat rời bằng liên kết trong bảng điều khiển; chọn **Live chat** thay vì **Top chat**. Tại trang chat đó bấm dấu trang, cho phép cửa sổ bật lên nếu được hỏi. Giữ trang chat và cửa sổ cầu nối mở. Không cần cài Tampermonkey hay dán mã vào Console.

Cầu nối chỉ đọc dòng chat mới xuất hiện trong trang người dùng đang xem; không truyền cookie hay thông tin đăng nhập. Dữ liệu đi từ trang YouTube sang cửa sổ cục bộ bằng postMessage và WebSocket. Máy chủ vẫn chỉ nghe 127.0.0.1, giữ kiểm tra Origin và dùng mã ghép nối ngẫu nhiên trong bộ nhớ. Chỉ nhận đúng video đã chuẩn bị. Sau khi máy chủ khởi động lại, cần chuẩn bị dấu trang mới. Không chia sẻ dấu trang này. Trình duyệt/YouTube có thể hạn chế cửa sổ, dấu trang hoặc cấu trúc chat; chưa kiểm thử đầu cuối trên trang chat thật, chưa cam kết LIVE riêng tư.

**Kiểm thử:** `cd live && node --test test/*.test.mjs`. Bao gồm HTTP/WebSocket thật ở cổng riêng 3497, chống trùng trực tiếp/cầu nối, cooldown, ngắt/nối lại, chặn origin/token sai và lưu phục hồi sau khởi động lại. Không đăng nhập hay gửi bình luận lên YouTube trong bộ kiểm thử.
