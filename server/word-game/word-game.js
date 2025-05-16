/**
 * Logic game nối từ - Server side
 */

const { generateGameId } = require('../common/common');

// Dữ liệu trò chơi
const wordGames = {};

/**
 * Khởi tạo các event handler Socket.IO cho game nối từ
 */
function initWordGameHandlers(io, socket) {
    // Xử lý khi người dùng tạo phòng mới
    socket.on('create-word-game', (gameConfig) => {
        console.log('Nhận yêu cầu tạo phòng nối từ từ:', socket.id, gameConfig);
        
        const gameId = generateGameId();
        const playerName = gameConfig.playerName;
        const playerId = socket.id;

        // Tạo phòng nối từ mới
        wordGames[gameId] = {
            id: gameId,
            numPlayers: 999, // Không giới hạn số người chơi
            players: [{
                id: playerId,
                name: playerName
            }],
            currentPlayerIndex: 0,
            gameStarted: false,
            wordChain: [],
            timer: null,
            remainingPlayers: [], // Mảng lưu ID người chơi chưa được chọn trong vòng hiện tại
            reports: {} // Đối tượng lưu các báo cáo
        };

        // Thêm người chơi vào phòng socket
        socket.join(gameId);

        // Gửi thông tin trò chơi về cho người tạo
        socket.emit('word-game-created', {
            gameId,
            player: {
                id: playerId,
                name: playerName
            },
            isHost: true,
            gameInfo: wordGames[gameId]
        });

        console.log(`Đã tạo phòng nối từ ${gameId} với người chơi ${playerName}`);
    });

    // Xử lý khi người chơi tham gia phòng
    socket.on('join-word-game', (data) => {
        const { gameId, playerName } = data;
        const playerId = socket.id;

        // Kiểm tra xem phòng có tồn tại không
        if (!wordGames[gameId]) {
            socket.emit('error', { message: 'Phòng không tồn tại' });
            return;
        }

        // Kiểm tra xem trò chơi đã bắt đầu chưa
        if (wordGames[gameId].gameStarted) {
            socket.emit('error', { message: 'Trò chơi đã bắt đầu' });
            return;
        }

        // Thêm người chơi vào phòng
        wordGames[gameId].players.push({
            id: playerId,
            name: playerName
        });

        // Thêm người chơi vào phòng socket
        socket.join(gameId);

        // Gửi thông tin trò chơi về cho người chơi mới
        socket.emit('word-game-joined', {
            gameId,
            player: {
                id: playerId,
                name: playerName
            },
            isHost: false,
            gameInfo: wordGames[gameId]
        });

        // Thông báo cho tất cả người chơi trong phòng về người chơi mới
        io.to(gameId).emit('word-player-joined', {
            players: wordGames[gameId].players
        });

        console.log(`Người chơi ${playerName} đã tham gia phòng nối từ ${gameId}`);
    });

    // Xử lý khi chủ phòng bắt đầu trò chơi
    socket.on('start-word-game', (data) => {
        const { gameId } = data;

        if (!wordGames[gameId]) {
            return;
        }

        const game = wordGames[gameId];
        game.gameStarted = true;
        
        // Khởi tạo mảng remainingPlayers với tất cả người chơi
        game.remainingPlayers = game.players.map(player => player.id);
        
        // Chọn người chơi đầu tiên ngẫu nhiên
        const randomIndex = Math.floor(Math.random() * game.players.length);
        const firstPlayerId = game.players[randomIndex].id;
        
        // Loại người chơi đầu tiên khỏi mảng remainingPlayers
        game.remainingPlayers = game.remainingPlayers.filter(id => id !== firstPlayerId);
        
        // Cập nhật người chơi hiện tại
        game.currentPlayerIndex = randomIndex;
        
        // Thông báo cho tất cả người chơi trò chơi đã bắt đầu
        io.to(gameId).emit('word-game-started', {
            gameInfo: game
        });
        
        // Đảm bảo gửi thông tin lượt chơi sau khi giao diện game đã được khởi tạo
        setTimeout(() => {
            // Bắt đầu lượt đầu tiên
            io.to(gameId).emit('word-turn-update', {
                currentPlayerId: firstPlayerId,
                currentPlayerName: game.players[randomIndex].name,
                lastWord: null
            });
            
            // Bắt đầu đếm thời gian
            startWordTimer(gameId, io);
        }, 500); // Chờ 500ms để đảm bảo client đã xử lý xong sự kiện word-game-started
    });
    
    // Xử lý khi người chơi gửi từ
    socket.on('submit-word', (data) => {
        const { gameId, word } = data;
        
        if (!wordGames[gameId]) {
            socket.emit('error', { message: 'Phòng không tồn tại' });
            return;
        }
        
        const game = wordGames[gameId];
        
        // Tìm người chơi gửi từ
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex === -1) {
            socket.emit('error', { message: 'Bạn không phải người chơi trong phòng này' });
            return;
        }
        
        const player = game.players[playerIndex];
        const currentPlayer = game.players[game.currentPlayerIndex];
        
        // Kiểm tra bảo mật: chỉ người chơi đang đến lượt mới được gửi từ
        if (socket.id !== currentPlayer.id) {
            socket.emit('error', { message: `Không phải lượt của bạn! Đây là lượt chơi của ${currentPlayer.name}` });
            return;
        }
        
        // Báo cho client biết từ đã được nhận, để vô hiệu hóa input
        socket.emit('word-submission-received', { received: true });
        
        // Kiểm tra xem từ có hợp lệ không (bắt đầu bằng từ cuối cùng)
        if (game.wordChain.length > 0) {
            const lastWord = game.wordChain[game.wordChain.length - 1].word;
            const lastWordParts = lastWord.split(' ');
            const lastPart = lastWordParts[lastWordParts.length - 1];
            
            const newWordParts = word.split(' ');
            const firstPart = newWordParts[0];
            
            if (!firstPart.toLowerCase().startsWith(lastPart.toLowerCase())) {
                // Nếu từ không bắt đầu đúng, thông báo lỗi
                socket.emit('word-submission-rejected', { 
                    message: `Từ mới phải bắt đầu bằng "${lastPart}"` 
                });
                
                // KHÔNG khởi động lại timer hoặc gửi event word-turn-update
                // Người chơi vẫn giữ lượt, thời gian tiếp tục đếm ngược
                return;
            }
        }
        
        // Xóa bộ đếm thời gian hiện tại nếu từ hợp lệ
        if (game.timer) {
            clearTimeout(game.timer);
            game.timer = null;
        }
        
        // Thêm từ vào chuỗi
        game.wordChain.push({
            word: word,
            playerId: player.id,
            playerName: player.name
        });
        
        // Thông báo cho tất cả người chơi về từ mới
        io.to(gameId).emit('word-chain-update', {
            word: word,
            playerId: player.id,
            playerName: player.name,
            isLastWord: true
        });
        
        // Chọn người chơi tiếp theo ngẫu nhiên
        selectNextRandomPlayer(gameId, io);
        
        // Bắt đầu bộ đếm thời gian mới
        startWordTimer(gameId, io);
    });
    
    // Xử lý khi người chơi thoát phòng
    socket.on('leave-word-game', (data) => {
        const { gameId } = data;

        if (!wordGames[gameId]) {
            return;
        }

        leaveWordGame(socket.id, gameId, io);
    });

    // Xử lý khi người chơi mất kết nối
    socket.on('disconnect', () => {
        // Tìm tất cả các phòng nối từ mà người chơi này tham gia
        for (const gameId in wordGames) {
            const playerIndex = wordGames[gameId].players.findIndex(player => player.id === socket.id);
            if (playerIndex !== -1) {
                leaveWordGame(socket.id, gameId, io);
            }
        }
    });

    // Xử lý khi người chơi báo cáo từ không hợp lý
    socket.on('report-word', (data) => {
        const { gameId, word } = data;
        
        if (!wordGames[gameId] || !wordGames[gameId].gameStarted) {
            return;
        }
        
        const game = wordGames[gameId];
        const playerId = socket.id;
        
        // Lấy từ cuối cùng trong chuỗi
        const lastWordIndex = game.wordChain.length - 1;
        if (lastWordIndex < 0) return;
        
        const lastWord = game.wordChain[lastWordIndex];
        
        // Chỉ cho phép báo cáo từ cuối cùng và không phải từ của người báo cáo
        if (lastWord.word !== word || lastWord.playerId === playerId) {
            return;
        }
        
        // Tạo key cho từ được báo cáo
        const reportKey = `${lastWord.playerId}_${word}`;
        
        // Khởi tạo nếu chưa có
        if (!game.reports[reportKey]) {
            game.reports[reportKey] = {
                word: word,
                playerId: lastWord.playerId,
                playerName: lastWord.playerName,
                reporters: [],
                votesRequired: Math.ceil((game.players.length - 1) * 0.5), // Trừ người bị báo cáo
                votesReceived: 0,
                playersVoted: []
            };
        }
        
        // Gửi yêu cầu bỏ phiếu cho tất cả người chơi khác
        io.to(gameId).emit('report-vote-request', {
            word: word,
            reportedBy: socket.nickname || 'Người chơi',
            playerName: lastWord.playerName,
            votesRequired: game.reports[reportKey].votesRequired,
            reportKey: reportKey,
            totalVoters: game.players.length - 1 // Tổng số người có thể bỏ phiếu (trừ người bị báo cáo)
        });
        
        // Thông báo cho người báo cáo
        socket.emit('report-initiated', {
            word: word,
            votesRequired: game.reports[reportKey].votesRequired,
            totalVoters: game.players.length - 1
        });
    });

    // Xử lý sự kiện khi người chơi bỏ phiếu báo cáo
    socket.on('report-vote', (data) => {
        const { gameId, reportKey, vote } = data;
        
        if (!wordGames[gameId] || !wordGames[gameId].gameStarted || !wordGames[gameId].reports[reportKey]) {
            return;
        }
        
        const game = wordGames[gameId];
        const report = game.reports[reportKey];
        const playerId = socket.id;
        
        // Kiểm tra xem người chơi đã bỏ phiếu chưa
        if (report.playersVoted.includes(playerId)) {
            return;
        }
        
        // Ghi nhận người đã bỏ phiếu
        report.playersVoted.push(playerId);
        
        // Nếu đồng ý báo cáo, tăng số lượng phiếu
        if (vote === true) {
            report.votesReceived++;
            if (!report.reporters.includes(playerId)) {
                report.reporters.push(playerId);
            }
        }
        
        // Thông báo cập nhật số phiếu cho tất cả người chơi
        io.to(gameId).emit('report-vote-update', {
            reportKey: reportKey,
            votesReceived: report.votesReceived,
            votesRequired: report.votesRequired,
            playersVoted: report.playersVoted.length,
            totalPlayers: game.players.length,
            totalVoters: game.players.length - 1 // Tổng số người có thể bỏ phiếu (trừ người bị báo cáo)
        });
        
        // Kiểm tra nếu số lượng phiếu đồng ý đã đạt yêu cầu
        if (report.votesReceived >= report.votesRequired) {
            // Lấy người chơi đã nhập từ
            const targetPlayerId = report.playerId;
            
            // Thông báo cho tất cả người chơi biết từ đã bị báo cáo
            io.to(gameId).emit('word-reported', {
                word: report.word,
                playerName: report.playerName,
                reporters: report.votesReceived,
                totalPlayers: game.players.length,
                totalVoters: Math.max(1, game.players.length - 1) // Đảm bảo totalVoters luôn >= 1
            });
            
            // Chờ một chút để mọi người đọc thông báo
            setTimeout(() => {
                // Kết thúc game với người thua là người nhập từ
                endWordGame(gameId, report.playerName, io);
            }, 2000);
        }
        
        // Kiểm tra nếu tất cả người chơi đã bỏ phiếu (trừ người bị báo cáo)
        if (report.playersVoted.length >= game.players.length - 1) {
            // Nếu không đủ phiếu đồng ý và tất cả đã bỏ phiếu rồi
            if (report.votesReceived < report.votesRequired) {
                io.to(gameId).emit('report-rejected', {
                    word: report.word,
                    playerName: report.playerName,
                    votesReceived: report.votesReceived,
                    votesRequired: report.votesRequired,
                    totalVoters: game.players.length - 1
                });
            }
        }
    });
}

