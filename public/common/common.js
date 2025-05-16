/**
 * Các chức năng dùng chung cho cả hai game
 */

// Các phần tử DOM - Menu chọn game
const gameSelectSection = document.getElementById('game-select');
const numberGameBtn = document.getElementById('number-game-btn');
const wordChainBtn = document.getElementById('word-chain-btn');
const backToGamesBtn = document.getElementById('back-to-games');
const wordBackToGamesBtn = document.getElementById('word-back-to-games');

// Menu chính cho game số
const mainMenu = document.getElementById('main-menu');

// Menu chính cho game nối từ
const wordMainMenu = document.getElementById('word-main-menu');

// Các phần tử DOM - Thông báo
const notification = document.getElementById('notification');
const notificationContent = document.getElementById('notification-content');

// Biến trạng thái game hiện tại
let gameType = null; // 'number' hoặc 'word'

// Biến trạng thái kết nối
let socket = null;
let gameId = null;
let isHost = false;
let myPlayerId = null;

/**
 * Khởi tạo các event listener chung
 */
function initCommonEvents() {
    // Đăng ký sự kiện cho menu chọn game
    numberGameBtn.addEventListener('click', () => {
        showSection(mainMenu);
        hideSection(gameSelectSection);
        gameType = 'number';
    });

    wordChainBtn.addEventListener('click', () => {
        showSection(wordMainMenu);
        hideSection(gameSelectSection);
        gameType = 'word';
    });

    backToGamesBtn.addEventListener('click', () => {
        showSection(gameSelectSection);
        hideSection(mainMenu);
        gameType = null;
    });

    wordBackToGamesBtn.addEventListener('click', () => {
        showSection(gameSelectSection);
        hideSection(wordMainMenu);
        gameType = null;
    });
}

/**
 * Khởi tạo kết nối socket
 */
function initializeSocket() {
    if (!socket) {
        console.log('Khởi tạo kết nối socket.io...');
        
        // Kiểm tra xem io có tồn tại không (từ socket.io)
        if (typeof io === 'undefined') {
            console.warn('Socket.IO chưa được tải, đang thử tải lại...');
            
            // Thử tải thư viện Socket.IO theo cách thủ công
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
            script.async = true;
            script.onload = function() {
                console.log('Socket.IO đã được tải thành công, đang kết nối...');
                // Sau khi tải, thử kết nối lại
                initializeSocketConnection();
            };
            script.onerror = function() {
                console.error('Không thể tải thư viện Socket.IO.');
                showNotification('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại!', true);
            };
            document.head.appendChild(script);
            return null;
        }
        
        return initializeSocketConnection();
    }
    return socket;
}

/**
 * Khởi tạo kết nối socket sau khi thư viện đã tải
 */
function initializeSocketConnection() {
    try {
        socket = io();
        
        // Lắng nghe các sự kiện chung
        socket.on('connect', () => {
            console.log('Socket đã kết nối: ' + socket.id);
        });
        
        socket.on('error', (data) => {
            console.error('Socket error:', data);
            handleError(data);
        });
        
        socket.on('connect_error', (error) => {
            console.error('Socket connect error:', error);
            showNotification('Không thể kết nối đến máy chủ. Vui lòng thử lại!', true);
        });
        
        // Phát sự kiện thông báo socket đã được khởi tạo
        console.log('Đang phát sự kiện socketInitialized');
        const socketEvent = new Event('socketInitialized');
        document.dispatchEvent(socketEvent);
        
        return socket;
    } catch (error) {
        console.error('Lỗi khi khởi tạo socket:', error);
        showNotification('Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại!', true);
        return null;
    }
}

/**
 * Ngắt kết nối socket
 */
function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * Xử lý lỗi từ server
 */
function handleError(data) {
    showNotification(data.message, true);
}

/**
 * Hiển thị một phần trên giao diện
 */
function showSection(section) {
    section.classList.remove('hidden');
}

/**
 * Ẩn một phần trên giao diện
 */
function hideSection(section) {
    section.classList.add('hidden');
}

/**
 * Hiển thị thông báo
 */
function showNotification(message, isError = false) {
    notificationContent.textContent = message;
    notification.classList.remove('hidden');
    
    if (isError) {
        notification.classList.add('error');
    } else {
        notification.classList.remove('error');
    }
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

/**
 * Xáo trộn mảng (thuật toán Fisher-Yates)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Khởi tạo sự kiện khi trang load
document.addEventListener('DOMContentLoaded', () => {
    initCommonEvents();
    
    // Hiển thị màn hình chọn game
    showSection(gameSelectSection);
}); 