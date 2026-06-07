<script lang="ts">
    const unitSize = 10;

    type ShapeDef = { shape: number[][]; color: string };
    type BoardCell = { data: number; color?: string };
    type ActivePiece = { data: number[][]; color: string; x: number; y: number };

    // The state of a single bot, including its board, current piece, and game status
    type BotState = {
        id: number;
        offsetX: number;
        width: number;
        height: number;
        boardWidth: number;
        boardHeight: number;
        board: BoardCell[][];
        piece: ActivePiece | null;
        lastMove: number;
        speed: number;
        mode: 'playing' | 'losing';
        loseBlock: number;
    };

    /* The 7 standard Tetris pieces with their shapes and colors.
    Note: Each piece is represented in a 4x4 grid for easier rotation and collision logic. */
    const tetrominos: ShapeDef[] = [
        { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#00FFFF' }, 
        { shape: [[0,0,0,0], [1,1,1,0], [0,0,1,0], [0,0,0,0]], color: '#0066FF' }, 
        { shape: [[0,0,0,0], [1,1,1,0], [1,0,0,0], [0,0,0,0]], color: '#FF8800' }, 
        { shape: [[0,0,0,0], [0,1,1,0], [0,1,1,0], [0,0,0,0]], color: '#FFE600' }, 
        { shape: [[0,0,0,0], [0,1,1,0], [1,1,0,0], [0,0,0,0]], color: '#00FF00' }, 
        { shape: [[0,0,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]], color: '#CC00FF' }, 
        { shape: [[0,0,0,0], [1,1,0,0], [0,1,1,0], [0,0,0,0]], color: '#FF0033' }  
    ];

    function getRandomPiece(boardWidth: number): ActivePiece {
        const type = tetrominos[Math.floor(Math.random() * tetrominos.length)];
        return {
            data: type.shape,
            color: type.color,
            x: Math.floor(Math.random() * (boardWidth - 3)),
            y: -2
        };
    }

    function createBot(id: number, offsetX: number, width: number, height: number): BotState {
        const boardWidth = Math.floor(width / unitSize) - 1; // -1 because pieces can be up to 4 blocks wide, but we want to ensure they spawn fully within the board
        const boardHeight = Math.floor(height / unitSize) - 1;
        
        const board: BoardCell[][] = Array.from({ length: boardWidth + 1 }, () => 
            Array.from({ length: boardHeight + 1 }, () => ({ data: 0 }))
        );

        return {
            id, offsetX, width, height, boardWidth, boardHeight, board,
            piece: getRandomPiece(boardWidth),
            lastMove: performance.now(),
            speed: 20 + Math.random() * 40,
            mode: 'playing',
            loseBlock: 0
        };
    }

    function isCollision(piece: ActivePiece, board: BoardCell[][], bw: number, bh: number, dx: number, dy: number): boolean {
        const size = piece.data.length;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (piece.data[r][c] === 1) {
                    const nx = piece.x + c + dx;
                    const ny = piece.y + r + dy;
                    if (nx < 0 || nx > bw || ny > bh) return true; // Out of bounds
                    if (ny >= 0 && board[nx]?.[ny]?.data === 1) return true; // Collision with existing block (ignore blocks above the board)
                }
            }
        }
        return false;
    }

    function rotatePiece(piece: ActivePiece): ActivePiece {
        const size = piece.data.length;
        const rotatedData = Array.from({ length: size }, () => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                rotatedData[c][size - 1 - r] = piece.data[r][c];
            }
        }
        // Retourne un NOUVEL objet (immuabilité)
        return { ...piece, data: rotatedData };
    }

    function botBrain(piece: ActivePiece, board: BoardCell[][], bw: number, bh: number): ActivePiece {
        const rand = Math.random();
        if (rand < 0.04 && !isCollision(piece, board, bw, bh, -1, 0)) {
            return { ...piece, x: piece.x - 1 };
        } else if (rand < 0.08 && !isCollision(piece, board, bw, bh, 1, 0)) {
            return { ...piece, x: piece.x + 1 };
        } else if (rand < 0.12) {
            const rotated = rotatePiece(piece);
            if (!isCollision(rotated, board, bw, bh, 0, 0)) return rotated;
        }
        return piece;
    }

    // When a piece can no longer move down, we lock it into the board and check for line clears. Returns a new BotState with the updated board and a new piece.
    function lockPieceAndClearLines(bot: BotState): BotState {
        if (!bot.piece) return bot;
        
        // Deep Copy of the board to maintain immutability
        const newBoard = bot.board.map(col => [...col]);
        const size = bot.piece.data.length;
        
        // 1. Lock the piece into the board
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (bot.piece.data[r][c] === 1) {
                    const bx = bot.piece.x + c;
                    const by = bot.piece.y + r;
                    if (bx >= 0 && bx <= bot.boardWidth && by >= 0 && by <= bot.boardHeight) {
                        newBoard[bx][by] = { data: 1, color: bot.piece.color };
                    }
                }
            }
        }

        // 2. Clear full lines and move everything down
        for (let y = bot.boardHeight; y >= 0; y--) {
            let lineFull = true;
            for (let x = 0; x <= bot.boardWidth; x++) {
                if (newBoard[x][y].data === 0) {
                    lineFull = false;
                    break;
                }
            }
            if (lineFull) {
                // Move everything above down
                for (let lineY = y; lineY > 0; lineY--) {
                    for (let x = 0; x <= bot.boardWidth; x++) {
                        newBoard[x][lineY] = newBoard[x][lineY - 1];
                    }
                }
                // Clear the top line
                for (let x = 0; x <= bot.boardWidth; x++) {
                    newBoard[x][0] = { data: 0 };
                }
                y++; // Recheck the same line after moving down, in case of multiple line clears
            }
        }

        return { ...bot, board: newBoard, piece: getRandomPiece(bot.boardWidth) };
    }

    // Takes the current bot state and the current time, and returns a new bot state based on the game logic. This function is called on every frame for each bot.
    function updateBot(bot: BotState, time: number): BotState {
        if (bot.mode === 'losing') {
            // Game over animation. Rising blocks effect
            if (time - bot.lastMove > 30) {
                if (bot.loseBlock > bot.boardHeight) {
                    return createBot(bot.id, bot.offsetX, bot.width, bot.height); // Reset
                }
                return { ...bot, loseBlock: bot.loseBlock + 1, lastMove: time };
            }
            return bot;
        }

        if (!bot.piece) return bot;

        // Falling speed
        if (time - bot.lastMove > bot.speed) {
            const nextPiece = botBrain(bot.piece, bot.board, bot.boardWidth, bot.boardHeight);

            if (!isCollision(nextPiece, bot.board, bot.boardWidth, bot.boardHeight, 0, 1)) {
                return { ...bot, piece: { ...nextPiece, y: nextPiece.y + 1 }, lastMove: time };
            } else {
                if (nextPiece.y < 0) {
                    return { ...bot, mode: 'losing', lastMove: time }; // Game Over
                } else {
                    return { ...lockPieceAndClearLines({ ...bot, piece: nextPiece }), lastMove: time };
                }
            }
        }
        return bot;
    }


    let clientWidth = $state(0);
    let clientHeight = $state(0);
    let bots = $state<BotState[]>([]);

    // Initialization effect to create bots based on the initial window size
    $effect(() => {
        if (!clientWidth || !clientHeight) return;
        
        const targetBoardWidth = 120;
        const numBoards = Math.max(2, Math.floor(clientWidth / targetBoardWidth));
        
        // Only create bots if we don't have the correct number already (e.g., on initial load or when resizing)
        if (bots.length !== numBoards) {
            const boardDiv = unitSize * Math.round(clientWidth / unitSize);
            const bWidth = boardDiv / numBoards;
            
            bots = Array.from({ length: numBoards }, (_, i) => {
                const offsetX = unitSize * Math.round((i * bWidth) / unitSize);
                return createBot(i, offsetX, bWidth, clientHeight);
            });
        }
    });

    // Game loop (60 FPS)
    $effect(() => {
        let frame: number;
        const loop = (time: number) => {
            // map() returns a new array, which is essential for Svelte's reactivity to detect changes in the bots array. We update each bot's state based on the game logic defined in updateBot.
            bots = bots.map(bot => updateBot(bot, time));
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        
        return () => cancelAnimationFrame(frame);
    });
</script>

<div class="absolute inset-0 w-full h-full opacity-40 pointer-events-none z-[-1] overflow-hidden" bind:clientWidth bind:clientHeight>
    {#each bots as bot (bot.id)}
        <div class="absolute top-0 bottom-0" style="left: {bot.offsetX}px; width: {bot.width}px;">
            
            {#each bot.board as col, x}
                {#each col as cell, y}
                    {#if cell.data === 1 && cell.color}
                        <div class="tetris-block" style="transform: translate({x * unitSize}px, {y * unitSize}px);">
                            <div class="tetris-block-bg" style="background-color: {cell.color}; box-shadow: 0 0 10px {cell.color};"></div>
                            <div class="tetris-block-bevel"></div>
                        </div>
                    {/if}
                {/each}
            {/each}

            {#if bot.mode === 'playing' && bot.piece}
                {#each bot.piece.data as row, r}
                    {#each row as val, c}
                        {#if val === 1}
                            <div class="tetris-block" style="transform: translate({(bot.piece.x + c) * unitSize}px, {(bot.piece.y + r) * unitSize}px);">
                                <div class="tetris-block-bg" style="background-color: {bot.piece.color}; box-shadow: 0 0 10px {bot.piece.color};"></div>
                                <div class="tetris-block-bevel"></div>
                            </div>
                        {/if}
                    {/each}
                {/each}
            {/if}

            {#if bot.mode === 'losing' && bot.loseBlock > 0}
                {#each Array(bot.boardWidth + 1) as _, x}
                    {#each Array(bot.loseBlock) as _, dy}
                        {@const y = bot.boardHeight - dy}
                        {#if y >= 0}
                            <div class="tetris-block" style="transform: translate({x * unitSize}px, {y * unitSize}px);">
                                <div class="tetris-block-bg" style="background-color: #505050; opacity: 1; box-shadow: none;"></div>
                                <div class="tetris-block-bevel" style="border-color: rgba(255,255,255,0.1)"></div>
                            </div>
                        {/if}
                    {/each}
                {/each}
            {/if}

        </div>
    {/each}
</div>

<style>
    /*  Using absolute positioning and GPU-accelerated transforms for smooth animation of blocks.
        Each block is a 10x10 pixel square (unitSize) with a colored background and a bevel effect for depth.
        The will-change property hints to the browser to optimize for animations on the transform property. *
    */
    .tetris-block {
        position: absolute;
        top: 0; left: 0;
        width: 10px; /* Aligned on unitSize = 10 */
        height: 10px;
        box-sizing: border-box;
        border: 1.5px solid rgba(255, 255, 255, 0.7);
        will-change: transform;
    }

    .tetris-block-bg {
        position: absolute;
        inset: 0;
        opacity: 0.6;
    }

    .tetris-block-bevel {
        position: absolute;
        top: 1px; left: 1px; right: 1px; bottom: 1px;
        border: 1px solid rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 10;
    }
</style>