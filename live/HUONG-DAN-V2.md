# Bản thử Chánh Điện Tịnh Tâm V2

Nhánh V2 dùng bản nhạc nền mới được cung cấp và không phát kinh định kỳ. Mở bảng điều khiển và overlay như hướng dẫn ở trên; trong mục **Thử tương tác**, dùng bình luận `NAM MO`, nút lượt thích và nút Hoa hồng. Mỗi người được ghi một hạt mỗi 10 giây. Các lượt thích được ghi nhận đầy đủ, còn hoạt ảnh lạy được tiết chế. Hoa được cộng ngay và xếp hàng dâng khi có overlay; hàng đợi được gộp khi đông.

Dữ liệu phiên được lưu tại `live/session-state.json` trên máy, không đưa lên GitHub. File có thông tin người xem và tiến độ; hãy giữ riêng. Để bắt đầu phiên mới, dừng server rồi đổi tên hoặc xóa file đó. Giọng chào và cảm ơn dùng Edge TTS, cần kết nối mạng và có thể không hoạt động nếu dịch vụ không khả dụng; nhạc nền vẫn có thể phát. Những sự kiện quà thiếu mã nhận dạng đủ tin cậy sẽ không tự cộng để tránh ghi trùng và được báo trong nhật ký. Kết nối TikTok và dữ liệu sự kiện thực tế chưa được kiểm thử trong bản này.

Chạy kiểm thử không cần kết nối TikTok: `cd live && node --test test/*.test.mjs`.

Bản thử theo dõi tối đa 1.000 người trong danh sách phiên; overlay hiển thị tối đa 100 người mỗi lượt và đổi lượt sau 30 giây. Con số là người trong danh sách phiên, không phải số người đang xem TikTok. Khi đạt 1.000, người ít hoạt động chưa tặng quà có thể nhường chỗ. Các nút 300 và 1.000 dùng dữ liệu mô phỏng; việc chịu tải LIVE thực chưa được kiểm chứng.

Chuông thu âm: NEPTUN-Solo-07 của the_very_Real_Horst, giấy phép CC0, https://freesound.org/people/the_very_Real_Horst/sounds/240934/. Bản thu gốc được lưu tại `assets/audio/bell-neptun.wav`; nếu thiếu hoặc không đọc được, ứng dụng dùng chuông tổng hợp. Tiếng mõ hiện được tạo bằng mã.

## Kết nối YouTube LIVE (bản thử)

Trong Google Cloud, bật YouTube Data API v3 và tạo API key chỉ dành cho API đó. Chọn một video LIVE đang phát và cho phép live chat. Trong bảng điều khiển, nhập URL video và key vào ô YouTube rồi bấm Kết nối. Key chỉ ở bộ nhớ máy chủ trong phiên kết nối, không ghi vào file trạng thái và không hiển thị lại; không gửi key qua chat. Key được gửi tới Google qua HTTPS. API key này dành cho dữ liệu có thể truy cập công khai; video riêng tư có thể cần OAuth và chưa được hỗ trợ. Có thể cần phát thử không công khai để đánh giá việc truy cập thực tế.

Các tin nhắn cũ ở lần truy vấn đầu không được phát lại. Những bình luận văn bản mới đưa người bình luận vào danh sách, và NAM MO ghi nhận một hạt theo giới hạn 10 giây. Ngắt kết nối có thể làm bỏ lỡ tin trong thời gian gián đoạn. Lượt thích, Super Chat/Super Stickers, người chỉ xem và sự kiện thành viên YouTube chưa được tích hợp; không tự quy đổi sang quà TikTok. Cần thử bằng phiên LIVE thật trước khi sử dụng.

Mỗi lần truy vấn chat tốn hạn mức API; app chờ ít nhất 15 giây hoặc lâu hơn theo yêu cầu của YouTube. Với mức 15 giây, xấp xỉ 1.200 đơn vị/giờ, không tính các yêu cầu khác; theo dõi hạn mức trong Google Cloud. Không dùng cổng bản thử có tắt giọng đọc để đánh giá lời chào.
