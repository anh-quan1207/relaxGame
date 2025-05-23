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
let players = [];
let isOnlineMode = false;

// DEBUG - Log các biến global
function logGlobalVars() {
    console.log("DEBUG: Biến global:", {
        gameId,
        myPlayerId,
        players,
        isHost,
        isOnlineMode,
        gameType
    });
}

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
 * Khởi tạo socket.io nếu chưa có
 */
function initializeSocket() {
    if (!socket) {
        console.log("Đang khởi tạo socket mới...");
        try {
            socket = io();
            isOnlineMode = true;
            
            // Lắng nghe các sự kiện chung
            socket.on('connect', () => {
                console.log('Socket đã kết nối: ' + socket.id);
                logGlobalVars();
            });
            
            socket.on('error', (data) => {
                console.error('Socket error:', data);
                showNotification('Có lỗi xảy ra: ' + data.message, true);
            });
            
            socket.on('connect_error', (error) => {
                console.error('Socket connect error:', error);
                showNotification('Không thể kết nối đến máy chủ. Vui lòng thử lại!', true);
            });
            
            // Thông báo cho các thành phần khác biết socket đã được khởi tạo
            const event = new Event('socketInitialized');
            document.dispatchEvent(event);
            
            console.log("Socket đã được khởi tạo thành công: ", socket.id);
            return socket;
        } catch (error) {
            console.error("Lỗi khi khởi tạo socket:", error);
            return null;
        }
    }
    return socket;
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

/**
 * Đặt gameId và thông báo thay đổi
 */
function setGameId(newGameId) {
    gameId = newGameId;
    console.log("GameId đã được đặt: " + gameId);
    
    // Phát sự kiện thông báo gameId đã thay đổi
    const event = new CustomEvent('gameIdChanged', { 
        detail: { gameId: newGameId }
    });
    document.dispatchEvent(event);
}

/**
 * Đặt playerId và thông báo thay đổi
 */
function setPlayerId(newPlayerId) {
    myPlayerId = newPlayerId;
    console.log("PlayerId đã được đặt: " + myPlayerId);
    
    // Phát sự kiện thông báo playerId đã thay đổi
    const event = new CustomEvent('playerIdChanged', { 
        detail: { playerId: newPlayerId }
    });
    document.dispatchEvent(event);
}

// Khởi tạo sự kiện khi trang load
document.addEventListener('DOMContentLoaded', () => {
    initCommonEvents();
    
    // Hiển thị màn hình chọn game
    showSection(gameSelectSection);
}); 