/**
 * Chọn người chơi tiếp theo ngẫu nhiên
 */
function selectNextRandomPlayer(gameId, io) {
    const game = wordGames[gameId];
    if (!game) return;
    
    // Nếu đã hết người chơi trong vòng hiện tại, lấy lại tất cả
    if (game.remainingPlayers.length === 0) {
        game.remainingPlayers = game.players.map(player => player.id);
        // Loại người chơi hiện tại để không chọn lại ngay
        const currentPlayerId = game.players[game.currentPlayerIndex].id;
        game.remainingPlayers = game.remainingPlayers.filter(id => id !== currentPlayerId);
    }
    
    // Chọn ngẫu nhiên 1 người chơi từ những người còn lại
    const randomIndex = Math.floor(Math.random() * game.remainingPlayers.length);
    const nextPlayerId = game.remainingPlayers[randomIndex];
    
    // Xóa người chơi đã chọn khỏi danh sách
    game.remainingPlayers.splice(randomIndex, 1);
    
    // Cập nhật chỉ số người chơi hiện tại
    game.currentPlayerIndex = game.players.findIndex(player => player.id === nextPlayerId);
    
    // Cập nhật lượt mới
    const lastWord = game.wordChain.length > 0 ? 
        game.wordChain[game.wordChain.length - 1].word : null;
        
    io.to(gameId).emit('word-turn-update', {
        currentPlayerId: nextPlayerId,
        currentPlayerName: game.players[game.currentPlayerIndex].name,
        lastWord: lastWord
    });
}

