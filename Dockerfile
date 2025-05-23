FROM node:16-alpine

WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependency
RUN npm install

# Sao chép mã nguồn
COPY . .

# Mở cổng 3000
EXPOSE 3000

# Khởi động ứng dụng
CMD ["node", "server.js"] 