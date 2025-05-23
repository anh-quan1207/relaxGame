/**
 * Game Tìm Số - Client Side
 */

// Các phần tử DOM - Thiết lập offline
const setupSection = document.getElementById('setup');
const gameSection = document.getElementById('game');
const resultsSection = document.getElementById('results');
const playerCountSelect = document.getElementById('player-count');
const numberCountSelect = document.getElementById('number-count');
const playersContainer = document.getElementById('players-container');
const startGameButton = document.getElementById('start-game');
const backToMenuButton = document.getElementById('back-to-menu');
const endGameButton = document.getElementById('end-game');
const playAgainButton = document.getElementById('play-again');
const backToMenuFromResultsButton = document.getElementById('back-to-menu-from-results');
const numbersContainer = document.getElementById('numbers-container');
const currentPlayerDisplay = document.getElementById('current-player');
const nextNumberDisplay = document.getElementById('next-number');
const scoreBoard = document.getElementById('score-board');
const winnerDisplay = document.getElementById('winner');
const finalScoresDisplay = document.getElementById('final-scores');

// Các phần tử DOM - Tạo phòng online
const createOnlineSection = document.getElementById('create-online');
const creatorNameInput = document.getElementById('creator-name');
const onlineNumberCountSelect = document.getElementById('online-number-count');
const onlinePlayerCountSelect = document.getElementById('online-player-count');
const createRoomButton = document.getElementById('create-room-btn');
const backFromCreateButton = document.getElementById('back-from-create');

// Các phần tử DOM - Tham gia phòng
const joinOnlineSection = document.getElementById('join-online');
const joinerNameInput = document.getElementById('joiner-name');
const roomIdInput = document.getElementById('room-id');
const joinRoomButton = document.getElementById('join-room-btn');
const backFromJoinButton = document.getElementById('back-from-join');

// Các phần tử DOM - Phòng chờ
const onlineWaitingSection = document.getElementById('online-waiting');
const roomIdDisplay = document.getElementById('room-id-display');
const onlinePlayersList = document.getElementById('online-players-list');
const startOnlineGameButton = document.getElementById('start-online-game');
const leaveRoomButton = document.getElementById('leave-room');

// Biến game tìm số
// Thêm tiền tố numberGame cho các biến để tránh xung đột
let numberGameCurrentNumber = 1;
let numberGameNextNumber = 1;
let numberGameCurrentPlayerIndex = 0;
let numberGamePlayers = [];
let numberGameIsStarted = false;
let numberGameMode = 'local'; // local hoặc online
let numberGameCountInGame = 100; // Số lượng số mặc định
let gameOver = false;
let numberGameIsOnline = false; // Đổi tên biến để tránh xung đột

/**
 * Khởi tạo các event handler cho Game Tìm Số
 */
