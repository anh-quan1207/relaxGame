# Hướng dẫn triển khai dự án lên Render

Đây là hướng dẫn chi tiết cách triển khai bộ sưu tập game mini lên Render.

## Các bước triển khai

### 1. Tạo tài khoản Render

1. Truy cập [Render.com](https://render.com/)
2. Nhấn vào nút "Sign Up" để tạo tài khoản mới
3. Bạn có thể đăng ký bằng GitHub, GitLab hoặc email

### 2. Đẩy code lên GitHub

Trước khi triển khai lên Render, bạn cần phải đưa dự án lên GitHub:

1. Tạo repository mới trên GitHub
2. Mở terminal trên máy tính và thực hiện các lệnh sau:

```bash
# Di chuyển đến thư mục dự án
cd đường_dẫn_đến_thư_mục_dự_án

# Khởi tạo Git repository (nếu chưa có)
git init

# Thêm tất cả file vào Git
git add .

# Commit các thay đổi
git commit -m "Initial commit"

# Liên kết với repository GitHub (thay YOUR_USERNAME và YOUR_REPO_NAME bằng thông tin của bạn)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Đẩy code lên GitHub
git push -u origin main
# hoặc
git push -u origin master
```

### 3. Triển khai lên Render

1. Đăng nhập vào [dashboard.render.com](https://dashboard.render.com/)

2. Nhấn vào nút "New +" và chọn "Web Service"

3. Kết nối với GitHub repository:
   - Nhấn vào "Connect account" nếu chưa kết nối GitHub
   - Tìm và chọn repository của dự án

4. Cấu hình dịch vụ:
   - **Name**: Đặt tên cho dịch vụ (ví dụ: mini-games-collection)
   - **Environment**: Chọn "Node"
   - **Region**: Chọn region gần vị trí của bạn (ví dụ: Singapore hoặc US West)
   - **Branch**: main (hoặc master tùy vào branch chính của bạn)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan Type**: Free

5. Nhấn vào nút "Create Web Service"

6. Đợi vài phút để Render build và triển khai dịch vụ

### 4. Kiểm tra và sử dụng

1. Sau khi triển khai hoàn tất, Render sẽ cung cấp một URL cho ứng dụng của bạn (dạng https://tên-dịch-vụ.onrender.com)

2. Nhấn vào URL đó hoặc sao chép và dán vào trình duyệt để truy cập ứng dụng

3. Kiểm tra xem các tính năng của game có hoạt động bình thường không:
   - Tạo phòng online
   - Tham gia phòng
   - Chơi game

4. Cập nhật URL vào file README.md để chia sẻ với mọi người

## Lưu ý khi sử dụng Render miễn phí

1. **Thời gian ngủ**: Dịch vụ miễn phí trên Render sẽ "ngủ" sau 15 phút không có lưu lượng truy cập và mất khoảng 30 giây để "thức dậy" khi có người truy cập

2. **Giới hạn sử dụng**: Dịch vụ miễn phí có giới hạn về tài nguyên và băng thông

3. **Duy trì hoạt động**: Nếu muốn tránh dịch vụ "ngủ", bạn có thể sử dụng các dịch vụ ping tự động như UptimeRobot để gửi request định kỳ đến ứng dụng

4. **Cập nhật**: Để cập nhật ứng dụng, chỉ cần push code mới lên GitHub, Render sẽ tự động triển khai lại

## Khắc phục sự cố

Nếu gặp vấn đề trong quá trình triển khai, bạn có thể:

1. Kiểm tra log trên Render để biết lỗi cụ thể
2. Kiểm tra xem ứng dụng có chạy được locally không
3. Kiểm tra cấu hình trong file `package.json` và `Procfile`

---

Chúc bạn thành công trong việc triển khai ứng dụng! 