/**
 * Xử lý khi người chơi rời khỏi phòng nối từ
 */
function leaveWordGame(playerId, gameId, io) {
    const game = wordGames[gameId];
    
    // Tìm người chơi
    const playerIndex = game.players.findIndex(player => player.id === playerId);
    if (playerIndex === -1) return;
    
    const playerName = game.players[playerIndex].name;
    
    // Xóa người chơi khỏi danh sách
    game.players.splice(playerIndex, 1);
    
    // Cập nhật mảng remainingPlayers
    game.remainingPlayers = game.remainingPlayers.filter(id => id !== playerId);
    
    // Nếu không còn ai trong phòng, xóa phòng
    if (game.players.length === 0) {
        // Xóa timer nếu có
        if (game.timer) {
            clearTimeout(game.timer);
        }
        
        delete wordGames[gameId];
        return;
    }
    
    // Nếu game đã bắt đầu và còn 1 người, kết thúc game
    if (game.gameStarted && game.players.length === 1) {
        // Xóa timer nếu có
        if (game.timer) {
            clearTimeout(game.timer);
        }
        
        endWordGame(gameId, playerName, io);
        return;
    }
    
    // Nếu người thoát đang là người chơi hiện tại
    if (game.gameStarted && game.currentPlayerIndex >= game.players.length || 
        (game.currentPlayerIndex < game.players.length && game.players[game.currentPlayerIndex].id === playerId)) {
        // Xóa timer nếu có
        if (game.timer) {
            clearTimeout(game.timer);
        }
        
        // Chọn người chơi tiếp theo ngẫu nhiên
        selectNextRandomPlayer(gameId, io);
        
        // Bắt đầu timer mới
        startWordTimer(gameId, io);
    }
    
    // Thông báo cho những người còn lại
    io.to(gameId).emit('word-player-left', {
        playerName,
        players: game.players
    });
}