function initNumberGame() {
    // Đăng ký sự kiện cho menu chính (Game tìm số)
    const localGameBtn = document.getElementById('local-game-btn');
    const createOnlineBtn = document.getElementById('create-online-btn');
    const joinOnlineBtn = document.getElementById('join-online-btn');

    localGameBtn.addEventListener('click', () => {
        showSection(setupSection);
        hideSection(mainMenu);
    });

    createOnlineBtn.addEventListener('click', () => {
        const socketInstance = initializeSocket();
        if (socketInstance) {
            showSection(createOnlineSection);
            hideSection(mainMenu);
        } else {
            console.warn('Không thể khởi tạo socket, đang thử lại...');
            setTimeout(() => {
                const retrySocket = initializeSocket();
                if (retrySocket) {
                    showSection(createOnlineSection);
                    hideSection(mainMenu);
                }
            }, 1000);
        }
    });

    joinOnlineBtn.addEventListener('click', () => {
        const socketInstance = initializeSocket();
        if (socketInstance) {
            showSection(joinOnlineSection);
            hideSection(mainMenu);
        } else {
            console.warn('Không thể khởi tạo socket, đang thử lại...');
            setTimeout(() => {
                const retrySocket = initializeSocket();
                if (retrySocket) {
                    showSection(joinOnlineSection);
                    hideSection(mainMenu);
                }
            }, 1000);
        }
    });

    // Đăng ký sự kiện cho nút quay lại
    backToMenuButton.addEventListener('click', () => {
        showSection(mainMenu);
        hideSection(setupSection);
    });

    backFromCreateButton.addEventListener('click', () => {
        showSection(mainMenu);
        hideSection(createOnlineSection);
        disconnectSocket();
    });

    backFromJoinButton.addEventListener('click', () => {
        showSection(mainMenu);
        hideSection(joinOnlineSection);
        disconnectSocket();
    });

    backToMenuFromResultsButton.addEventListener('click', () => {
        showSection(mainMenu);
        hideSection(resultsSection);
    });

    leaveRoomButton.addEventListener('click', () => {
        if (socket && gameId) {
            socket.emit('leave-game', { gameId });
        }
        showSection(mainMenu);
        hideSection(onlineWaitingSection);
        disconnectSocket();
    });

    // Xử lý thay đổi số lượng người chơi (offline)
    playerCountSelect.addEventListener('change', updatePlayerInputs);

    // Xử lý tạo phòng online
    createRoomButton.addEventListener('click', () => {
        const playerName = creatorNameInput.value.trim();
        
        if (!playerName) {
            showNotification('Vui lòng nhập tên của bạn', true);
            return;
        }
        
        const numPlayers = parseInt(onlinePlayerCountSelect.value);
        let maxNumber = parseInt(onlineNumberCountSelect.value);
        
        // Kiểm tra giới hạn số lượng số
        if (maxNumber > 300) {
            maxNumber = 300;
            onlineNumberCountSelect.value = 300;
            showNotification('Số lượng số được giới hạn tối đa 300', true);
        } else if (maxNumber < 10) {
            maxNumber = 10;
            onlineNumberCountSelect.value = 10;
            showNotification('Số lượng số tối thiểu là 10', true);
        }
        
        socket.emit('create-game', {
            playerName,
            numPlayers,
            maxNumber
        });
    });

    // Xử lý tham gia phòng online
    joinRoomButton.addEventListener('click', () => {
        const playerName = joinerNameInput.value.trim();
        const roomId = roomIdInput.value.trim().toUpperCase();
        
        if (!playerName) {
            showNotification('Vui lòng nhập tên của bạn', true);
            return;
        }
        
        if (!roomId) {
            showNotification('Vui lòng nhập mã phòng', true);
            return;
        }
        
        socket.emit('join-game', {
            gameId: roomId,
            playerName
        });
    });

    // Xử lý bắt đầu trò chơi online
    startOnlineGameButton.addEventListener('click', () => {
        if (isHost && gameId) {
            socket.emit('start-game', { gameId });
        }
    });

    // Xử lý sự kiện bắt đầu trò chơi (offline)
    startGameButton.addEventListener('click', startGame);

    // Kết thúc trò chơi
    endGameButton.addEventListener('click', endGame);

    // Chơi lại
    playAgainButton.addEventListener('click', () => {
        if (numberGameIsOnline) {
            // Quay lại menu chính nếu đang ở chế độ online
            showSection(mainMenu);
            hideSection(resultsSection);
            disconnectSocket();
        } else {
            // Quay lại màn hình thiết lập nếu đang ở chế độ offline
            resultsSection.classList.add('hidden');
            setupSection.classList.remove('hidden');
        }
    });
}

/**
 * Khởi tạo sự kiện Socket cho Game Tìm Số
 */
function initNumberGameSockets(socket) {
    socket.on('game-created', handleGameCreated);
    socket.on('game-joined', handleGameJoined);
    socket.on('player-joined', updatePlayersList);
    socket.on('game-started', handleGameStarted);
    socket.on('number-selected', handleNumberSelected);
    socket.on('wrong-number', handleWrongNumber);
    socket.on('player-left', handlePlayerLeft);
    socket.on('game-over', handleGameOver);
}

/**
 * Xử lý khi game được tạo
 */
