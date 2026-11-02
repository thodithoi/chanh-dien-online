# Bản thử Chánh Điện Tịnh Tâm V2

Nhánh V2 dùng hai bản nhạc nền sẵn có và không phát kinh định kỳ. Mở bảng điều khiển và overlay như hướng dẫn ở trên; trong mục **Thử tương tác**, dùng bình luận `NAM MO`, nút lượt thích và nút Hoa hồng. Mỗi người được ghi một hạt mỗi 10 giây. Các lượt thích được ghi nhận đầy đủ, còn hoạt ảnh lạy được tiết chế. Hoa được cộng ngay và xếp hàng dâng khi có overlay; hàng đợi được gộp khi đông.

Dữ liệu phiên được lưu tại `live/session-state.json` trên máy, không đưa lên GitHub. File có thông tin người xem và tiến độ; hãy giữ riêng. Để bắt đầu phiên mới, dừng server rồi đổi tên hoặc xóa file đó. Giọng chào và cảm ơn dùng Edge TTS, cần kết nối mạng và có thể không hoạt động nếu dịch vụ không khả dụng; nhạc nền vẫn có thể phát. Những sự kiện quà thiếu mã nhận dạng đủ tin cậy sẽ không tự cộng để tránh ghi trùng và được báo trong nhật ký. Kết nối TikTok và dữ liệu sự kiện thực tế chưa được kiểm thử trong bản này.

Chạy kiểm thử không cần kết nối TikTok: `cd live && node --test test/*.test.mjs`.
