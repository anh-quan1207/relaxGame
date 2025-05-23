/**
 * Chat Module - Xử lý chức năng chat trong game
 */

// Biến để lưu trữ thông tin người dùng và socket
let chatSocket;
let chatPlayerName = '';
let chatPlayerId = '';
let chatGameId = '';
let currentRoomState = '';
let DEBUG_CHAT = true; // Biến debug cho chat

// Phân loại phòng
const ROOM_STATE = {
    WAITING: 'waiting',
    PLAYING: 'playing'
};

/**
 * Khởi tạo module chat
 */
function initChat() {
    if (DEBUG_CHAT) console.log("Khởi tạo module chat");
    
    // Khởi tạo các event listener cho tính năng chat trong mỗi game
    initGameChat('chat-input', 'chat-send', 'chat-messages', 'number');
    initGameChat('word-chat-input', 'word-chat-send', 'word-chat-messages', 'word');
    initGameChat('word-waiting-chat-input', 'word-waiting-chat-send', 'word-waiting-chat-messages', 'word-waiting');
    
    // Đăng ký sự kiện khi socket được khởi tạo
    document.addEventListener('socketInitialized', function() {
        if (socket) {
            if (DEBUG_CHAT) console.log("Socket đã được khởi tạo, thiết lập chat với ID: " + socket.id);
            chatSocket = socket;
            chatGameId = gameId; // Đồng bộ với biến global
            chatPlayerId = myPlayerId; // Đồng bộ với biến global
            setupChatSocketEvents();
        }
    });
    
    // Đồng bộ các biến global khi có thay đổi
    document.addEventListener('gameIdChanged', function(e) {
        if (DEBUG_CHAT) console.log("gameId thay đổi: " + e.detail.gameId);
        chatGameId = e.detail.gameId;
    });
    
    document.addEventListener('playerIdChanged', function(e) {
        if (DEBUG_CHAT) console.log("playerId thay đổi: " + e.detail.playerId);
        chatPlayerId = e.detail.playerId;
    });
    
    // Khởi tạo ngay nếu socket đã tồn tại
    if (socket) {
        if (DEBUG_CHAT) console.log("Socket đã tồn tại, thiết lập chat ngay lập tức với ID: " + socket.id);
        chatSocket = socket;
        chatGameId = gameId; // Đồng bộ với biến global
        chatPlayerId = myPlayerId; // Đồng bộ với biến global
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
    
    if (!chatInput || !chatSendBtn || !chatMessages) {
        console.warn(`Không tìm thấy các phần tử chat cho ${gameType}`);
        return;
    }
    
    console.log(`Khởi tạo chat cho ${gameType}: input=${inputId}, button=${buttonId}, messages=${messagesId}`);
    
    // Sự kiện click nút gửi
    chatSendBtn.addEventListener('click', function() {
        console.log(`Nút gửi chat ${buttonId} được bấm`);
        sendChatMessage(chatInput, messagesId, gameType);
    });
    
    // Sự kiện nhấn Enter
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log(`Phím Enter được nhấn trong input ${inputId}`);
            e.preventDefault();
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
    
    // Sử dụng gameId từ biến global, không phụ thuộc vào chatGameId
    const currentGameId = gameId;
    console.log(`Gửi tin nhắn: "${message}" từ ${gameType}, gameId: ${currentGameId}`);
    
    if (!currentGameId) {
        console.error("Không thể gửi tin nhắn: gameId không tồn tại");
        return;
    }
    
    // Lấy tên người chơi hiện tại
    const playerName = (gameType === 'number' && myPlayerId) ? 
        players.find(p => p.id === myPlayerId)?.name || 'Bạn' : 
        'Bạn';
    
    // Kiểm tra kết nối socket
    if (chatSocket && isOnlineMode) {
        // Tạo event phù hợp dựa vào gameType
        let eventName = 'chat-message';
        if (gameType.includes('word')) {
            eventName = 'word-chat-message';
        }
        
        // Gửi tin nhắn lên server - QUAN TRỌNG: Dùng chatSocket thay vì socket
        console.log(`Emit ${eventName} đến server với gameId: ${currentGameId}`);
        chatSocket.emit(eventName, {
            gameId: currentGameId,
            message: message
        });
        
        // Thêm tin nhắn local vào khung chat để tránh độ trễ
        const messagesContainer = document.getElementById(messagesId);
        if (messagesContainer) {
            addChatMessage(messagesContainer, {
                sender: playerName,
                message: message,
                isSelf: true,
                timestamp: new Date().toISOString()
            });
        }
    } else {
        console.warn("Không thể gửi tin nhắn: chatSocket không tồn tại hoặc không ở chế độ online");
        // Chế độ offline - chỉ hiển thị tin nhắn của người dùng
        const messagesContainer = document.getElementById(messagesId);
        if (messagesContainer) {
            addChatMessage(messagesContainer, {
                sender: playerName,
                message: message,
                isSelf: true,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Xóa nội dung input
    inputElement.value = '';
}

/**
 * Thiết lập các sự kiện socket cho chat
 */
function setupChatSocketEvents() {
    if (!chatSocket) {
        console.error("Không thể thiết lập các sự kiện socket cho chat: chatSocket là null");
        return;
    }
    
    if (DEBUG_CHAT) console.log("Thiết lập các sự kiện socket cho chat");
    
    // Xử lý lịch sử chat khi tham gia phòng
    chatSocket.on('word-chat-history', function(data) {
        if (!data.messages || !Array.isArray(data.messages)) return;
        
        if (DEBUG_CHAT) console.log("Nhận lịch sử chat:", data.messages.length, "tin nhắn");
        
        // Xóa tin nhắn hiện có trong cả hai container
        const waitingMessages = document.getElementById('word-waiting-chat-messages');
        const gameMessages = document.getElementById('word-chat-messages');
        
        if (waitingMessages) waitingMessages.innerHTML = '';
        if (gameMessages) gameMessages.innerHTML = '';
        
        // Thêm các tin nhắn từ lịch sử
        data.messages.forEach(msg => {
            const containerToUse = (msg.roomState === ROOM_STATE.WAITING) ? 
                waitingMessages : gameMessages;
            
            if (containerToUse) {
                addChatMessage(containerToUse, {
                    sender: msg.senderName,
                    message: msg.message,
                    isSelf: msg.senderId === myPlayerId,
                    timestamp: msg.timestamp
                });
            }
        });
    });
    
    // Nhận tin nhắn từ server
    chatSocket.on('chat-message', function(data) {
        if (DEBUG_CHAT) console.log("Nhận tin nhắn chat-message:", data);
        
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
    
    // Nhận tin nhắn từ server cho game nối từ
    chatSocket.on('word-chat-message', function(data) {
        if (DEBUG_CHAT) console.log("Nhận tin nhắn word-chat-message:", data);
        
        // Xác định container tin nhắn phù hợp dựa trên trạng thái phòng
        const messagesId = (data.roomState === ROOM_STATE.WAITING) ? 
            'word-waiting-chat-messages' : 'word-chat-messages';
        
        const messagesContainer = document.getElementById(messagesId);
        if (!messagesContainer) {
            console.error(`Không tìm thấy container ${messagesId} cho tin nhắn:`, data);
            return;
        }
        
        // Xác định xem tin nhắn có phải của người dùng hiện tại không
        const isSelf = data.senderId === myPlayerId;
        
        if (DEBUG_CHAT) {
            console.log(`Thêm tin nhắn vào container ${messagesId}:`, {
                sender: data.senderName,
                message: data.message,
                isSelf: isSelf,
                container: messagesContainer
            });
        }
        
        // Kiểm tra xem tin nhắn này đã được hiển thị chưa (tránh duplicate)
        // Nếu là tin nhắn của chính mình và đã được hiển thị local, bỏ qua
        if (isSelf) {
            const existingMessages = messagesContainer.querySelectorAll('.chat-message.self');
            for (const existingMsg of existingMessages) {
                const contentEl = existingMsg.querySelector('.content');
                if (contentEl && contentEl.textContent === data.message) {
                    if (DEBUG_CHAT) console.log("Tin nhắn đã được hiển thị, bỏ qua:", data.message);
                    return;
                }
            }
        }
        
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
        const wordWaitingChatMessages = document.getElementById('word-waiting-chat-messages');
        
        const message = `${data.player.name} đã tham gia phòng`;
        if (numberChatMessages) addSystemMessage(numberChatMessages, message);
        if (wordChatMessages) addSystemMessage(wordChatMessages, message);
        if (wordWaitingChatMessages) addSystemMessage(wordWaitingChatMessages, message);
    });
    
    chatSocket.on('player-left', function(data) {
        if (!data.playerName) return;
        
        const numberChatMessages = document.getElementById('chat-messages');
        const wordChatMessages = document.getElementById('word-chat-messages');
        const wordWaitingChatMessages = document.getElementById('word-waiting-chat-messages');
        
        const message = `${data.playerName} đã rời khỏi phòng`;
        if (numberChatMessages) addSystemMessage(numberChatMessages, message);
        if (wordChatMessages) addSystemMessage(wordChatMessages, message);
        if (wordWaitingChatMessages) addSystemMessage(wordWaitingChatMessages, message);
    });
    
    // Cập nhật thông tin người chơi khi tham gia phòng
    chatSocket.on('game-joined', function(data) {
        chatGameId = data.gameId;
        chatPlayerId = data.player.id;
        chatPlayerName = data.player.name;
    });
    
    // Lắng nghe sự kiện game bắt đầu để cập nhật trạng thái phòng
    chatSocket.on('word-game-started', function(data) {
        currentRoomState = ROOM_STATE.PLAYING;
    });
    
    // Lắng nghe sự kiện game kết thúc để cập nhật trạng thái phòng
    chatSocket.on('word-game-over', function(data) {
        currentRoomState = ROOM_STATE.WAITING;
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