function handleGameCreated(data) {
    console.log('Game đã được tạo:', data);
    
    // Lưu thông tin trò chơi
    gameId = data.gameId;
    myPlayerId = data.player.id;
    isHost = data.isHost;
    gameType = 'number';
    
    // Hiển thị mã phòng
    roomIdDisplay.textContent = `Mã phòng: ${gameId}`;
    
    // Hiển thị danh sách người chơi
    updatePlayersList(data);
    
    // Hiển thị nút bắt đầu trò chơi nếu là host
    if (isHost) {
        startOnlineGameButton.classList.remove('hidden');
    } else {
        startOnlineGameButton.classList.add('hidden');
    }
    
    // Chuyển sang màn hình phòng chờ
    showSection(onlineWaitingSection);
    hideSection(createOnlineSection);
    
    showNotification('Phòng đã được tạo thành công!');
}

/**
 * Xử lý khi tham gia game
 */
function handleGameJoined(data) {
    console.log('Đã tham gia game:', data);
    
    // Lưu thông tin trò chơi
    gameId = data.gameId;
    myPlayerId = data.player.id;
    isHost = data.isHost;
    gameType = 'number';
    
    // Hiển thị mã phòng
    roomIdDisplay.textContent = `Mã phòng: ${gameId}`;
    
    // Hiển thị danh sách người chơi
    updatePlayersList(data);
    
    // Hiển thị nút bắt đầu trò chơi nếu là host
    if (isHost) {
        startOnlineGameButton.classList.remove('hidden');
    } else {
        startOnlineGameButton.classList.add('hidden');
    }
    
    // Chuyển sang màn hình phòng chờ
    showSection(onlineWaitingSection);
    hideSection(joinOnlineSection);
    
    showNotification('Đã tham gia phòng thành công!');
}

/**
 * Cập nhật danh sách người chơi
 */
function updatePlayersList(data) {
    // Cập nhật danh sách người chơi trên giao diện
    onlinePlayersList.innerHTML = '';
    
    data.players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        let playerName = player.name;
        if (player.id === myPlayerId) {
            playerName += ' (Bạn)';
        }
        
        playerItem.textContent = playerName;
        
        // Thêm nhãn host nếu là người đầu tiên
        if (data.players.indexOf(player) === 0) {
            const hostLabel = document.createElement('span');
            hostLabel.className = 'host-label';
            hostLabel.textContent = 'Chủ phòng';
            playerItem.appendChild(hostLabel);
        }
        
        onlinePlayersList.appendChild(playerItem);
    });
    
    // Hiển thị nút bắt đầu nếu là host và có đủ người chơi
    if (isHost) {
        if (data.players.length >= 2) {
            startOnlineGameButton.classList.remove('hidden');
        } else {
            startOnlineGameButton.classList.add('hidden');
        }
    }
}

/**
 * Xử lý khi game bắt đầu
 */
function handleGameStarted(data) {
    numberGameIsOnline = true;
    showSection(gameSection);
    hideSection(onlineWaitingSection);
    
    // Cập nhật thông tin trò chơi
    numberGamePlayers = data.gameInfo.players;
    numberGameNextNumber = data.gameInfo.nextNumber;
    numberGameCountInGame = data.gameInfo.maxNumber;
    
    // Cập nhật bảng điểm
    updateScoreBoard();
    
    // Hiển thị thông tin số cần tìm tiếp theo
    updateGameInfo();
    
    // Tạo các ô số dựa trên vị trí từ server
    createNumberBoxesFromServer(data.gameInfo.numberPositions);
    
    showNotification('Trò chơi đã bắt đầu!');
}

/**
 * Tạo các ô số dựa trên vị trí từ server
 */
