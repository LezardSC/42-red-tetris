<script lang="ts">
    import { onMount } from 'svelte';

    type TetrominoDef = { color: string; data: number[][] };
    type BoardCell = { data: number; color?: string };
    type ActivePiece = { data: number[][] | null; color: string; x: number; y: number };

    let container: HTMLDivElement;

    onMount(() => {
        if (!container) return;

        const tetrominos: TetrominoDef[] = [
            { color: '#00FFFF', data: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]] }, 
            { color: '#0066FF', data: [[0,0,0,0], [1,1,1,0], [0,0,1,0], [0,0,0,0]] }, 
            { color: '#FF8800', data: [[0,0,0,0], [1,1,1,0], [1,0,0,0], [0,0,0,0]] }, 
            { color: '#FFE600', data: [[0,0,0,0], [0,1,1,0], [0,1,1,0], [0,0,0,0]] }, 
            { color: '#00FF00', data: [[0,0,0,0], [0,1,1,0], [1,1,0,0], [0,0,0,0]] }, 
            { color: '#CC00FF', data: [[0,0,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]] }, 
            { color: '#FF0033', data: [[0,0,0,0], [1,1,0,0], [0,1,1,0], [0,0,0,0]] }  
        ];

        class TetrisBot {
            posX: number;
            posY: number;
            width: number;
            height: number;
            
            bgCanvas: HTMLCanvasElement;
            fgCanvas: HTMLCanvasElement;
            bgCtx: CanvasRenderingContext2D;
            fgCtx: CanvasRenderingContext2D;
            
            curPiece: ActivePiece;
            lastMove: number = 0;
            curSpeed: number = 0;
            unitSize: number = 10;
            
            linesCleared: number = 0;
            level: number = 0;
            loseBlock: number = 0;
            
            board: BoardCell[][] = [];
            boardWidth: number = 0;
            boardHeight: number = 0;
            animationId: number = 0;

            constructor(x: number, y: number, width: number, height: number) {
                this.posX = x || 0;
                this.posY = y || 0;
                this.width = width;
                this.height = height;

                this.bgCanvas = document.createElement('canvas');
                this.fgCanvas = document.createElement('canvas');
                
                this.bgCanvas.width = this.width;
                this.fgCanvas.width = this.width;
                this.bgCanvas.height = this.height;
                this.fgCanvas.height = this.height;

                this.bgCtx = this.bgCanvas.getContext('2d')!;
                this.fgCtx = this.fgCanvas.getContext('2d')!;

                this.bgCanvas.style.position = 'absolute';
                this.fgCanvas.style.position = 'absolute';
                this.bgCanvas.style.left = `${this.posX}px`;
                this.bgCanvas.style.top = `${this.posY}px`;
                this.fgCanvas.style.left = `${this.posX}px`;
                this.fgCanvas.style.top = `${this.posY}px`;

                container.appendChild(this.bgCanvas);
                container.appendChild(this.fgCanvas);
                
                this.curPiece = { data: null, color: '#000000', x: 0, y: 0 };
                this.init();
            }

            init(): void {
                this.lastMove = Date.now();
                this.curSpeed = 20 + Math.random() * 40; 
                this.linesCleared = 0;
                this.level = 0;
                this.loseBlock = 0;
                
                this.boardWidth = Math.floor(this.width / this.unitSize);
                this.boardHeight = Math.floor(this.height / this.unitSize) - 1;
                this.board = [];

                for (let x = 0; x <= this.boardWidth; x++) {
                    this.board[x] = [];
                    for (let y = 0; y <= this.boardHeight; y++) {
                        this.board[x][y] = { data: 0, color: '#000000' };
                    }
                }

                this.renderBoard();
                this.newTetromino();
                this.update();
            }

            botBrain(): void {
                const rand = Math.random();
                if (rand < 0.04) {
                    if (this.checkMovement(this.curPiece, -1, 0)) this.curPiece.x--;
                } else if (rand < 0.08) {
                    if (this.checkMovement(this.curPiece, 1, 0)) this.curPiece.x++;
                } else if (rand < 0.12) {
                    this.tryRotation();
                }
            }

            tryRotation(): void {
                if (!this.curPiece.data) return;
                
                const size = this.curPiece.data.length;
                let rotatedData = Array.from({ length: size }, () => Array(size).fill(0));
                
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        rotatedData[c][size - 1 - r] = this.curPiece.data[r][c];
                    }
                }

                let dummyPiece: ActivePiece = { ...this.curPiece, data: rotatedData };
                if (this.checkMovement(dummyPiece, 0, 0)) {
                    this.curPiece.data = rotatedData;
                }
            }

            update(): void {
                if (!this.checkMovement(this.curPiece, 0, 1)) {
                    if (this.curPiece.y < -1) {
                        this.loseScreen();
                        return;
                    } else {
                        this.fillBoard(this.curPiece);
                        this.newTetromino();
                    }
                } else {
                    if (Date.now() > this.lastMove) {
                        this.lastMove = Date.now() + this.curSpeed;
                        this.botBrain();

                        if (this.checkMovement(this.curPiece, 0, 1)) {
                            this.curPiece.y++;
                        } else {
                            this.fillBoard(this.curPiece);
                            this.newTetromino();
                        }
                    }
                }

                this.render();
                this.animationId = requestAnimationFrame(() => this.update());
            }

            drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha = 0.7): void {
                const bX = x * this.unitSize;
                const bY = y * this.unitSize;

                ctx.save();
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha;
                ctx.shadowBlur = 6;
                ctx.shadowColor = color;
                ctx.fillRect(bX, bY, this.unitSize, this.unitSize);

                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bX, bY, this.unitSize, this.unitSize);

                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(bX + 1, bY + 1, this.unitSize - 2, this.unitSize - 2);
                ctx.restore();
            }

            renderBoard(): void {
                this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
                for (let x = 0; x <= this.boardWidth; x++) {
                    for (let y = 0; y <= this.boardHeight; y++) {
                        if (this.board[x][y].data !== 0 && this.board[x][y].color) {
                            this.drawBlock(this.bgCtx, x, y, this.board[x][y].color!, 0.6);
                        }
                    }
                }
            }

            render(): void {
                this.fgCtx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
                if (!this.curPiece.data) return;

                for (let x = 0; x < 4; x++) {
                    for (let y = 0; y < 4; y++) {
                        if (this.curPiece.data[x][y] === 1) {
                            const targetX = this.curPiece.x + x;
                            const targetY = this.curPiece.y + y;

                            if (targetY > -1) {
                                this.drawBlock(this.fgCtx, targetX, targetY, this.curPiece.color, 0.8);
                            }
                        }
                    }
                }
            }

            checkMovement(piece: ActivePiece, newX: number, newY: number): boolean {
                if (!piece.data) return false;
                
                for (let x = 0; x < 4; x++) {
                    for (let y = 0; y < 4; y++) {
                        if (piece.data[x][y] === 1) {
                            const targetX = piece.x + x + newX;
                            const targetY = piece.y + y + newY;
                            
                            if (targetX >= this.boardWidth || targetX < 0 || targetY > this.boardHeight) return false;
                            if (!this.board[targetX]) this.board[targetX] = [];
                            if (!this.board[targetX][targetY]) this.board[targetX][targetY] = { data: 0 };
                            if (this.board[targetX][targetY].data === 1) return false;
                        }
                    }
                }
                return true;
            }

            checkLines(): void {
                let y = this.boardHeight + 1;
                while (y--) {
                    let x = this.boardWidth;
                    let lines = 0;
                    
                    while (x--) {
                        if (this.board[x][y].data === 1) lines++;
                    }
                    
                    if (lines === this.boardWidth) {
                        this.linesCleared++;
                        let lineY = y;
                        
                        while (lineY) {
                            for (x = 0; x <= this.boardWidth; x++) {
                                if (lineY - 1 > 0) {
                                    this.board[x][lineY].data = this.board[x][lineY - 1].data;
                                    this.board[x][lineY].color = this.board[x][lineY - 1].color;
                                }
                            }
                            lineY--;
                        }
                        y++;
                    }
                }
            }

            loseScreen(): void {
                const y = this.boardHeight - this.loseBlock;
                for (let x = 0; x < this.boardWidth; x++) {
                    const bX = x * this.unitSize;
                    const bY = y * this.unitSize;
                    
                    this.bgCtx.fillStyle = 'rgb(80,80,80)';
                    this.bgCtx.fillRect(bX, bY, this.unitSize, this.unitSize);
                    
                    this.bgCtx.fillStyle = 'rgb(150,150,150)';
                    this.bgCtx.fillRect(bX + 1, bY + 1, this.unitSize - 2, this.unitSize - 2);
                    
                    this.bgCtx.fillStyle = 'rgb(100,100,100)';
                    this.bgCtx.fillRect(bX + 2, bY + 2, this.unitSize - 4, this.unitSize - 4);
                }

                if (this.loseBlock <= this.boardHeight + 1) {
                    this.loseBlock++;
                    this.animationId = requestAnimationFrame(() => this.loseScreen());
                } else {
                    this.init();
                }
            }

            fillBoard(piece: ActivePiece): void {
                if (!piece.data) return;
                
                for (let x = 0; x < 4; x++) {
                    for (let y = 0; y < 4; y++) {
                        if (piece.data[x][y] === 1) {
                            const bX = x + piece.x;
                            const bY = y + piece.y;
                            if (bX >= 0 && bX <= this.boardWidth && bY >= 0 && bY <= this.boardHeight) {
                                this.board[bX][bY].data = 1;
                                this.board[bX][bY].color = piece.color;
                            }
                        }
                    }
                }
                this.checkLines();
                this.renderBoard();
            }

            newTetromino(): void {
                const pieceNum = Math.floor(Math.random() * tetrominos.length);
                this.curPiece.data = tetrominos[pieceNum].data;
                this.curPiece.color = tetrominos[pieceNum].color;
                this.curPiece.x = Math.floor(Math.random() * (this.boardWidth - 3));
                this.curPiece.y = -2;
            }

            destroy(): void {
                cancelAnimationFrame(this.animationId);
                this.bgCanvas.remove();
                this.fgCanvas.remove();
            }
        }

        let tetrisInstances: TetrisBot[] = [];
        
        const setupBoards = () => {
            tetrisInstances.forEach(instance => instance.destroy());
            tetrisInstances = [];

            const cWidth = container.clientWidth;
            const cHeight = container.clientHeight;
            const unitSize = 10;
            const boardDiv = unitSize * Math.round(cWidth / unitSize);
            const targetBoardWidth = 120;
            const boards = Math.max(2, Math.floor(cWidth / targetBoardWidth));
            const bWidth = boardDiv / boards;

            for (let w = 0; w < boards; w++) {
                const startX = unitSize * Math.round((w * bWidth) / unitSize);
                tetrisInstances.push(new TetrisBot(startX, 0, bWidth, cHeight));
            }
        };

        setupBoards();

        const resizeObserver = new ResizeObserver(() => setupBoards());
        resizeObserver.observe(container);
        
        return () => {
            resizeObserver.disconnect();
            tetrisInstances.forEach(instance => instance.destroy());
        };
    });
</script>

<div bind:this={container} class="absolute inset-0 w-full h-full opacity-40 pointer-events-none z-[-1]"></div>