# Bộ Sưu Tập Game Mini

Bộ sưu tập game mini bao gồm game tìm số và game nối từ, có thể chơi offline hoặc online.

## Game hiện có

1. **Trò chơi tìm số** - Tìm các số theo thứ tự tăng dần từ 1 đến N
2. **Trò chơi nối từ** - Nối từ theo luật chơi đuổi hình bắt chữ

## Cách chơi Trò Chơi Tìm Số

1. **Thiết lập trò chơi**:
   - Chọn số lượng số (từ 10 đến 300).
   - Chọn số lượng người chơi (2-4).
   - Nhập tên của từng người chơi.
   - Nhấn nút "Bắt Đầu" để bắt đầu trò chơi.

2. **Luật chơi**:
   - Người chơi lần lượt tìm và nhấp vào số theo thứ tự tăng dần (bắt đầu từ 1).
   - Nếu người chơi nhấp đúng số tiếp theo, họ sẽ được cộng 1 điểm và được tiếp tục lượt của mình.
   - Số đã được tìm thấy sẽ biến mất khỏi màn hình.
   - Nếu người chơi nhấp vào số không đúng, lượt chơi sẽ chuyển sang người chơi tiếp theo.
   - Trò chơi kết thúc khi tất cả các số đã được tìm thấy hoặc khi người chơi nhấn nút "Kết Thúc".

3. **Kết quả**:
   - Người chơi có điểm cao nhất (tìm được nhiều số nhất) sẽ thắng.
   - Nếu có nhiều người chơi có cùng điểm cao nhất, kết quả sẽ là hòa.

## Cách chơi Trò Chơi Nối Từ

Chơi theo luật chơi đuổi hình bắt chữ, sử dụng chữ cuối của từ trước làm chữ đầu của từ tiếp theo.

## Phiên bản online

Bộ sưu tập game này được triển khai trên [Render](https://render.com) và có thể truy cập tại:

[Địa chỉ web sau khi triển khai]

## Cách chạy locally

1. **Cài đặt Node.js**:
   - Tải và cài đặt Node.js từ [nodejs.org](https://nodejs.org/)

2. **Clone repository**:
   ```
   git clone [URL repository]
   cd [tên thư mục]
   ```

3. **Cài đặt các thư viện cần thiết**:
   ```
   npm install
   ```

4. **Khởi động server**:
   ```
   npm start
   ```

5. **Truy cập ứng dụng**:
   - Mở trình duyệt và truy cập địa chỉ `http://localhost:3000`

## Công nghệ sử dụng

- Frontend: HTML, CSS, JavaScript (Vanilla)
- Backend: Node.js, Express, Socket.io

## Yêu cầu kỹ thuật

- Node.js (phiên bản 16 trở lên)
- Trình duyệt web hiện đại (Chrome, Firefox, Edge, Safari)

---

Chúc vui vẻ! 