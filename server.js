/**
 * Mini Game Collection - Server
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Import các module game
const { initNumberGameHandlers } = require('./server/number-game/number-game');
const { initWordGameHandlers } = require('./server/word-game/word-game');

// Khởi tạo Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Phục vụ các file tĩnh
app.use(express.static(path.join(__dirname)));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
    console.log('Người dùng đã kết nối:', socket.id);

    // Khởi tạo các event handler cho từng loại game
    initNumberGameHandlers(io, socket);
    initWordGameHandlers(io, socket);
    
    // Xử lý ngắt kết nối chung
    socket.on('disconnect', () => {
        console.log('Người dùng đã ngắt kết nối:', socket.id);
    });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
}); 