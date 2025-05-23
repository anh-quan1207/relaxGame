// Biến game nối từ
let wordTimer;
let currentWord = "";
let turnNotificationModal; // Biến lưu trữ modal thông báo lượt chơi
let playerReadyForNextGame = false; // Biến theo dõi người chơi đã sẵn sàng cho game tiếp theo chưa

// Phân loại phòng
const ROOM_STATE = {
    WAITING: 'waiting',
    PLAYING: 'playing'
};

// Biến lưu trạng thái phòng hiện tại
let currentRoomState = ROOM_STATE.WAITING;

// Các phần tử DOM - Menu game nối từ
// wordMainMenu đã được khai báo trong common.js, không khai báo lại
// const wordMainMenu = document.getElementById('word-main-menu');
const wordCreateOnlineBtn = document.getElementById('word-create-online-btn');
const wordJoinOnlineBtn = document.getElementById('word-join-online-btn');

// Các phần tử DOM - Tạo phòng online game nối từ
const wordCreateOnlineSection = document.getElementById('word-create-online');
const wordCreatorNameInput = document.getElementById('word-creator-name');
const wordOnlinePlayerCountSelect = document.getElementById('word-online-player-count');
const wordCreateRoomButton = document.getElementById('word-create-room-btn');
const wordBackFromCreateButton = document.getElementById('word-back-from-create');

// Các phần tử DOM - Tham gia phòng game nối từ
const wordJoinOnlineSection = document.getElementById('word-join-online');
const wordJoinerNameInput = document.getElementById('word-joiner-name');
const wordRoomIdInput = document.getElementById('word-room-id');
const wordJoinRoomButton = document.getElementById('word-join-room-btn');
const wordBackFromJoinButton = document.getElementById('word-back-from-join');

// Các phần tử DOM - Phòng chờ game nối từ
const wordOnlineWaitingSection = document.getElementById('word-online-waiting');
const wordRoomIdDisplay = document.getElementById('word-room-id-display');
const wordOnlinePlayersList = document.getElementById('word-online-players-list');
const wordStartOnlineGameButton = document.getElementById('word-start-online-game');
const wordLeaveRoomButton = document.getElementById('word-leave-room');

// Các phần tử DOM - Game nối từ
const wordGameSection = document.getElementById('word-game');
const wordCurrentPlayerDisplay = document.getElementById('word-current-player');
const timerCountdown = document.getElementById('timer-countdown');
const wordChainDisplay = document.getElementById('word-chain-display');
const wordInputArea = document.getElementById('word-input-area');
const wordInput = document.getElementById('word-input');
const wordSubmitBtn = document.getElementById('word-submit-btn');
const wordVoteArea = document.getElementById('word-vote-area');
const wordVoteQuestion = document.getElementById('word-vote-question');
const voteYesBtn = document.getElementById('vote-yes');
const voteNoBtn = document.getElementById('vote-no');
const wordScoreBoard = document.getElementById('word-score-board');

// Các phần tử DOM - Kết quả game nối từ
const wordResultsSection = document.getElementById('word-results');
const wordLoserDisplay = document.getElementById('word-loser');
const wordChainResult = document.getElementById('word-chain-result');
const wordPlayAgainButton = document.getElementById('word-play-again');
const wordBackToMenuFromResultsButton = document.getElementById('word-back-to-menu-from-results');

// Các phần tử DOM - Modal thông báo lượt chơi
const turnNotificationModalElement = document.getElementById('turn-notification-modal');
const turnNotificationMessage = document.getElementById('turn-notification-message');

// Đăng ký sự kiện cho menu game nối từ
wordCreateOnlineBtn.addEventListener('click', () => {
    const socketInstance = initializeSocket();
    if (socketInstance) {
        showSection(wordCreateOnlineSection);
        hideSection(wordMainMenu);
    } else {
        console.warn('Không thể khởi tạo socket, đang thử lại...');
        setTimeout(() => {
            const retrySocket = initializeSocket();
            if (retrySocket) {
                showSection(wordCreateOnlineSection);
                hideSection(wordMainMenu);
            }
        }, 1000);
    }
});

wordJoinOnlineBtn.addEventListener('click', () => {
    const socketInstance = initializeSocket();
    if (socketInstance) {
        showSection(wordJoinOnlineSection);
        hideSection(wordMainMenu);
    } else {
        console.warn('Không thể khởi tạo socket, đang thử lại...');
        setTimeout(() => {
            const retrySocket = initializeSocket();
            if (retrySocket) {
                showSection(wordJoinOnlineSection);
                hideSection(wordMainMenu);
            }
        }, 1000);
    }
});

// Đăng ký sự kiện cho tạo phòng nối từ
wordBackFromCreateButton.addEventListener('click', () => {
    showSection(wordMainMenu);
    hideSection(wordCreateOnlineSection);
    disconnectSocket();
});

wordCreateRoomButton.addEventListener('click', () => {
    const playerName = wordCreatorNameInput.value.trim();
    if (!playerName) {
        showNotification('Vui lòng nhập tên của bạn', true);
        return;
    }

    socket.emit('create-word-game', {
        playerName
    });
});