function createNumberBoxesFromServer(numberPositions) {
    numbersContainer.innerHTML = '';
    
    // Lấy kích thước của container
    const containerWidth = numbersContainer.clientWidth || window.innerWidth * 0.8;
    const containerHeight = numbersContainer.clientHeight || window.innerHeight * 0.6;
    
    // Tính toán kích thước tốt nhất cho ô số dựa trên số lượng
    const totalNumbers = numberPositions.length;
    
    // Giảm kích thước ô và khoảng cách khi số lượng số tăng để đảm bảo tất cả nằm trong container
    let boxWidth, boxHeight, horizontalGap, verticalGap;
    
    // Tính toán dựa trên số lượng phần tử để đảm bảo tất cả vừa vặn trong container
    const containerArea = containerWidth * containerHeight;
    const areaPerNumber = containerArea / totalNumbers;
    const idealSize = Math.sqrt(areaPerNumber * 0.7); // Để lại 30% cho khoảng cách
    
    if (totalNumbers <= 50) {
        boxWidth = 60;
        boxHeight = 60;
        horizontalGap = 20;
        verticalGap = 20;
    } else if (totalNumbers <= 100) {
        boxWidth = 50;
        boxHeight = 50;
        horizontalGap = 15;
        verticalGap = 15;
    } else if (totalNumbers <= 200) {
        boxWidth = 40;
        boxHeight = 40;
        horizontalGap = 10;
        verticalGap = 10;
    } else {
        boxWidth = 35;
        boxHeight = 35;
        horizontalGap = 8;
        verticalGap = 8;
    }
    
    // Đảm bảo kích thước không nhỏ hơn ngưỡng tối thiểu
    boxWidth = Math.max(30, boxWidth);
    boxHeight = Math.max(30, boxHeight);
    
    // Tính toán số cột có thể hiển thị
    const numCols = Math.floor((containerWidth - horizontalGap) / (boxWidth + horizontalGap));
    
    // Số dòng cần thiết
    const numRows = Math.ceil(totalNumbers / numCols);
    
    // Đảm bảo tất cả các số vừa vặn trong container, nếu không, điều chỉnh kích thước
    if (numRows * (boxHeight + verticalGap) > containerHeight - verticalGap * 2) {
        const adjustedHeight = (containerHeight - verticalGap * 2) / numRows - verticalGap;
        boxHeight = Math.max(25, Math.floor(adjustedHeight));
        boxWidth = Math.max(25, Math.floor(adjustedHeight));
    }
    
    // Sắp xếp lại vị trí theo grid nhưng vẫn giữ thứ tự các số
    numberPositions.forEach((item, index) => {
        const numberBox = document.createElement('div');
        numberBox.className = 'number-box';
        numberBox.textContent = item.number;
        numberBox.dataset.number = item.number;
        
        // Đặt vị trí theo grid thay vì sử dụng vị trí từ server
        const col = index % numCols;
        const row = Math.floor(index / numCols);
        
        // Thêm độ ngẫu nhiên nhỏ
        const randomOffsetX = Math.random() * (horizontalGap * 0.5) - (horizontalGap * 0.25);
        const randomOffsetY = Math.random() * (verticalGap * 0.5) - (verticalGap * 0.25);
        
        // Tính toán vị trí cuối cùng
        const left = col * (boxWidth + horizontalGap) + randomOffsetX + horizontalGap;
        const top = row * (boxHeight + verticalGap) + randomOffsetY + verticalGap;
        
        // Đặt vị trí
        numberBox.style.left = `${left}px`;
        numberBox.style.top = `${top}px`;
        
        // Đặt kích thước tùy theo số lượng
        numberBox.style.width = `${boxWidth}px`;
        numberBox.style.height = `${boxHeight}px`;
        numberBox.style.fontSize = `${
            totalNumbers <= 50 ? 20 : 
            totalNumbers <= 100 ? 18 : 
            totalNumbers <= 200 ? 15 : 13}px`;
        
        // Thêm màu sắc ngẫu nhiên
        const hue = Math.floor(Math.random() * 360);
        numberBox.style.backgroundColor = `hsl(${hue}, 80%, 75%)`;
        
        // Điều chỉnh màu chữ dựa trên độ sáng của màu nền
        if (hue > 40 && hue < 180) {
            numberBox.style.color = '#333'; // Màu tối cho nền sáng
        } else {
            numberBox.style.color = '#fff'; // Màu sáng cho nền tối
        }
        
        // Event listener
        numberBox.addEventListener('click', () => {
            if (numberGameIsOnline) {
                handleOnlineNumberClick(numberBox, item.number);
            } else {
                handleNumberClick(numberBox, item.number);
            }
        });
        
        numbersContainer.appendChild(numberBox);
    });
}

/**
 * Xử lý khi người chơi chọn số (online)
 */
function handleOnlineNumberClick(box, number) {
    if (gameOver) return;
    
    // Gửi sự kiện chọn số lên server
    socket.emit('select-number', {
        gameId,
        number
    });
}

/**
 * Xử lý khi số được chọn
 */
