# Transport Driver App

Ứng dụng web cho tài xế vận tải, bao gồm các tính năng:
1. **Tạo Phiếu Vận Tải**: Lưu nháp hoặc gửi phiếu.
2. **Danh Sách Phiếu**: Quản lý phiếu nháp, xem trạng thái phiếu đã gửi (Chờ duyệt/Đã duyệt). Bộ lọc theo trạng thái và thời gian.
3. **Phiếu Lương**: Xem lương tóm tắt và chi tiết theo tháng.

## Yêu cầu hệ thống

Để chạy dự án này, bạn cần cài đặt **Node.js**:
- Tải về tại: [https://nodejs.org/](https://nodejs.org/)

## Hướng dẫn cài đặt và chạy

1. Mở Terminal (Command Prompt hoặc PowerShell) tại thư mục dự án `driver-app`.
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Chạy ứng dụng:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và truy cập địa chỉ được hiển thị (thường là `http://localhost:5173`).

## Công nghệ sử dụng
- React + Vite
- React Router DOM
- CSS Variables (Custom Theme)
- LocalStorage (Lưu dữ liệu trên trình duyệt)