// Đăng ký sự kiện cho tham gia phòng nối từ
wordBackFromJoinButton.addEventListener('click', () => {
    showSection(wordMainMenu);
    hideSection(wordJoinOnlineSection);
    disconnectSocket();
});

wordJoinRoomButton.addEventListener('click', () => {
    const playerName = wordJoinerNameInput.value.trim();
    const roomId = wordRoomIdInput.value.trim();

    if (!playerName) {
        showNotification('Vui lòng nhập tên của bạn', true);
        return;
    }

    if (!roomId) {
        showNotification('Vui lòng nhập mã phòng', true);
        return;
    }

    socket.emit('join-word-game', {
        playerName,
        gameId: roomId
    });
});

// Đăng ký sự kiện cho phòng chờ nối từ
wordLeaveRoomButton.addEventListener('click', () => {
    if (gameId) {
        socket.emit('leave-word-game', { gameId });
    }
    showSection(wordMainMenu);
    hideSection(wordOnlineWaitingSection);
    hideSection(wordGameSection);
    disconnectSocket();
});

wordStartOnlineGameButton.addEventListener('click', () => {
    if (gameId) {
        socket.emit('start-word-game', { gameId });
    }
});

// Đăng ký sự kiện cho game nối từ
wordSubmitBtn.addEventListener('click', submitWord);

wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Ngăn chặn hành vi mặc định của Enter
        submitWord(); // Sử dụng hàm submitWord có kiểm tra lượt chơi
    }
});

// Đăng ký sự kiện cho kết quả nối từ
wordPlayAgainButton.addEventListener('click', () => {
    playerReadyForNextGame = true; // Đánh dấu người chơi đã sẵn sàng
    showSection(wordOnlineWaitingSection);
    hideSection(wordResultsSection);
    currentRoomState = ROOM_STATE.WAITING;
});

wordBackToMenuFromResultsButton.addEventListener('click', () => {
    playerReadyForNextGame = false; // Đặt lại trạng thái sẵn sàng
    showSection(wordMainMenu);
    hideSection(wordResultsSection);
    disconnectSocket();
});

// Sự kiện cho nút báo cáo từ
wordChainDisplay.addEventListener('click', function(e) {
    // Kiểm tra xem nút báo cáo có được nhấn không
    if (e.target.classList.contains('word-report-btn')) {
        // Lấy thông tin từ và playerId từ data attributes
        const word = e.target.dataset.word;
        const playerId = e.target.dataset.playerId;
        
        // Chỉ cho phép báo cáo nếu có từ và không phải từ của mình
        if (gameId && word && playerId !== myPlayerId) {
            socket.emit('report-word', {
                gameId,
                word: word
            });
            
            // Disable nút sau khi báo cáo
            e.target.disabled = true;
            e.target.textContent = 'Đã báo cáo';
            
            // Thông báo đã báo cáo
            showNotification('Đã gửi báo cáo từ không hợp lý');
        }
    }
});