function handleNumberSelected(data) {
    // Tìm ô số đã được chọn
    const box = Array.from(numbersContainer.getElementsByClassName('number-box'))
                      .find(box => parseInt(box.dataset.number) === data.number);
    
    if (box) {
        // Hiệu ứng khi tìm thấy số
        box.style.transform = 'scale(1.5) rotate(360deg)';
        box.style.transition = 'all 0.5s';
        box.style.boxShadow = '0 0 20px #2ecc71';
        box.style.zIndex = '100';
        
        setTimeout(() => {
            // Đánh dấu số đã tìm thấy và ẩn đi
            box.classList.add('found');
            box.style.transform = 'scale(0) rotate(720deg)';
            box.style.opacity = '0';
            
            // Thêm hiệu ứng tăng điểm cho người chơi đã tìm thấy
            const playerScoreElement = Array.from(scoreBoard.getElementsByClassName('player-score'))
                .find(el => el.querySelector('.player-name').textContent.includes(data.playerName));
                
            if (playerScoreElement) {
                playerScoreElement.classList.add('score-updated');
                setTimeout(() => {
                    playerScoreElement.classList.remove('score-updated');
                }, 1000);
            }
        }, 500);
    }
    
    // Cập nhật điểm
    numberGamePlayers = data.players;
    
    // Cập nhật số tiếp theo cần tìm
    numberGameNextNumber = data.nextNumber;
    
    // Cập nhật bảng điểm
    updateScoreBoard();
    
    // Cập nhật thông tin số cần tìm tiếp theo
    updateGameInfo();
    
    // Hiển thị thông báo về người tìm thấy số
    const playerName = numberGamePlayers.find(p => p.id === data.playerId)?.name || 'Người chơi khác';
    showNotification(`${playerName} đã tìm thấy số ${data.number}!`);
}

/**
 * Xử lý khi chọn sai số
 */
function handleWrongNumber(data) {
    showNotification(`Bạn đã chọn sai số! Số tiếp theo cần tìm là ${data.nextNumber}`, true);
}

/**
 * Xử lý khi người chơi rời phòng
 */
function handlePlayerLeft(data) {
    numberGamePlayers = data.players;
    
    updatePlayersList({ players: numberGamePlayers });
    
    if (numberGameIsOnline) {
        updateScoreBoard();
        updateGameInfo();
    }
    
    showNotification(`${data.playerName} đã rời khỏi phòng`);
}

/**
 * Xử lý khi game kết thúc
 */
function handleGameOver(data) {
    gameOver = true;
    gameSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    const winners = data.winners;
    
    // Hiển thị người thắng
    if (winners.length === 1) {
        winnerDisplay.textContent = `${winners[0].name} thắng với ${winners[0].score} điểm!`;
    } else {
        const winnerNames = winners.map(winner => winner.name).join(' và ');
        winnerDisplay.textContent = `Hòa! ${winnerNames} cùng có ${winners[0].score} điểm!`;
    }
    
    // Hiển thị điểm số cuối cùng
    finalScoresDisplay.innerHTML = '';
    
    data.players.forEach(player => {
        const playerFinalScore = document.createElement('div');
        playerFinalScore.className = 'player-final-score';
        playerFinalScore.textContent = `${player.name}: ${player.score} điểm`;
        finalScoresDisplay.appendChild(playerFinalScore);
    });
}

/**
 * Khởi tạo đầu vào cho người chơi (offline)
 */
