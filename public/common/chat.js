/**
 * Chat Module - Xử lý chức năng chat trong game
 */

// Biến để lưu trữ thông tin người dùng và socket
let chatSocket;
let chatPlayerName = '';
let chatPlayerId = '';
let chatGameId = '';

/**
 * Khởi tạo module chat
 */
function initChat() {
    // Khởi tạo các event listener cho tính năng chat trong mỗi game
    initGameChat('chat-input', 'chat-send', 'chat-messages', 'number');
    initGameChat('word-chat-input', 'word-chat-send', 'word-chat-messages', 'word');
    
    // Đăng ký sự kiện khi socket được khởi tạo
    document.addEventListener('socketInitialized', function() {
        if (socket) {
            chatSocket = socket;
            setupChatSocketEvents();
        }
    });
    
    // Khởi tạo ngay nếu socket đã tồn tại
    if (socket) {
        chatSocket = socket;
        setupChatSocketEvents();
    }
}

/**
 * Khởi tạo sự kiện cho chat từng loại game
 */
function initGameChat(inputId, buttonId, messagesId, gameType) {
    const chatInput = document.getElementById(inputId);
    const chatSendBtn = document.getElementById(buttonId);
    const chatMessages = document.getElementById(messagesId);
    
    // Sự kiện click nút gửi
    chatSendBtn.addEventListener('click', function() {
        sendChatMessage(chatInput, messagesId, gameType);
    });
    
    // Sự kiện nhấn Enter
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage(chatInput, messagesId, gameType);
        }
    });
    
    // Thêm tin nhắn hệ thống chào mừng
    addSystemMessage(chatMessages, 'Chào mừng đến với chat. Hãy gửi tin nhắn để trò chuyện!');
}

/**
 * Gửi tin nhắn chat
 */
function sendChatMessage(inputElement, messagesId, gameType) {
    const message = inputElement.value.trim();
    
    if (message === '') return;
    
    // Lấy tên người chơi hiện tại
    const playerName = (gameType === 'number' && myPlayerId) ? 
        players.find(p => p.id === myPlayerId)?.name || 'Bạn' : 
        'Bạn';
    
    // Kiểm tra kết nối socket
    if (chatSocket && isOnlineMode) {
        // Gửi tin nhắn lên server
        chatSocket.emit('chat-message', {
            gameId: gameId,
            message: message,
            gameType: gameType
        });
    } else {
        // Chế độ offline - chỉ hiển thị tin nhắn của người dùng
        const messagesContainer = document.getElementById(messagesId);
        addChatMessage(messagesContainer, {
            sender: playerName,
            message: message,
            isSelf: true,
            timestamp: new Date().toISOString()
        });
    }
    
    // Xóa nội dung input
    inputElement.value = '';
}

/**
 * Thiết lập các sự kiện socket cho chat
 */
function setupChatSocketEvents() {
    if (!chatSocket) return;
    
    // Nhận tin nhắn từ server
    chatSocket.on('chat-message', function(data) {
        // Xác định container tin nhắn phù hợp dựa trên gameType
        const messagesId = data.gameType === 'word' ? 'word-chat-messages' : 'chat-messages';
        const messagesContainer = document.getElementById(messagesId);
        
        // Xác định xem tin nhắn có phải của người dùng hiện tại không
        const isSelf = data.senderId === myPlayerId;
        
        // Thêm tin nhắn vào container
        addChatMessage(messagesContainer, {
            sender: data.senderName,
            message: data.message,
            isSelf: isSelf,
            timestamp: data.timestamp
        });
    });
    
    // Thông báo người chơi tham gia/rời phòng
    chatSocket.on('player-joined', function(data) {
        if (!data.player || !data.player.name) return;
        
        const numberChatMessages = document.getElementById('chat-messages');
        const wordChatMessages = document.getElementById('word-chat-messages');
        
        const message = `${data.player.name} đã tham gia phòng`;
        addSystemMessage(numberChatMessages, message);
        addSystemMessage(wordChatMessages, message);
    });
    
    chatSocket.on('player-left', function(data) {
        if (!data.playerName) return;
        
        const numberChatMessages = document.getElementById('chat-messages');
        const wordChatMessages = document.getElementById('word-chat-messages');
        
        const message = `${data.playerName} đã rời khỏi phòng`;
        addSystemMessage(numberChatMessages, message);
        addSystemMessage(wordChatMessages, message);
    });
    
    // Cập nhật thông tin người chơi khi tham gia phòng
    chatSocket.on('game-joined', function(data) {
        chatGameId = data.gameId;
        chatPlayerId = data.player.id;
        chatPlayerName = data.player.name;
    });
}

/**
 * Thêm tin nhắn vào container
 */
function addChatMessage(container, messageData) {
    if (!container) return;
    
    // Tạo phần tử tin nhắn mới
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${messageData.isSelf ? 'self' : 'other'}`;
    
    // Thêm HTML nội dung tin nhắn
    const timestamp = new Date(messageData.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageElement.innerHTML = `
        ${!messageData.isSelf ? `<div class="sender">${messageData.sender}</div>` : ''}
        <div class="content">${escapeHTML(messageData.message)}</div>
        <div class="time">${timestamp}</div>
    `;
    
    // Thêm vào container
    container.appendChild(messageElement);
    
    // Cuộn xuống cuối
    container.scrollTop = container.scrollHeight;
}

/**
 * Thêm tin nhắn hệ thống
 */
function addSystemMessage(container, message) {
    if (!container) return;
    
    // Tạo phần tử tin nhắn hệ thống
    const systemMessage = document.createElement('div');
    systemMessage.className = 'system-message';
    systemMessage.textContent = message;
    
    // Thêm vào container
    container.appendChild(systemMessage);
    
    // Cuộn xuống cuối
    container.scrollTop = container.scrollHeight;
}

/**
 * Escape HTML để tránh XSS
 */
function escapeHTML(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Khởi tạo module chat khi trang được tải
document.addEventListener('DOMContentLoaded', initChat); 