// Khởi tạo và đăng ký sự kiện Socket.IO cho game nối từ
function initWordGameSockets() {
    console.log('Initializing word game sockets...');
    
    // Xử lý sự kiện tạo game nối từ thành công
    socket.on('word-game-created', handleWordGameCreated);
    
    // Xử lý sự kiện tham gia game nối từ thành công
    socket.on('word-game-joined', handleWordGameJoined);
    
    // Xử lý sự kiện người chơi mới tham gia
    socket.on('word-player-joined', updateWordPlayersList);
    
    // Xử lý sự kiện người chơi rời phòng
    socket.on('word-player-left', handleWordPlayerLeft);
    
    // Xử lý sự kiện bắt đầu game
    socket.on('word-game-started', handleWordGameStarted);
    
    // Xử lý sự kiện cập nhật turn
    socket.on('word-turn-update', handleWordTurnUpdate);
    
    // Xử lý sự kiện cập nhật chuỗi từ
    socket.on('word-chain-update', handleWordChainUpdate);
    
    // Xử lý sự kiện cập nhật timer
    socket.on('word-timer-update', handleWordTimerUpdate);
    
    // Xử lý sự kiện kết thúc game
    socket.on('word-game-over', handleWordGameOver);
    
    // Xử lý sự kiện nhận báo cáo
    socket.on('report-received', handleReportReceived);
    
    // Xử lý sự kiện từ bị báo cáo thành công
    socket.on('word-reported', handleWordReported);
    
    // Xử lý phản hồi khi server nhận từ
    socket.on('word-submission-received', function(data) {
        // Chỉ khi đó mới disable input và nút gửi
        if (wordInput) wordInput.disabled = true;
        if (wordSubmitBtn) wordSubmitBtn.disabled = true;
    });
    
    // Xử lý phản hồi khi server từ chối từ
    socket.on('word-submission-rejected', function(data) {
        // Đặt cờ để không hiển thị thông báo lượt chơi mới sau lỗi
        window.wordErrorOccurred = true;
        
        // Bật lại input và nút gửi nếu từ bị từ chối
        if (wordInput) {
            wordInput.disabled = false;
            wordInput.focus();
        }
        if (wordSubmitBtn) wordSubmitBtn.disabled = false;
        
        // Hiển thị thông báo lỗi nổi bật và rõ ràng
        showNotification(data.message, true);
        
        // Thêm hiệu ứng rung cho input box
        if (wordInput) {
            wordInput.classList.add('shake-error');
            setTimeout(() => {
                wordInput.classList.remove('shake-error');
            }, 500);
        }
    });
    
    // Xử lý lỗi từ server - CHÚ Ý: Đặt trước các event handler khác để ưu tiên xử lý
    socket.on('error', (data) => {
        // Hiển thị lỗi từ server dưới dạng notification
        showNotification(data.message, true);
        console.log('Socket error:', data);
        
        // Nếu lỗi là về từ không hợp lệ, bật lại input để người chơi nhập lại
        if (data.message.includes('Từ mới phải bắt đầu bằng')) {
            if (wordInput) wordInput.disabled = false;
            if (wordSubmitBtn) wordSubmitBtn.disabled = false;
            if (wordInput) wordInput.focus();
            
            // Quan trọng: Đặt cờ hiệu để không hiển thị modal thông báo lượt mới
            window.wordErrorOccurred = true;
        }
    });
    
    // Thêm các sự kiện lắng nghe cho hệ thống báo cáo mới
    socket.on('report-vote-request', handleReportVoteRequest);
    socket.on('report-vote-update', handleReportVoteUpdate);
    socket.on('report-rejected', handleReportRejected);
    socket.on('report-initiated', handleReportInitiated);
    
    // Xử lý tin nhắn chat
    socket.on('word-chat-message', function(data) {
        console.log("Nhận tin nhắn chat từ server:", data);
        
        // Đảm bảo đây là tin nhắn chat, không phải từ trong game
        if (!data.type || data.type !== 'chat') {
            console.warn("Nhận sự kiện word-chat-message không phải cho chat:", data);
            return;
        }
        
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
        
        // Nếu là tin nhắn của mình và đã hiển thị local, bỏ qua
        if (isSelf) {
            const existingMessages = messagesContainer.querySelectorAll('.chat-message.self');
            for (const existingMsg of existingMessages) {
                const contentEl = existingMsg.querySelector('.content');
                if (contentEl && contentEl.textContent === data.message) {
                    console.log("Tin nhắn đã được hiển thị local, bỏ qua:", data.message);
                    return;
                }
            }
        }
        
        // Thêm tin nhắn vào container
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isSelf ? 'self' : 'other'}`;
        
        // Thêm HTML nội dung tin nhắn
        const timestamp = new Date(data.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageElement.innerHTML = `
            ${!isSelf ? `<div class="sender">${data.senderName}</div>` : ''}
            <div class="content">${escapeHTML(data.message)}</div>
            <div class="time">${timestamp}</div>
        `;
        
        // Thêm vào container
        messagesContainer.appendChild(messageElement);
        
        // Cuộn xuống cuối
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
    
    console.log('Word game sockets initialized successfully');
}

// Xử lý sự kiện tạo game nối từ thành công
function handleWordGameCreated(data) {
    // Sử dụng setGameId và setPlayerId thay vì gán trực tiếp
    setGameId(data.gameId);
    setPlayerId(data.player.id);
    isHost = data.isHost;
    gameType = 'word';
    currentRoomState = ROOM_STATE.WAITING;
    
    wordRoomIdDisplay.textContent = `Mã phòng: ${gameId}`;
    
    updateWordPlayersList({
        players: data.gameInfo.players
    });
    
    showSection(wordOnlineWaitingSection);
    hideSection(wordCreateOnlineSection);
}

// Xử lý sự kiện tham gia game nối từ thành công
function handleWordGameJoined(data) {
    // Sử dụng setGameId và setPlayerId thay vì gán trực tiếp
    setGameId(data.gameId);
    setPlayerId(data.player.id);
    isHost = data.isHost;
    gameType = 'word';
    currentRoomState = ROOM_STATE.WAITING;
    
    wordRoomIdDisplay.textContent = `Mã phòng: ${gameId}`;
    
    updateWordPlayersList({
        players: data.gameInfo.players
    });
    
    showSection(wordOnlineWaitingSection);
    hideSection(wordJoinOnlineSection);
}

// Cập nhật danh sách người chơi trong phòng chờ nối từ
function updateWordPlayersList(data) {
    const players = data.players;
    wordOnlinePlayersList.innerHTML = '';
    
    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        if (players[0].id === player.id) {
            const hostLabel = document.createElement('span');
            hostLabel.className = 'host-label';
            hostLabel.textContent = 'Host';
            playerItem.appendChild(hostLabel);
        }
        
        const playerName = document.createElement('span');
        playerName.textContent = player.name + (player.id === myPlayerId ? ' (bạn)' : '');
        playerItem.appendChild(playerName);
        
        wordOnlinePlayersList.appendChild(playerItem);
    });
    
    // Hiển thị nút bắt đầu cho người chủ phòng khi đủ người chơi
    if (isHost && players.length >= 2) {
        wordStartOnlineGameButton.classList.remove('hidden');
        
        // Thêm thông báo số người chơi hiện tại
        const playersCountInfo = document.createElement('div');
        playersCountInfo.className = 'players-count-info';
        playersCountInfo.textContent = `Số người chơi hiện tại: ${players.length}`;
        
        // Thêm vào trước hoặc sau danh sách người chơi
        const existingInfo = document.querySelector('.players-count-info');
        if (existingInfo) {
            existingInfo.textContent = `Số người chơi hiện tại: ${players.length}`;
        } else {
            // Sửa lỗi: Thêm trực tiếp vào wordOnlineWaitingSection thay vì dùng nextElementSibling
            if (wordStartOnlineGameButton && wordStartOnlineGameButton.parentNode === wordOnlineWaitingSection) {
                // Thêm vào trước nút bắt đầu
                wordOnlineWaitingSection.insertBefore(playersCountInfo, wordStartOnlineGameButton);
            } else {
                // Thêm vào cuối nếu không tìm thấy nút bắt đầu
                wordOnlineWaitingSection.appendChild(playersCountInfo);
            }
        }
    } else {
        wordStartOnlineGameButton.classList.add('hidden');
    }
}

// Xử lý sự kiện người chơi rời phòng nối từ
function handleWordPlayerLeft(data) {
    updateWordPlayersList(data);
    showNotification(`${data.playerName} đã rời phòng.`);
}

// Xử lý sự kiện bắt đầu game nối từ
function handleWordGameStarted(data) {
    console.log('Game started:', data);
    
    // Kiểm tra xem người chơi có sẵn sàng tham gia game mới không
    // Nếu người chơi vẫn đang ở màn hình kết quả và chưa bấm "Chơi lại", hiển thị thông báo
    if (!playerReadyForNextGame && document.getElementById('word-results').classList.contains('active')) {
        showNotification('Chủ phòng đã bắt đầu game mới. Hãy bấm "Chơi lại" để tham gia!', true);
        return;
    }
    
    gameType = 'word';
    currentRoomState = ROOM_STATE.PLAYING;
    
    // Cập nhật danh sách người chơi
    updateWordScoreBoard(data.gameInfo.players);
    
    // Hiển thị giao diện game
    showSection(wordGameSection);
    hideSection(wordOnlineWaitingSection);
    
    // Reset giao diện game
    wordChainDisplay.innerHTML = '';
    
    // Bây giờ là phần khởi tạo giao diện game đã chuyển thành modular và tái sử dụng
    initializeWordGameInterface();
}

// Xử lý sự kiện cập nhật turn chơi nối từ
function handleWordTurnUpdate(data) {
    // Lấy thông tin người chơi hiện tại
    const currentPlayerId = data.currentPlayerId;
    const currentPlayerName = data.currentPlayerName;
    const lastWord = data.lastWord;
    
    // Cập nhật hiển thị người chơi hiện tại
    wordCurrentPlayerDisplay.innerHTML = `<strong>Lượt chơi:</strong> ${currentPlayerName}`;
    
    // Kiểm tra xem có phải lượt của mình không
    const isMyTurn = currentPlayerId === myPlayerId;
    
    // Hiển thị hoặc ẩn khu vực nhập từ tùy thuộc vào lượt chơi
    if (isMyTurn) {
        // Nếu là lượt của mình, hiển thị input và reset nó
        wordInputArea.classList.remove('hidden');
        wordInput.value = '';
        wordInput.disabled = false;
        wordSubmitBtn.disabled = false;
        
        // Focus vào ô input
        setTimeout(() => {
            wordInput.focus();
        }, 300);
        
        // Nếu có từ cuối cùng, thêm gợi ý
        if (lastWord) {
            const lastWordParts = lastWord.split(' ');
            const lastPart = lastWordParts[lastWordParts.length - 1];
            wordInput.placeholder = `Nhập từ bắt đầu bằng "${lastPart}"...`;
        } else {
            wordInput.placeholder = 'Hãy nhập từ đầu tiên...';
        }
    } else {
        // Nếu không phải lượt của mình, ẩn input
        wordInputArea.classList.add('hidden');
    }
    
    // Kiểm tra nếu không có lỗi từ trước đó, hiển thị thông báo lượt chơi mới
    if (!window.wordErrorOccurred) {
        // Hiển thị thông báo lượt chơi dưới dạng modal
        showTurnNotification(currentPlayerName, isMyTurn);
    } else {
        // Reset cờ hiệu lỗi
        window.wordErrorOccurred = false;
    }
}

// Hiển thị thông báo lượt chơi mới
function showTurnNotification(playerName, isMyTurn) {
    const modal = document.getElementById('turn-notification-modal');
    const message = document.getElementById('turn-notification-message');
    
    if (!modal || !message) return;
    
    // Thiết lập nội dung thông báo
    if (isMyTurn) {
        message.innerHTML = `Đến lượt của <strong>bạn</strong>!`;
        message.classList.add('my-turn');
    } else {
        message.innerHTML = `Đến lượt của <strong>${playerName}</strong>`;
        message.classList.remove('my-turn');
    }
    
    // Hiển thị modal
    modal.classList.remove('hidden');
    
    // Tự động ẩn sau 2 giây
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 2000);
}

// Xử lý sự kiện cập nhật chuỗi từ
function handleWordChainUpdate(data) {
    // Kiểm tra xem đây có phải là từ trong game hay không
    if (!data.type || data.type !== 'game-word') {
        console.warn("Nhận sự kiện word-chain-update không phải cho từ trong game:", data);
        return;
    }
    
    console.log("Cập nhật chuỗi từ trong game:", data);
    
    // Thêm từ mới vào chuỗi
    const wordElement = document.createElement('div');
    wordElement.className = 'word-item';
    
    // Tô màu từ của mình để phân biệt
    if (data.playerId === myPlayerId) {
        wordElement.classList.add('my-word');
    }
    
    // Nội dung HTML của từ
    wordElement.innerHTML = `
        <span class="word-text">${data.word}</span>
        <span class="word-player">${data.playerId === myPlayerId ? 'bạn' : data.playerName}</span>
        ${data.playerId !== myPlayerId ? 
            `<button class="word-report-btn" data-word="${data.word}" data-player-id="${data.playerId}">Báo cáo</button>` : 
            ''}
    `;
    
    // Thêm vào hiển thị
    wordChainDisplay.appendChild(wordElement);
    
    // Cuộn xuống từ mới nhất
    wordChainDisplay.scrollTop = wordChainDisplay.scrollHeight;
    
    // Nếu là từ cuối, đánh dấu nó
    if (data.isLastWord) {
        const oldLastWord = wordChainDisplay.querySelector('.last-word');
        if (oldLastWord) {
            oldLastWord.classList.remove('last-word');
        }
        wordElement.classList.add('last-word');
    }
}

// Xử lý sự kiện cập nhật timer
function handleWordTimerUpdate(data) {
    // Cập nhật đồng hồ đếm ngược
    const seconds = data.seconds;
    
    if (timerCountdown) {
        timerCountdown.textContent = seconds;
        
        // Thêm hiệu ứng khi thời gian sắp hết
        if (seconds <= 5) {
            timerCountdown.classList.add('urgent');
        } else {
            timerCountdown.classList.remove('urgent');
        }
        
        // Thêm hiệu ứng nhấp nháy khi thời gian dưới 3 giây
        if (seconds <= 3) {
            timerCountdown.classList.add('blink');
        } else {
            timerCountdown.classList.remove('blink');
        }
    }
}

// Xử lý sự kiện kết thúc game
function handleWordGameOver(data) {
    // Hiển thị kết quả
    showSection(wordResultsSection);
    hideSection(wordGameSection);
    
    // Cập nhật hiển thị người thua
    wordLoserDisplay.textContent = `${data.loserName} đã thua!`;
    
    // Cập nhật hiển thị chuỗi từ
    displayWordChainResult(data.wordChain);
    
    // Đặt lại trạng thái phòng
    currentRoomState = ROOM_STATE.WAITING;
}

// Cập nhật hiển thị danh sách người chơi trong game
function updateWordScoreBoard(players) {
    wordScoreBoard.innerHTML = '<div class="score-header">Danh sách người chơi</div>';
    
    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'score-player';
        
        if (player.id === myPlayerId) {
            playerItem.classList.add('me');
        }
        
        playerItem.innerHTML = `
            <span class="player-name">${player.name}${player.id === myPlayerId ? ' (bạn)' : ''}</span>
        `;
        
        wordScoreBoard.appendChild(playerItem);
    });
}

// Gửi từ mới lên server
function submitWord() {
    const word = wordInput.value.trim();
    
    if (!word) {
        showNotification('Vui lòng nhập từ', true);
        return;
    }
    
    if (!gameId) {
        console.error('Không tìm thấy gameId');
        return;
    }
    
    // Disable để tránh gửi nhiều lần
    wordInput.disabled = true;
    wordSubmitBtn.disabled = true;
    
    // Gửi từ lên server
    socket.emit('submit-word', {
        gameId,
        word
    });
}

// Xử lý sự kiện nhận báo cáo
function handleReportReceived(data) {
    showNotification(`Báo cáo từ "${data.word}" đã được nhận.`);
}

// Xử lý sự kiện từ bị báo cáo thành công
function handleWordReported(data) {
    // Hiển thị thông báo từ đã bị báo cáo
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    
    modal.innerHTML = `
        <div class="report-modal-content">
            <button class="report-modal-close">×</button>
            <h3>Từ không hợp lệ!</h3>
            <p>Từ "<strong>${data.word}</strong>" của <strong>${data.playerName}</strong> đã bị báo cáo.</p>
            <p>${data.reporters}/${data.totalVoters} người chơi đồng ý báo cáo.</p>
            <div class="report-info">Trò chơi sẽ kết thúc...</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Hiệu ứng hiển thị modal
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Xử lý sự kiện đóng modal khi nhấn nút đóng
    const closeButton = modal.querySelector('.report-modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
    }
    
    // Tự động xóa modal sau khi hiển thị xong (nhưng giữ lại cho người dùng có thể tắt bằng tay)
    setTimeout(() => {
        if (document.body.contains(modal)) {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        }
    }, 10000);
}

// Khởi tạo giao diện game nối từ
function initializeWordGameInterface() {
    // Đặt lại biến trạng thái và giao diện
    wordChainDisplay.innerHTML = '';
    wordCurrentPlayerDisplay.textContent = 'Đang chờ lượt chơi...';
    
    if (timerCountdown) {
        timerCountdown.textContent = '30';
        timerCountdown.classList.remove('urgent', 'blink');
    }
    
    // Khác với phiên bản cũ, chúng ta không còn createWordGameBoard vì
    // bảng game được tạo động trong handleWordChainUpdate
}

// Hiển thị chuỗi từ kết quả
function displayWordChainResult(wordChain) {
    wordChainResult.innerHTML = '<div class="chain-result-title">Chuỗi từ đã chơi:</div>';
    
    if (!wordChain || wordChain.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-chain';
        emptyMessage.textContent = 'Không có từ nào được chơi';
        wordChainResult.appendChild(emptyMessage);
        return;
    }
    
    const chainList = document.createElement('div');
    chainList.className = 'chain-list';
    
    wordChain.forEach((item, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'chain-item';
        
        if (item.playerId === myPlayerId) {
            wordItem.classList.add('my-word');
        }
        
        wordItem.innerHTML = `
            <span class="chain-index">${index + 1}.</span>
            <span class="chain-word">${item.word}</span>
            <span class="chain-player">${item.playerId === myPlayerId ? 'bạn' : item.playerName}</span>
        `;
        
        chainList.appendChild(wordItem);
    });
    
    wordChainResult.appendChild(chainList);
}

// Xử lý báo cáo và vote
function handleReportVoteRequest(data) {
    const { word, reportedBy, playerName, votesRequired, reportKey, totalVoters } = data;
    
    // Tạo modal yêu cầu vote
    const voteModal = document.createElement('div');
    voteModal.className = 'vote-modal';
    voteModal.id = `vote-modal-${reportKey}`;
    
    voteModal.innerHTML = `
        <div class="vote-modal-content">
            <button class="report-modal-close" data-report-key="${reportKey}">×</button>
            <h3>Báo cáo từ</h3>
            <p>Từ "<strong>${word}</strong>" của <strong>${playerName}</strong> đã bị báo cáo không hợp lệ.</p>
            <p>Bạn có đồng ý với báo cáo này không?</p>
            <div class="vote-buttons">
                <button class="vote-yes" data-report-key="${reportKey}">Đồng ý</button>
                <button class="vote-no" data-report-key="${reportKey}">Không đồng ý</button>
            </div>
            <div class="vote-progress">
                <div class="vote-bar">
                    <div class="vote-fill" style="width: 0%"></div>
                </div>
                <div class="vote-counts">0/${votesRequired} phiếu đồng ý (cần ${votesRequired}/${totalVoters})</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(voteModal);
    
    // Hiệu ứng hiển thị modal
    setTimeout(() => {
        voteModal.classList.add('show');
    }, 10);
    
    // Đăng ký sự kiện cho các nút vote
    const yesButton = voteModal.querySelector('.vote-yes');
    const noButton = voteModal.querySelector('.vote-no');
    const closeButton = voteModal.querySelector('.report-modal-close');
    
    if (yesButton) {
        yesButton.addEventListener('click', function() {
            sendReportVote(reportKey, true);
            disableVoteButtons(voteModal);
        });
    }
    
    if (noButton) {
        noButton.addEventListener('click', function() {
            sendReportVote(reportKey, false);
            disableVoteButtons(voteModal);
        });
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            voteModal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(voteModal)) {
                    document.body.removeChild(voteModal);
                }
            }, 300);
        });
    }
}

// Gửi vote báo cáo lên server
function sendReportVote(reportKey, vote) {
    if (gameId) {
        socket.emit('report-vote', {
            gameId: gameId,
            reportKey: reportKey,
            vote: vote
        });
    }
}

// Vô hiệu hóa các nút vote sau khi đã vote
function disableVoteButtons(voteModal) {
    const buttons = voteModal.querySelectorAll('.vote-buttons button');
    buttons.forEach(button => {
        button.disabled = true;
        button.classList.add('voted');
    });
    
    // Hiển thị thông báo đã vote
    const voteInfo = document.createElement('div');
    voteInfo.className = 'vote-info';
    voteInfo.textContent = 'Đã ghi nhận phiếu bầu của bạn';
    
    const voteButtons = voteModal.querySelector('.vote-buttons');
    if (voteButtons) {
        voteButtons.appendChild(voteInfo);
    }
    
    // Thêm nút đóng sau khi bỏ phiếu
    const closeButton = document.createElement('button');
    closeButton.className = 'close-vote-modal';
    closeButton.textContent = 'Đóng';
    closeButton.addEventListener('click', function() {
        voteModal.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(voteModal)) {
                document.body.removeChild(voteModal);
            }
        }, 300);
    });
    
    // Thêm nút đóng vào voteButtons
    if (voteButtons) {
        voteButtons.appendChild(closeButton);
    }
    
    // Tự động đóng modal sau 5 giây
    setTimeout(() => {
        if (document.body.contains(voteModal)) {
            voteModal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(voteModal)) {
                    document.body.removeChild(voteModal);
                }
            }, 300);
        }
    }, 5000);
}

// Xử lý cập nhật số phiếu vote
function handleReportVoteUpdate(data) {
    const { reportKey, votesReceived, votesRequired, playersVoted, totalVoters } = data;
    
    // Tìm modal vote tương ứng
    const voteModal = document.getElementById(`vote-modal-${reportKey}`);
    if (!voteModal) return;
    
    // Cập nhật thanh tiến trình
    const voteFill = voteModal.querySelector('.vote-fill');
    const voteCounts = voteModal.querySelector('.vote-counts');
    
    if (voteFill) {
        const percentage = (votesReceived / votesRequired) * 100;
        voteFill.style.width = `${Math.min(percentage, 100)}%`;
        
        // Cập nhật màu sắc dựa trên tiến trình
        if (percentage >= 100) {
            voteFill.classList.add('complete');
            
            // Thông báo đã đạt đủ số phiếu
            const completeInfo = document.createElement('div');
            completeInfo.className = 'vote-complete-info';
            completeInfo.textContent = 'Đã đạt đủ số phiếu! Báo cáo sẽ được xử lý...';
            completeInfo.style.color = '#2ecc71';
            completeInfo.style.fontWeight = 'bold';
            completeInfo.style.marginTop = '10px';
            
            // Thêm thông báo vào modal nếu chưa có
            if (!voteModal.querySelector('.vote-complete-info')) {
                const modalContent = voteModal.querySelector('.vote-modal-content');
                if (modalContent) {
                    modalContent.appendChild(completeInfo);
                }
                
                // Tự động đóng modal sau 3 giây khi đạt đủ số phiếu
                setTimeout(() => {
                    if (document.body.contains(voteModal)) {
                        voteModal.classList.remove('show');
                        setTimeout(() => {
                            if (document.body.contains(voteModal)) {
                                document.body.removeChild(voteModal);
                            }
                        }, 300);
                    }
                }, 3000);
            }
        } else if (percentage >= 50) {
            voteFill.classList.add('halfway');
        }
    }
    
    if (voteCounts) {
        voteCounts.textContent = `${votesReceived}/${votesRequired} phiếu đồng ý (đã vote: ${playersVoted}/${totalVoters})`;
    }
}

// Xử lý khi báo cáo bị từ chối
function handleReportRejected(data) {
    const { reportKey, word, playerName, votesReceived, votesRequired, totalVoters } = data;
    
    // Tìm modal vote tương ứng
    const voteModal = document.getElementById(`vote-modal-${reportKey}`);
    if (!voteModal) return;
    
    // Cập nhật giao diện modal để thông báo báo cáo bị từ chối
    const modalContent = voteModal.querySelector('.vote-modal-content');
    if (modalContent) {
        // Đổi tiêu đề và nội dung
        const title = modalContent.querySelector('h3');
        if (title) {
            title.textContent = 'Báo cáo bị từ chối';
            title.style.color = '#e74c3c';
        }
        
        // Cập nhật nội dung
        const content = modalContent.querySelector('p:nth-child(2)');
        if (content) {
            content.innerHTML = `Báo cáo từ "<strong>${word}</strong>" của <strong>${playerName}</strong> đã bị từ chối.`;
        }
        
        const voteInfo = modalContent.querySelector('p:nth-child(3)');
        if (voteInfo) {
            voteInfo.innerHTML = `Chỉ có ${votesReceived}/${votesRequired} phiếu đồng ý (cần tối thiểu ${votesRequired}/${totalVoters}).`;
        }
        
        // Xóa các nút vote
        const voteButtons = modalContent.querySelector('.vote-buttons');
        if (voteButtons) {
            voteButtons.innerHTML = '<button class="close-vote-modal" data-report-key="' + reportKey + '">Đóng</button>';
            
            // Đăng ký sự kiện cho nút đóng
            const closeButton = voteButtons.querySelector('.close-vote-modal');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    voteModal.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(voteModal);
                    }, 300);
                });
            }
        }
    }
    
    // Tự động đóng sau 5 giây
    setTimeout(() => {
        if (document.body.contains(voteModal)) {
            voteModal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(voteModal)) {
                    document.body.removeChild(voteModal);
                }
            }, 300);
        }
    }, 5000);
}

// Xử lý thông báo cho người báo cáo biết đã nhận báo cáo
function handleReportInitiated(data) {
    showNotification(`Đã gửi báo cáo từ "${data.word}". Cần ${data.votesRequired}/${data.totalVoters} phiếu đồng ý để báo cáo thành công.`);
}

// Khởi tạo Socket.IO cho game nối từ
document.addEventListener('socketInitialized', function() {
    if (socket) {
        console.log("Socket đã khởi tạo, thiết lập event handlers cho game nối từ");
        initWordGameSockets();
        
        // Đảm bảo các event handler cho chat đã được thiết lập
        const waitingChatInput = document.getElementById('word-waiting-chat-input');
        const waitingChatSendBtn = document.getElementById('word-waiting-chat-send');
        
        if (waitingChatInput && waitingChatSendBtn) {
            console.log("Thiết lập lại event handlers cho chat phòng chờ");
            
            // Sự kiện click nút gửi
            waitingChatSendBtn.addEventListener('click', function() {
                console.log("Nút gửi chat phòng chờ được bấm");
                const input = document.getElementById('word-waiting-chat-input');
                const messagesId = 'word-waiting-chat-messages';
                if (input) {
                    const message = input.value.trim();
                    if (message) {
                        console.log("Gửi tin nhắn từ phòng chờ:", message);
                        // Sử dụng socket.emit trực tiếp thay vì gọi sendChatMessage
                        socket.emit('word-chat-message', {
                            gameId: gameId,
                            message: message
                        });
                        
                        // Hiển thị tin nhắn của mình ngay lập tức
                        const messagesContainer = document.getElementById(messagesId);
                        if (messagesContainer) {
                            const playerName = 'Bạn';
                            const messageElement = document.createElement('div');
                            messageElement.className = 'chat-message self';
                            
                            const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            
                            messageElement.innerHTML = `
                                <div class="content">${escapeHTML(message)}</div>
                                <div class="time">${timestamp}</div>
                            `;
                            
                            messagesContainer.appendChild(messageElement);
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                        
                        input.value = '';
                    }
                }
            });
            
            // Sự kiện nhấn Enter
            waitingChatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log("Phím Enter được nhấn trong input phòng chờ");
                    e.preventDefault();
                    const messagesId = 'word-waiting-chat-messages';
                    const message = waitingChatInput.value.trim();
                    if (message) {
                        console.log("Gửi tin nhắn từ phòng chờ (Enter):", message);
                        // Sử dụng socket.emit trực tiếp
                        socket.emit('word-chat-message', {
                            gameId: gameId,
                            message: message
                        });
                        
                        // Hiển thị tin nhắn của mình ngay lập tức
                        const messagesContainer = document.getElementById(messagesId);
                        if (messagesContainer) {
                            const playerName = 'Bạn';
                            const messageElement = document.createElement('div');
                            messageElement.className = 'chat-message self';
                            
                            const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            
                            messageElement.innerHTML = `
                                <div class="content">${escapeHTML(message)}</div>
                                <div class="time">${timestamp}</div>
                            `;
                            
                            messagesContainer.appendChild(messageElement);
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                        
                        waitingChatInput.value = '';
                    }
                }
            });
        }
        
        const gameChatInput = document.getElementById('word-chat-input');
        const gameChatSendBtn = document.getElementById('word-chat-send');
        
        if (gameChatInput && gameChatSendBtn) {
            console.log("Thiết lập lại event handlers cho chat trong game");
            
            // Sự kiện click nút gửi
            gameChatSendBtn.addEventListener('click', function() {
                console.log("Nút gửi chat trong game được bấm");
                const input = document.getElementById('word-chat-input');
                const messagesId = 'word-chat-messages';
                if (input) {
                    const message = input.value.trim();
                    if (message) {
                        console.log("Gửi tin nhắn từ trong game:", message);
                        // Sử dụng socket.emit trực tiếp
                        socket.emit('word-chat-message', {
                            gameId: gameId,
                            message: message
                        });
                        
                        // Hiển thị tin nhắn của mình ngay lập tức
                        const messagesContainer = document.getElementById(messagesId);
                        if (messagesContainer) {
                            const playerName = 'Bạn';
                            const messageElement = document.createElement('div');
                            messageElement.className = 'chat-message self';
                            
                            const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            
                            messageElement.innerHTML = `
                                <div class="content">${escapeHTML(message)}</div>
                                <div class="time">${timestamp}</div>
                            `;
                            
                            messagesContainer.appendChild(messageElement);
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                        
                        input.value = '';
                    }
                }
            });
            
            // Sự kiện nhấn Enter
            gameChatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log("Phím Enter được nhấn trong input trong game");
                    e.preventDefault();
                    const messagesId = 'word-chat-messages';
                    const message = gameChatInput.value.trim();
                    if (message) {
                        console.log("Gửi tin nhắn từ trong game (Enter):", message);
                        // Sử dụng socket.emit trực tiếp
                        socket.emit('word-chat-message', {
                            gameId: gameId,
                            message: message
                        });
                        
                        // Hiển thị tin nhắn của mình ngay lập tức
                        const messagesContainer = document.getElementById(messagesId);
                        if (messagesContainer) {
                            const playerName = 'Bạn';
                            const messageElement = document.createElement('div');
                            messageElement.className = 'chat-message self';
                            
                            const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            
                            messageElement.innerHTML = `
                                <div class="content">${escapeHTML(message)}</div>
                                <div class="time">${timestamp}</div>
                            `;
                            
                            messagesContainer.appendChild(messageElement);
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                        
                        gameChatInput.value = '';
                    }
                }
            });
        }
    }
});

/**
 * Hàm để escape HTML tránh XSS
 */
function escapeHTML(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Khởi tạo Socket.IO cho game nối từ nếu socket đã tồn tại
if (socket) {
    console.log("Socket đã tồn tại, thiết lập event handlers cho game nối từ");
    initWordGameSockets();
} 