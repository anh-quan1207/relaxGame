// Biến game nối từ
let wordTimer;
let currentWord = "";
let turnNotificationModal; // Biến lưu trữ modal thông báo lượt chơi
let playerReadyForNextGame = false; // Biến theo dõi người chơi đã sẵn sàng cho game tiếp theo chưa

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
    
    console.log('Word game sockets initialized successfully');
}

// Xử lý sự kiện tạo game nối từ thành công
function handleWordGameCreated(data) {
    gameId = data.gameId;
    myPlayerId = data.player.id;
    isHost = data.isHost;
    gameType = 'word';
    
    wordRoomIdDisplay.textContent = `Mã phòng: ${gameId}`;
    
    updateWordPlayersList({
        players: data.gameInfo.players
    });
    
    showSection(wordOnlineWaitingSection);
    hideSection(wordCreateOnlineSection);
}

// Xử lý sự kiện tham gia game nối từ thành công
function handleWordGameJoined(data) {
    gameId = data.gameId;
    myPlayerId = data.player.id;
    isHost = data.isHost;
    gameType = 'word';
    
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
        if (wordOnlinePlayersList.nextElementSibling) {
            wordOnlineWaitingSection.insertBefore(playersCountInfo, wordOnlinePlayersList.nextElementSibling);
        } else {
            wordOnlineWaitingSection.appendChild(playersCountInfo);
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
    
    // Cập nhật danh sách người chơi
    updateWordScoreBoard(data.gameInfo.players);
    
    // Hiển thị giao diện game
    showSection(wordGameSection);
    hideSection(wordOnlineWaitingSection);
    hideSection(wordResultsSection);
    
    // Khởi tạo giao diện game
    wordChainDisplay.innerHTML = '';
    
    // Ẩn khu vực vote và ô nhập từ (sẽ hiển thị lại cho người chơi hiện tại khi nhận sự kiện word-turn-update)
    if (wordVoteArea) wordVoteArea.classList.add('hidden');
    if (wordInputArea) wordInputArea.classList.add('hidden');
    console.log('Input area hidden on game start');
}

// Xử lý sự kiện cập nhật lượt chơi
function handleWordTurnUpdate(data) {
    console.log('Turn update:', data);
    const isMyTurn = data.currentPlayerId === myPlayerId;
    
    // Lưu lại player ID hiện tại để hiển thị thông báo đúng
    window.currentTurnPlayerId = data.currentPlayerId;
    window.currentTurnPlayerName = data.currentPlayerName;
    
    // Cập nhật thông tin người chơi hiện tại
    if (wordCurrentPlayerDisplay) {
        wordCurrentPlayerDisplay.textContent = isMyTurn ? 
            'Đến lượt của bạn!' : 
            `Đến lượt của: ${data.currentPlayerName}`;
        
        // Thêm highlight màu sắc cho thông báo lượt
        wordCurrentPlayerDisplay.className = isMyTurn ? 'current-player-highlight my-turn' : 'current-player-highlight';
    }
    
    // Hiển thị ô nhập từ cho tất cả người chơi
    if (wordInputArea) wordInputArea.classList.remove('hidden');
    if (wordInput) {
        wordInput.value = ''; // Reset input
        wordInput.disabled = !isMyTurn; // Chỉ bật input cho người đang có lượt
        
        // Nếu có từ trước đó, hiển thị gợi ý
        if (data.lastWord) {
            const lastWordParts = data.lastWord.split(' ');
            const lastPart = lastWordParts[lastWordParts.length - 1];
            wordInput.placeholder = `Nhập từ bắt đầu bằng "${lastPart}..."`;
        } else {
            wordInput.placeholder = 'Nhập từ đầu tiên...';
        }
    }
    
    if (wordSubmitBtn) wordSubmitBtn.disabled = !isMyTurn; // Chỉ bật nút gửi cho người đang có lượt
    
    // Chỉ tự động focus nếu là lượt của mình
    if (isMyTurn && wordInput) {
        wordInput.focus();
    }
    
    // Ẩn khu vực vote
    if (wordVoteArea) wordVoteArea.classList.add('hidden');
    
    // Đánh dấu người chơi hiện tại trong bảng điểm rõ ràng hơn
    if (wordScoreBoard) {
        const playerScores = wordScoreBoard.querySelectorAll('.player-score');
        playerScores.forEach(ps => {
            ps.classList.remove('active-player');
            if (ps.dataset.playerId === data.currentPlayerId) {
                ps.classList.add('active-player');
                ps.style.backgroundColor = '#e3f2fd';
                ps.style.borderLeft = '4px solid #1976d2';
                ps.style.fontWeight = 'bold';
            } else {
                ps.style.backgroundColor = '';
                ps.style.borderLeft = '';
                ps.style.fontWeight = '';
            }
        });
    }
    
    // Chỉ hiển thị modal thông báo lượt chơi mới khi là cập nhật lượt thật sự 
    // (không phải khi server gửi lại lượt hiện tại do lỗi)
    if (!window.lastTurnPlayerId || window.lastTurnPlayerId !== data.currentPlayerId) {
        // Kiểm tra xem có lỗi từ không hợp lệ không
        if (!window.wordErrorOccurred) {
            showTurnNotification(data.currentPlayerName, isMyTurn);
        } else {
            // Reset cờ sau khi đã xử lý
            window.wordErrorOccurred = false;
        }
        window.lastTurnPlayerId = data.currentPlayerId;
    }
}

// Hiển thị modal thông báo lượt chơi
function showTurnNotification(playerName, isMyTurn) {
    if (turnNotificationModalElement) {
        // Cập nhật nội dung thông báo
        if (turnNotificationMessage) {
            turnNotificationMessage.textContent = isMyTurn ? 
                'Đến lượt của bạn!' : 
                `Đến lượt của: ${playerName}`;
        }
        
        // Hiển thị modal
        turnNotificationModalElement.classList.add('show');
        
        // Tự động ẩn modal sau 2 giây
        setTimeout(() => {
            if (turnNotificationModalElement) {
                turnNotificationModalElement.classList.remove('show');
            }
        }, 2000);
    }
}

// Xử lý sự kiện cập nhật chuỗi từ
function handleWordChainUpdate(data) {
    // Thêm từ mới vào chuỗi
    const wordItem = document.createElement('div');
    wordItem.className = 'word-item';
    wordItem.dataset.word = data.word;
    wordItem.dataset.playerId = data.playerId;
    if (data.isLastWord) {
        wordItem.classList.add('last-word');
    }
    
    const wordText = document.createElement('div');
    wordText.textContent = data.word;
    wordItem.appendChild(wordText);
    
    const wordAuthor = document.createElement('div');
    wordAuthor.className = 'word-author';
    wordAuthor.textContent = data.playerName;
    wordItem.appendChild(wordAuthor);
    
    // Thêm nút báo cáo nếu từ không phải của mình và là từ mới nhất
    if (data.playerId !== myPlayerId && data.isLastWord) {
        const reportButton = document.createElement('button');
        reportButton.className = 'word-report-btn';
        reportButton.textContent = 'Báo cáo';
        reportButton.dataset.word = data.word;
        reportButton.dataset.playerId = data.playerId;
        reportButton.title = 'Báo cáo từ này không hợp lý hoặc không có nghĩa';
        
        wordItem.appendChild(reportButton);
    }
    
    wordChainDisplay.appendChild(wordItem);
    
    // Lưu từ hiện tại
    currentWord = data.word;
    
    // Cuộn xuống để hiển thị từ mới nhất
    wordChainDisplay.scrollTop = wordChainDisplay.scrollHeight;
}

// Xử lý sự kiện cập nhật timer
function handleWordTimerUpdate(data) {
    if (timerCountdown) {
        timerCountdown.textContent = data.seconds;
        
        // Thay đổi màu sắc và hiệu ứng dựa trên thời gian còn lại
        if (data.seconds <= 5) {
            // Đỏ đậm và nhấp nháy nhanh khi còn 5 giây cuối
            timerCountdown.style.color = '#ff0000';
            timerCountdown.style.fontWeight = 'bold';
            timerCountdown.style.fontSize = '1.5em';
            timerCountdown.classList.add('timer-critical');
            timerCountdown.classList.remove('timer-warning');
        } else if (data.seconds <= 10) {
            // Đỏ và nhấp nháy khi còn 10 giây
            timerCountdown.style.color = '#ff3333';
            timerCountdown.style.fontWeight = 'bold';
            timerCountdown.style.fontSize = '1.3em';
            timerCountdown.classList.add('timer-warning');
            timerCountdown.classList.remove('timer-critical');
        } else {
            // Màu bình thường
            timerCountdown.style.color = '';
            timerCountdown.style.fontWeight = '';
            timerCountdown.style.fontSize = '';
            timerCountdown.classList.remove('timer-warning', 'timer-critical');
        }
    }
}

// Xử lý sự kiện kết thúc game nối từ
function handleWordGameOver(data) {
    playerReadyForNextGame = false; // Đặt lại trạng thái sẵn sàng khi game kết thúc
    
    // Hiển thị người thua
    wordLoserDisplay.textContent = data.loserName === 'unknown' ? 
        'Không có người thua cuộc' : 
        `Người thua cuộc: ${data.loserName}`;
    
    // Hiển thị chuỗi từ kết quả
    wordChainResult.innerHTML = '';
    data.wordChain.forEach(item => {
        const wordElement = document.createElement('div');
        wordElement.textContent = item.word + ` (${item.playerName})`;
        wordChainResult.appendChild(wordElement);
    });
    
    // Chuyển sang màn hình kết quả
    showSection(wordResultsSection);
    hideSection(wordGameSection);
}

// Cập nhật bảng điểm nối từ
function updateWordScoreBoard(players) {
    wordScoreBoard.innerHTML = '';
    
    players.forEach(player => {
        const playerScoreElement = document.createElement('div');
        playerScoreElement.className = 'player-score';
        playerScoreElement.dataset.playerId = player.id;
        
        if (player.id === myPlayerId) {
            playerScoreElement.classList.add('you');
        }
        
        const playerNameElement = document.createElement('div');
        playerNameElement.className = 'player-name';
        playerNameElement.textContent = player.id === myPlayerId ? `${player.name} (bạn)` : player.name;
        
        playerScoreElement.appendChild(playerNameElement);
        wordScoreBoard.appendChild(playerScoreElement);
    });
}

// Gửi từ người chơi đã nhập
function submitWord() {
    const word = wordInput ? wordInput.value.trim() : '';
    
    // Luôn kiểm tra xem có phải lượt của người này không, sử dụng biến global để đảm bảo đúng
    if (window.currentTurnPlayerId && window.currentTurnPlayerId !== myPlayerId) {
        // Hiển thị thông báo rõ ràng và KHÔNG cho phép gửi
        showNotification(`Đây không phải lượt của bạn! Đang đến lượt của: ${window.currentTurnPlayerName || 'người chơi khác'}`, true);
        return; // Dừng hàm tại đây, không gửi từ
    }
    
    if (!word) {
        showNotification('Vui lòng nhập một từ!', true);
        return;
    }
    
    // Gửi từ đến server
    socket.emit('submit-word', {
        gameId,
        word
    });
    
    // Chỉ vô hiệu hóa input khi nhận phản hồi từ server, không làm ngay tại đây
    // để giải quyết vấn đề đơ input
}

// Xử lý sự kiện nhận báo cáo
function handleReportReceived(data) {
    showNotification(`Đã nhận báo cáo (${data.count}/${data.required} phiếu)`);
}

// Xử lý sự kiện từ bị báo cáo thành công
function handleWordReported(data) {
    // Đảm bảo totalVoters luôn có giá trị, nếu undefined thì mặc định là 1
    const totalVoters = data.totalVoters || 1; 
    const reportPercent = Math.round((data.reporters / totalVoters) * 100) || 0;
    
    // Hiển thị thông báo với tỷ lệ phần trăm
    showNotification(`CẢNH BÁO: Từ "${data.word}" của ${data.playerName} bị báo cáo bởi ${data.reporters}/${totalVoters} người chơi (${reportPercent}%)! ${data.playerName} bị xử thua!`, true);
    
    // Đánh dấu trực quan từ bị báo cáo trong chuỗi
    const wordItems = wordChainDisplay.querySelectorAll('.word-item');
    wordItems.forEach(item => {
        if (item.dataset.word === data.word) {
            item.style.backgroundColor = '#ffebee';
            item.style.borderLeftColor = '#e53935';
            
            const reportedBadge = document.createElement('div');
            reportedBadge.textContent = 'Từ bị báo cáo';
            reportedBadge.style.backgroundColor = '#e53935';
            reportedBadge.style.color = 'white';
            reportedBadge.style.padding = '2px 6px';
            reportedBadge.style.borderRadius = '4px';
            reportedBadge.style.fontSize = '10px';
            reportedBadge.style.marginTop = '5px';
            reportedBadge.style.display = 'inline-block';
            
            // Thêm vào sau phần author
            item.appendChild(reportedBadge);
            
            // Xóa nút báo cáo nếu còn
            const reportBtn = item.querySelector('.word-report-btn');
            if (reportBtn) {
                reportBtn.remove();
            }
        }
    });
    
    // Đóng khu vực bỏ phiếu nếu đang hiển thị
    const reportVoteArea = document.getElementById('word-report-vote-area');
    if (reportVoteArea) {
        // Cập nhật trạng thái
        reportVoteArea.innerHTML = `
            <div class="report-vote-title">Kết quả báo cáo</div>
            <div class="report-vote-content">
                <div class="report-result success">
                    <i class="fas fa-check-circle"></i>
                    Báo cáo đã được chấp nhận với ${data.reporters}/${totalVoters} phiếu đồng ý (${reportPercent}%).
                </div>
                <div class="report-details">
                    Từ "<span class="highlight">${data.word}</span>" của <strong>${data.playerName}</strong> đã bị xử thua.
                </div>
            </div>
        `;
        
        // Thêm hiệu ứng và xóa sau vài giây
        reportVoteArea.classList.add('result-success');
        setTimeout(() => {
            reportVoteArea.classList.add('fade-out');
            setTimeout(() => {
                if (reportVoteArea.parentNode) {
                    reportVoteArea.parentNode.removeChild(reportVoteArea);
                }
            }, 500);
        }, 5000);
    }
}

// Xử lý yêu cầu bỏ phiếu báo cáo
function handleReportVoteRequest(data) {
    // Tạo hoặc hiển thị khu vực bỏ phiếu báo cáo
    let reportVoteArea = document.getElementById('word-report-vote-area');
    
    if (!reportVoteArea) {
        reportVoteArea = document.createElement('div');
        reportVoteArea.id = 'word-report-vote-area';
        reportVoteArea.className = 'report-vote-area';
        
        // Thêm vào trước khu vực nhập từ
        if (wordInputArea) {
            wordGameSection.insertBefore(reportVoteArea, wordInputArea);
        } else {
            wordGameSection.appendChild(reportVoteArea);
        }
    }
    
    // Cập nhật nội dung khu vực bỏ phiếu
    reportVoteArea.innerHTML = `
        <div class="report-vote-title">Yêu cầu bỏ phiếu báo cáo</div>
        <div class="report-vote-content">
            <strong>${data.reportedBy}</strong> đã báo cáo từ "<span class="highlight">${data.word}</span>" của <strong>${data.playerName}</strong> là không hợp lệ.
            <div class="report-vote-progress">
                <div>Số phiếu cần thiết: <strong>${data.votesRequired}/${data.totalVoters}</strong></div>
                <div class="vote-progress-bar">
                    <div class="vote-progress" style="width: 0%">0/${data.votesRequired}</div>
                </div>
            </div>
            <div class="report-vote-question">Bạn có đồng ý với báo cáo này?</div>
            <div class="report-vote-buttons">
                <button id="vote-yes-btn" class="vote-btn vote-yes" data-report-key="${data.reportKey}">Đồng ý</button>
                <button id="vote-no-btn" class="vote-btn vote-no" data-report-key="${data.reportKey}">Không đồng ý</button>
            </div>
        </div>
    `;
    
    // Thêm sự kiện cho các nút bỏ phiếu
    document.getElementById('vote-yes-btn').addEventListener('click', function() {
        const reportKey = this.dataset.reportKey;
        sendReportVote(reportKey, true);
        disableVoteButtons();
    });
    
    document.getElementById('vote-no-btn').addEventListener('click', function() {
        const reportKey = this.dataset.reportKey;
        sendReportVote(reportKey, false);
        disableVoteButtons();
    });
    
    // Hiển thị khu vực bỏ phiếu
    reportVoteArea.style.display = 'block';
    
    // Hiệu ứng nhấp nháy để thu hút sự chú ý
    reportVoteArea.classList.add('attention-blink');
    setTimeout(() => {
        reportVoteArea.classList.remove('attention-blink');
    }, 1500);
}

// Hàm gửi phiếu báo cáo
function sendReportVote(reportKey, vote) {
    if (gameId) {
        socket.emit('report-vote', {
            gameId,
            reportKey,
            vote
        });
    }
}

// Hàm vô hiệu hóa các nút bỏ phiếu sau khi đã bỏ phiếu
function disableVoteButtons() {
    const yesBtn = document.getElementById('vote-yes-btn');
    const noBtn = document.getElementById('vote-no-btn');
    
    if (yesBtn) yesBtn.disabled = true;
    if (noBtn) noBtn.disabled = true;
    
    // Thêm lớp CSS để hiển thị rằng đã bỏ phiếu
    const reportVoteArea = document.getElementById('word-report-vote-area');
    if (reportVoteArea) {
        reportVoteArea.classList.add('voted');
        const voteQuestion = reportVoteArea.querySelector('.report-vote-question');
        if (voteQuestion) {
            voteQuestion.textContent = 'Bạn đã bỏ phiếu. Đang chờ kết quả...';
        }
    }
}

// Xử lý cập nhật phiếu báo cáo
function handleReportVoteUpdate(data) {
    const reportVoteArea = document.getElementById('word-report-vote-area');
    if (!reportVoteArea) return;
    
    // Cập nhật tiến trình bỏ phiếu
    const progressBar = reportVoteArea.querySelector('.vote-progress');
    if (progressBar) {
        const percent = (data.votesReceived / data.votesRequired) * 100;
        progressBar.style.width = `${Math.min(percent, 100)}%`;
        progressBar.textContent = `${data.votesReceived}/${data.votesRequired}`;
        
        // Đổi màu dựa vào tiến trình
        if (percent >= 100) {
            progressBar.classList.add('vote-complete');
        } else if (percent >= 50) {
            progressBar.classList.add('vote-half');
        }
    }
    
    // Cập nhật thông tin số người đã bỏ phiếu
    const voteInfo = reportVoteArea.querySelector('.report-vote-progress');
    if (voteInfo) {
        // Thêm thông tin về số người đã bỏ phiếu
        let voteCountInfo = reportVoteArea.querySelector('.voters-count');
        if (!voteCountInfo) {
            voteCountInfo = document.createElement('div');
            voteCountInfo.className = 'voters-count';
            voteInfo.appendChild(voteCountInfo);
        }
        voteCountInfo.textContent = `Đã có ${data.playersVoted}/${data.totalVoters} người bỏ phiếu`;
    }
}

// Xử lý khi báo cáo bị từ chối
function handleReportRejected(data) {
    // Hiển thị thông báo báo cáo bị từ chối
    showNotification(`Báo cáo từ "${data.word}" bị từ chối (${data.votesReceived}/${data.votesRequired} phiếu)`, false);
    
    // Ẩn và xóa khu vực bỏ phiếu sau một khoảng thời gian
    setTimeout(() => {
        const reportVoteArea = document.getElementById('word-report-vote-area');
        if (reportVoteArea) {
            // Cập nhật trạng thái cuối cùng trước khi xóa
            reportVoteArea.innerHTML = `
                <div class="report-vote-title">Kết quả báo cáo</div>
                <div class="report-vote-content">
                    <div class="report-result failure">
                        <i class="fas fa-times-circle"></i>
                        Báo cáo đã bị từ chối với ${data.votesReceived}/${data.totalVoters} phiếu đồng ý (cần ${data.votesRequired}).
                    </div>
                    <div class="report-details">
                        Từ "<span class="highlight">${data.word}</span>" của <strong>${data.playerName}</strong> vẫn được chấp nhận.
                    </div>
                </div>
            `;
            
            // Thêm hiệu ứng và xóa sau vài giây
            reportVoteArea.classList.add('result-failure');
            
            setTimeout(() => {
                reportVoteArea.classList.add('fade-out');
                setTimeout(() => {
                    if (reportVoteArea.parentNode) {
                        reportVoteArea.parentNode.removeChild(reportVoteArea);
                    }
                }, 500);
            }, 3000);
        }
    }, 500);
}

// Xử lý khi báo cáo được chấp nhận
function handleReportInitiated(data) {
    showNotification(`Đã gửi yêu cầu báo cáo từ "${data.word}". Cần ${data.votesRequired}/${data.totalVoters} phiếu đồng ý.`);
}

// Khởi tạo sự kiện socket khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    // Thêm CSS cho hiệu ứng nhấp nháy thời gian và highlight người chơi hiện tại
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .timer-warning {
            animation: blink-warning 1s infinite;
        }
        .timer-critical {
            animation: blink-critical 0.5s infinite;
        }
        @keyframes blink-warning {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        @keyframes blink-critical {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .current-player-highlight {
            padding: 8px;
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        .current-player-highlight.my-turn {
            background-color: #e8f5e9;
            border-left: 4px solid #4caf50;
            font-weight: bold;
            color: #2e7d32;
        }
        .active-player {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(styleSheet);
    
    // Nếu hàm initializeSocket tồn tại, đăng ký sự kiện cho socket
    if (typeof initializeSocket === 'function') {
        // Đăng ký sự kiện cho socket khi socket được khởi tạo
        if (socket) {
            initWordGameSockets();
        } else {
            // Đăng ký hàm xử lý khi socket được tạo
            document.addEventListener('socketInitialized', function() {
                initWordGameSockets();
            });
        }
    }
}); 