function updatePlayerInputs() {
    const playerCount = parseInt(playerCountSelect.value);
    playersContainer.innerHTML = '';
    
    for (let i = 1; i <= playerCount; i++) {
        const playerInput = document.createElement('div');
        playerInput.className = 'player-input';
        
        const label = document.createElement('label');
        label.setAttribute('for', `player${i}`);
        label.textContent = `Người chơi ${i}:`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player${i}`;
        input.placeholder = 'Nhập tên';
        
        playerInput.appendChild(label);
        playerInput.appendChild(input);
        playersContainer.appendChild(playerInput);
    }
}

/**
 * Bắt đầu game offline
 */
function startGame() {
    numberGameIsOnline = false;
    
    // Thu thập thông tin người chơi
    numberGamePlayers = [];
    const playerInputs = playersContainer.querySelectorAll('input');
    let hasEmptyName = false;
    
    playerInputs.forEach((input, index) => {
        const name = input.value.trim();
        if (name === '') {
            hasEmptyName = true;
            input.style.borderColor = 'red';
        } else {
            numberGamePlayers.push({
                id: `local-${index}`,
                name: name,
                score: 0
            });
        }
    });
    
    if (hasEmptyName) {
        showNotification('Vui lòng nhập tên cho tất cả người chơi', true);
        return;
    }
    
    // Thiết lập trò chơi
    numberGameCountInGame = parseInt(numberCountSelect.value);
    
    // Kiểm tra giới hạn số lượng số
    if (numberGameCountInGame > 300) {
        numberGameCountInGame = 300;
        showNotification('Số lượng số được giới hạn tối đa 300', true);
    } else if (numberGameCountInGame < 10) {
        numberGameCountInGame = 10;
        showNotification('Số lượng số tối thiểu là 10', true);
    }
    
    numberGameCurrentPlayerIndex = 0;
    numberGameNextNumber = 1;
    gameOver = false;
    
    // Hiển thị trò chơi
    setupSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    
    // Tạo bảng điểm
    updateScoreBoard();
    
    // Hiển thị thông tin người chơi hiện tại và số cần tìm tiếp theo
    updateGameInfo();
    
    // Tạo các ô số
    createNumberBoxes();
}

/**
 * Tạo các ô số ngẫu nhiên (offline)
 */
function createNumberBoxes() {
    numbersContainer.innerHTML = '';
    
    // Đảm bảo container đã được hiển thị và có kích thước
    setTimeout(() => {
        // Lấy kích thước của container
        const containerWidth = numbersContainer.clientWidth || window.innerWidth * 0.8;
        const containerHeight = numbersContainer.clientHeight || window.innerHeight * 0.6;
        
        // Tạo mảng các số từ 1 đến maxNumber
        const numbers = Array.from({ length: numberGameCountInGame }, (_, i) => i + 1);
        
        // Xáo trộn mảng
        shuffleArray(numbers);
        
        // Tính toán kích thước tốt nhất cho ô số dựa trên số lượng
        // Giảm kích thước ô và khoảng cách khi số lượng số tăng để đảm bảo tất cả nằm trong container
        let boxWidth, boxHeight, horizontalGap, verticalGap;
        
        // Tính toán dựa trên số lượng phần tử để đảm bảo tất cả vừa vặn trong container
        const containerArea = containerWidth * containerHeight;
        const areaPerNumber = containerArea / numberGameCountInGame;
        const idealSize = Math.sqrt(areaPerNumber * 0.7); // Để lại 30% cho khoảng cách
        
        if (numberGameCountInGame <= 50) {
            boxWidth = 60;
            boxHeight = 60;
            horizontalGap = 20;
            verticalGap = 20;
        } else if (numberGameCountInGame <= 100) {
            boxWidth = 50;
            boxHeight = 50;
            horizontalGap = 15;
            verticalGap = 15;
        } else if (numberGameCountInGame <= 200) {
            boxWidth = 40;
            boxHeight = 40;
            horizontalGap = 10;
            verticalGap = 10;
        } else {
            boxWidth = 35;
            boxHeight = 35;
            horizontalGap = 8;
            verticalGap = 8;
        }
        
        // Đảm bảo kích thước không nhỏ hơn ngưỡng tối thiểu
        boxWidth = Math.max(30, boxWidth);
        boxHeight = Math.max(30, boxHeight);
        
        // Tính toán số cột có thể hiển thị
        const numCols = Math.floor((containerWidth - horizontalGap) / (boxWidth + horizontalGap));
        
        // Số dòng cần thiết
        const numRows = Math.ceil(numberGameCountInGame / numCols);
        
        // Đảm bảo tất cả các số vừa vặn trong container, nếu không, điều chỉnh kích thước
        if (numRows * (boxHeight + verticalGap) > containerHeight - verticalGap * 2) {
            const adjustedHeight = (containerHeight - verticalGap * 2) / numRows - verticalGap;
            boxHeight = Math.max(25, Math.floor(adjustedHeight));
            boxWidth = Math.max(25, Math.floor(adjustedHeight));
        }
        
        // Tạo các ô số theo grid
        numbers.forEach((num, index) => {
            const numberBox = document.createElement('div');
            numberBox.className = 'number-box';
            numberBox.textContent = num;
            numberBox.dataset.number = num;
            
            // Tính vị trí theo grid
            const col = index % numCols;
            const row = Math.floor(index / numCols);
            
            // Thêm độ ngẫu nhiên nhỏ để tránh xếp hàng thẳng tắp nhưng không quá nhiều
            const randomOffsetX = Math.random() * (horizontalGap * 0.5) - (horizontalGap * 0.25);
            const randomOffsetY = Math.random() * (verticalGap * 0.5) - (verticalGap * 0.25);
            
            // Tính toán vị trí cuối cùng
            const left = col * (boxWidth + horizontalGap) + randomOffsetX + horizontalGap;
            const top = row * (boxHeight + verticalGap) + randomOffsetY + verticalGap;
            
            // Đặt vị trí
            numberBox.style.left = `${left}px`;
            numberBox.style.top = `${top}px`;
            
            // Đặt kích thước tùy theo số lượng
            numberBox.style.width = `${boxWidth}px`;
            numberBox.style.height = `${boxHeight}px`;
            numberBox.style.fontSize = `${
                numberGameCountInGame <= 50 ? 20 : 
                numberGameCountInGame <= 100 ? 18 : 
                numberGameCountInGame <= 200 ? 15 : 13}px`;
            
            // Thêm màu sắc ngẫu nhiên
            const hue = Math.floor(Math.random() * 360);
            numberBox.style.backgroundColor = `hsl(${hue}, 80%, 75%)`;
            
            // Điều chỉnh màu chữ dựa trên độ sáng của màu nền
            if (hue > 40 && hue < 180) {
                numberBox.style.color = '#333'; // Màu tối cho nền sáng
            } else {
                numberBox.style.color = '#fff'; // Màu sáng cho nền tối
            }
            
            numberBox.addEventListener('click', () => handleNumberClick(numberBox, num));
            
            numbersContainer.appendChild(numberBox);
        });
    }, 100); // Đợi 100ms để đảm bảo container đã được render
}

/**
 * Xử lý khi người chơi chọn số (offline)
 */
function handleNumberClick(box, number) {
    if (gameOver) return;
    
    const num = parseInt(number);
    
    // Kiểm tra xem số có phải là số tiếp theo cần tìm không
    if (num === numberGameNextNumber) {
        // Thêm hiệu ứng animation khi tìm thấy số đúng
        box.style.transform = 'scale(1.5) rotate(360deg)';
        box.style.transition = 'all 0.5s';
        box.style.boxShadow = '0 0 20px #2ecc71';
        box.style.zIndex = '100';
        
        setTimeout(() => {
            // Đánh dấu số đã tìm thấy và ẩn đi
            box.classList.add('found');
            box.style.transform = 'scale(0) rotate(720deg)';
            box.style.opacity = '0';
            
            // Cập nhật điểm cho người chơi hiện tại
            numberGamePlayers[numberGameCurrentPlayerIndex].score++;
            
            // Cập nhật số tiếp theo cần tìm
            numberGameNextNumber++;
            
            // Kiểm tra kết thúc trò chơi
            if (numberGameNextNumber > numberGameCountInGame) {
                endGame();
                return;
            }
            
            // Cập nhật bảng điểm
            updateScoreBoard();
            
            // Cập nhật thông tin số cần tìm tiếp theo
            updateGameInfo();
        }, 500);
    } else {
        // Thêm hiệu ứng rung khi chọn sai
        box.style.transform = 'translateX(5px)';
        box.style.transition = 'transform 0.1s';
        box.style.boxShadow = '0 0 10px #e74c3c';
        
        setTimeout(() => {
            box.style.transform = 'translateX(-5px)';
            setTimeout(() => {
                box.style.transform = 'translateX(0)';
                box.style.boxShadow = '';
                
                // Chuyển lượt nếu chọn sai
                moveToNextPlayer();
                updateGameInfo();
                updateScoreBoard();
            }, 100);
        }, 100);
    }
}

/**
 * Chuyển lượt sang người chơi tiếp theo
 */
function moveToNextPlayer() {
    numberGameCurrentPlayerIndex = (numberGameCurrentPlayerIndex + 1) % numberGamePlayers.length;
}

/**
 * Cập nhật thông tin người chơi và số cần tìm
 */
function updateGameInfo() {
    if (numberGameIsOnline) {
        // Trong chế độ online, chỉ hiển thị số cần tìm tiếp theo
        currentPlayerDisplay.textContent = `Mọi người cùng tìm số!`;
    } else {
        // Trong chế độ offline, vẫn hiển thị lượt người chơi
        currentPlayerDisplay.textContent = `Lượt của: ${numberGamePlayers[numberGameCurrentPlayerIndex].name}`;
    }
    nextNumberDisplay.textContent = `Tìm số: ${numberGameNextNumber}`;
}

/**
 * Cập nhật bảng điểm
 */
function updateScoreBoard() {
    scoreBoard.innerHTML = '';
    
    numberGamePlayers.forEach((player, index) => {
        const playerScore = document.createElement('div');
        playerScore.className = 'player-score';
        
        // Trong chế độ online, không đánh dấu người chơi hiện tại
        if (!numberGameIsOnline && index === numberGameCurrentPlayerIndex) {
            playerScore.classList.add('active');
        }
        
        // Đánh dấu nếu là người chơi hiện tại (bạn)
        if (numberGameIsOnline && player.id === myPlayerId) {
            playerScore.classList.add('you');
        }
        
        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        playerName.textContent = player.name + (numberGameIsOnline && player.id === myPlayerId ? ' (Bạn)' : '');
        
        const score = document.createElement('div');
        score.className = 'score';
        score.textContent = `Điểm: ${player.score}`;
        
        playerScore.appendChild(playerName);
        playerScore.appendChild(score);
        scoreBoard.appendChild(playerScore);
    });
}

/**
 * Kết thúc game
 */
function endGame() {
    gameOver = true;
    gameSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    // Tìm người thắng
    let maxScore = -1;
    let winners = [];
    
    numberGamePlayers.forEach(player => {
        if (player.score > maxScore) {
            maxScore = player.score;
            winners = [player];
        } else if (player.score === maxScore) {
            winners.push(player);
        }
    });
    
    // Hiển thị người thắng
    if (winners.length === 1) {
        winnerDisplay.textContent = `${winners[0].name} thắng với ${winners[0].score} điểm!`;
    } else {
        const winnerNames = winners.map(winner => winner.name).join(' và ');
        winnerDisplay.textContent = `Hòa! ${winnerNames} cùng có ${maxScore} điểm!`;
    }
    
    // Hiển thị điểm số cuối cùng
    finalScoresDisplay.innerHTML = '';
    
    numberGamePlayers.forEach(player => {
        const playerFinalScore = document.createElement('div');
        playerFinalScore.className = 'player-final-score';
        playerFinalScore.textContent = `${player.name}: ${player.score} điểm`;
        finalScoresDisplay.appendChild(playerFinalScore);
    });
}

// Khởi tạo game khi tài liệu đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    initNumberGame();
    updatePlayerInputs();
    
    // Đăng ký sự kiện khi socket được khởi tạo
    document.addEventListener('socketInitialized', function() {
        if (socket) {
            initNumberGameSockets(socket);
        }
    });
    
    // Khởi tạo ngay nếu socket đã tồn tại
    if (socket) {
        initNumberGameSockets(socket);
    }
    
    // Chặn Ctrl+F khi đang chơi game
    document.addEventListener('keydown', function(e) {
        // Kiểm tra xem gameSection có đang hiển thị không 
        // (không có class 'hidden' và có hiển thị trong DOM)
        const isGameActive = !gameSection.classList.contains('hidden') && 
                            gameSection.offsetParent !== null;
        
        // Nếu đang trong màn hình chơi game
        if (isGameActive) {
            // Chặn Ctrl+F (70 là keyCode của F)
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
                e.preventDefault();
                showNotification('Không được phép sử dụng tính năng tìm kiếm trong trò chơi!', true);
                return false;
            }
            
            // Chặn cả F3 để tìm kiếm
            if (e.keyCode === 114 || e.key === 'F3') {
                e.preventDefault();
                showNotification('Không được phép sử dụng tính năng tìm kiếm trong trò chơi!', true);
                return false;
            }
        }
    });
}); 