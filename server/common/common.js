/**
 * Các chức năng dùng chung cho server
 */

// Tạo mã phòng ngẫu nhiên
function generateGameId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Tìm người thắng cuộc dựa trên điểm số
function findWinners(players) {
    let maxScore = -1;
    let winners = [];
    players.forEach(player => {
        if (player.score > maxScore) {
            maxScore = player.score;
            winners = [player];
        } else if (player.score === maxScore) {
            winners.push(player);
        }
    });
    return winners;
}

// Xáo trộn mảng (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Tạo vị trí ngẫu nhiên cho các số
function generateRandomPositions(count) {
    // Mảng vị trí
    const positions = [];
    const gridSize = 12; // Độ lớn lưới ảo
    
    // Mảng kiểm tra vị trí đã được sử dụng
    const used = new Array(gridSize * gridSize).fill(false);
    
    for (let i = 0; i < count; i++) {
        let position;
        let index;
        let attempts = 0;
        
        // Tìm vị trí trống
        do {
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);
            index = row * gridSize + col;
            position = { row: row / gridSize, col: col / gridSize };
            attempts++;
            
            // Nếu không tìm thấy vị trí trống sau nhiều lần thử, tạo thêm ô
            if (attempts > 50) {
                const unusedPositions = used
                    .map((u, idx) => ({ used: u, idx }))
                    .filter(item => !item.used)
                    .map(item => item.idx);
                
                if (unusedPositions.length > 0) {
                    index = unusedPositions[Math.floor(Math.random() * unusedPositions.length)];
                    const row = Math.floor(index / gridSize);
                    const col = index % gridSize;
                    position = { row: row / gridSize, col: col / gridSize };
                    break;
                } else {
                    // Nếu không có vị trí trống, tạo ngẫu nhiên
                    position = { 
                        row: Math.random(), 
                        col: Math.random() 
                    };
                    break;
                }
            }
        } while (used[index]);
        
        // Đánh dấu vị trí đã sử dụng
        if (index !== undefined) used[index] = true;
        
        positions.push(position);
    }
    
    return positions;
}

module.exports = {
    generateGameId,
    findWinners,
    shuffleArray,
    generateRandomPositions
}; 