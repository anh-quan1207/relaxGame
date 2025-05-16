/**
 * Logic game tìm số - Server side
 */

const { generateGameId, findWinners, generateRandomPositions } = require('../common/common');

// Dữ liệu trò chơi
const games = {};

/**
 * Khởi tạo các event handler Socket.IO cho game tìm số
 */
function initNumberGameHandlers(io, socket) {
    // Xử lý khi người dùng tạo phòng mới
    socket.on('create-game', (gameConfig) => {
        console.log('Nhận yêu cầu tạo phòng từ:', socket.id, gameConfig);
        
        const gameId = generateGameId();
        const playerName = gameConfig.playerName;
        const playerId = socket.id;

        // Tạo phòng chơi mới
        games[gameId] = {
            id: gameId,
            numPlayers: gameConfig.numPlayers,
            maxNumber: gameConfig.maxNumber,
            players: [{
                id: playerId,
                name: playerName,
                score: 0
            }],
            nextNumber: 1,
            gameStarted: false,
            numberPositions: []
        };

        // Thêm người chơi vào phòng socket
        socket.join(gameId);

        // Gửi thông tin trò chơi về cho người tạo
        socket.emit('game-created', {
            gameId,
            player: {
                id: playerId,
                name: playerName
            },
            isHost: true,
            gameInfo: games[gameId]
        });

        console.log(`Đã tạo phòng ${gameId} với người chơi ${playerName}`);
    });

    // Xử lý khi người chơi tham gia phòng
    socket.on('join-game', (data) => {
        const { gameId, playerName } = data;
        const playerId = socket.id;

        // Kiểm tra xem phòng có tồn tại không
        if (!games[gameId]) {
            socket.emit('error', { message: 'Phòng không tồn tại' });
            return;
        }

        // Kiểm tra xem phòng đã đầy chưa
        if (games[gameId].players.length >= games[gameId].numPlayers) {
            socket.emit('error', { message: 'Phòng đã đầy' });
            return;
        }

        // Kiểm tra xem trò chơi đã bắt đầu chưa
        if (games[gameId].gameStarted) {
            socket.emit('error', { message: 'Trò chơi đã bắt đầu' });
            return;
        }

        // Thêm người chơi vào phòng
        games[gameId].players.push({
            id: playerId,
            name: playerName,
            score: 0
        });

        // Thêm người chơi vào phòng socket
        socket.join(gameId);

        // Gửi thông tin trò chơi về cho người chơi mới
        socket.emit('game-joined', {
            gameId,
            player: {
                id: playerId,
                name: playerName
            },
            isHost: false,
            gameInfo: games[gameId]
        });

        // Thông báo cho tất cả người chơi trong phòng về người chơi mới
        io.to(gameId).emit('player-joined', {
            players: games[gameId].players
        });

        console.log(`Người chơi ${playerName} đã tham gia phòng ${gameId}`);
    });

    // Xử lý khi chủ phòng bắt đầu trò chơi
    socket.on('start-game', (data) => {
        const { gameId } = data;

        if (!games[gameId]) {
            return;
        }

        // Tạo vị trí ngẫu nhiên cho các số
        const maxNumber = games[gameId].maxNumber;
        const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
        const positions = generateRandomPositions(maxNumber);

        games[gameId].numberPositions = numbers.map((num, index) => ({
            number: num,
            position: positions[index]
        }));
        games[gameId].gameStarted = true;
        games[gameId].nextNumber = 1;

        // Thông báo cho tất cả người chơi trò chơi đã bắt đầu
        io.to(gameId).emit('game-started', {
            gameInfo: games[gameId]
        });
    });

    // Xử lý khi người chơi chọn số
    socket.on('select-number', (data) => {
        const { gameId, number } = data;

        if (!games[gameId]) {
            return;
        }

        const game = games[gameId];
        const playerId = socket.id;
        
        // Tìm người chơi trong danh sách
        const playerIndex = game.players.findIndex(player => player.id === playerId);
        if (playerIndex === -1) {
            return;
        }

        // Kiểm tra xem số có đúng không (là số tiếp theo cần tìm)
        if (number === game.nextNumber) {
            // Cập nhật điểm cho người chơi đã chọn đúng
            game.players[playerIndex].score++;
            
            // Cập nhật số tiếp theo
            game.nextNumber++;

            // Kiểm tra kết thúc trò chơi
            if (game.nextNumber > game.maxNumber) {
                io.to(gameId).emit('game-over', {
                    players: game.players,
                    winners: findWinners(game.players)
                });
                return;
            }

            // Thông báo cho tất cả người chơi
            io.to(gameId).emit('number-selected', {
                number,
                playerId,
                playerName: game.players[playerIndex].name,
                nextNumber: game.nextNumber,
                players: game.players
            });
        } else {
            // Thông báo cho người chơi rằng họ đã chọn sai
            socket.emit('wrong-number', {
                number,
                nextNumber: game.nextNumber
            });
        }
    });

    // Xử lý khi người chơi thoát phòng
    socket.on('leave-game', (data) => {
        const { gameId } = data;

        if (!games[gameId]) {
            return;
        }

        leaveGame(socket.id, gameId, io);
    });

    // Xử lý khi người chơi mất kết nối
    socket.on('disconnect', () => {
        // Tìm tất cả các phòng mà người chơi này tham gia
        for (const gameId in games) {
            const playerIndex = games[gameId].players.findIndex(player => player.id === socket.id);
            if (playerIndex !== -1) {
                leaveGame(socket.id, gameId, io);
            }
        }
    });
}

/**
 * Xử lý khi người chơi rời khỏi phòng
 */
function leaveGame(playerId, gameId, io) {
    const game = games[gameId];
    
    // Tìm người chơi
    const playerIndex = game.players.findIndex(player => player.id === playerId);
    if (playerIndex === -1) return;
    
    const playerName = game.players[playerIndex].name;
    
    // Xóa người chơi khỏi danh sách
    game.players.splice(playerIndex, 1);
    
    // Nếu không còn ai trong phòng, xóa phòng
    if (game.players.length === 0) {
        delete games[gameId];
        return;
    }
    
    // Nếu game đã bắt đầu và còn 1 người, kết thúc game
    if (game.gameStarted && game.players.length === 1) {
        io.to(gameId).emit('game-over', {
            players: game.players,
            winners: game.players
        });
    }
    
    // Thông báo cho những người còn lại
    io.to(gameId).emit('player-left', {
        playerName,
        players: game.players
    });
}

module.exports = {
    initNumberGameHandlers
}; 