/**
 * Bắt đầu đếm thời gian cho người chơi hiện tại
 */
function startWordTimer(gameId, io) {
    const game = wordGames[gameId];
    if (!game) return;
    
    // Đếm ngược từ 30 giây
    let secondsLeft = 30;
    
    // Hàm đếm ngược và gửi cập nhật
    const countDown = () => {
        // Gửi cập nhật thời gian
        io.to(gameId).emit('word-timer-update', {
            seconds: secondsLeft
        });
        
        secondsLeft--;
        
        if (secondsLeft >= 0) {
            // Đặt timeout tiếp theo
            game.timer = setTimeout(countDown, 1000);
        } else {
            // Hết thời gian, người chơi thua
            game.timer = null;
            
            // Kết thúc game với người thua là người chơi hiện tại
            const loser = game.players[game.currentPlayerIndex];
            endWordGame(gameId, loser.name, io);
        }
    };
    
    // Bắt đầu đếm
    countDown();
}

/**
 * Kết thúc game nối từ
 */
function endWordGame(gameId, loserName, io) {
    const game = wordGames[gameId];
    if (!game) return;
    
    // Thông báo kết thúc game cho tất cả người chơi
    io.to(gameId).emit('word-game-over', {
        loserName: loserName || 'unknown',
        wordChain: game.wordChain
    });
    
    // Đặt trạng thái game về chưa bắt đầu
    game.gameStarted = false;
    game.wordChain = [];
    game.currentPlayerIndex = 0;
    game.remainingPlayers = [];
    game.reports = {};
    
    // Xóa timer nếu có
    if (game.timer) {
        clearTimeout(game.timer);
        game.timer = null;
    }
}

module.exports = {
    initWordGameHandlers
}; 