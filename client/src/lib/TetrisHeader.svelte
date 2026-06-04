<script lang="ts">
    import { onMount } from 'svelte';

    let container: HTMLDivElement;

    onMount(() => {
        if (!container) return;

        const tetrominos = [
            { color: '#00FFFF', data: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]] }, 
            { color: '#0066FF', data: [[0,0,0,0], [1,1,1,0], [0,0,1,0], [0,0,0,0]] }, 
            { color: '#FF8800', data: [[0,0,0,0], [1,1,1,0], [1,0,0,0], [0,0,0,0]] }, 
            { color: '#FFE600', data: [[0,0,0,0], [0,1,1,0], [0,1,1,0], [0,0,0,0]] }, 
            { color: '#00FF00', data: [[0,0,0,0], [0,1,1,0], [1,1,0,0], [0,0,0,0]] }, 
            { color: '#CC00FF', data: [[0,0,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]] }, 
            { color: '#FF0033', data: [[0,0,0,0], [1,1,0,0], [0,1,1,0], [0,0,0,0]] }  
        ];

        class Tetris {
            posX: number; posY: number; width: number; height: number;
            bgCanvas: HTMLCanvasElement; fgCanvas: HTMLCanvasElement;
            bgCtx: CanvasRenderingContext2D; fgCtx: CanvasRenderingContext2D;
            curPiece: any; lastMove: number = 0; curSpeed: number = 0;
            
            // Taille des blocs réduite ici
            unitSize: number = 10; 
            
            linesCleared: number = 0; level: number = 0; loseBlock: number = 0;
            board: any[] = []; boardWidth: number = 0; boardHeight: number = 0;
            animationId: number = 0;

            constructor(x: number, y: number, width: number, height: number) {
                this.posX = x || 0;
                this.posY = y || 0;
                this.width  = width;
                this.height = height;

                this.bgCanvas = document.createElement('canvas');
                this.fgCanvas = document.createElement('canvas');

                this.bgCanvas.width = this.fgCanvas.width = this.width;
                this.bgCanvas.height = this.fgCanvas.height = this.height;

                this.bgCtx = this.bgCanvas.getContext('2d')!;
                this.fgCtx = this.fgCanvas.getContext('2d')!;

                this.bgCanvas.style.position = 'absolute';
                this.fgCanvas.style.position = 'absolute';
                this.bgCanvas.style.left = this.posX + 'px';
                this.bgCanvas.style.top = this.posY + 'px';
                this.fgCanvas.style.left = this.posX + 'px';
                this.fgCanvas.style.top = this.posY + 'px';

                container.appendChild(this.bgCanvas);
                container.appendChild(this.fgCanvas);
                this.init();
            }

            init() {
                this.curPiece = { data: null, color: '#000000', x: 0, y: 0 };
                this.lastMove = Date.now();
                this.curSpeed = 20 + Math.random() * 40; 
                this.linesCleared = 0;
                this.level = 0;
                this.loseBlock = 0;

                this.boardWidth = Math.floor(this.width / this.unitSize);
                
                // Le "- 1" ici remonte le "sol" d'une case pour éviter que les blocs ne soient coupés
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

            botBrain() {
                const rand = Math.random();
                if (rand < 0.04) {
                    if (this.checkMovement(this.curPiece, -1, 0)) this.curPiece.x--;
                } else if (rand < 0.08) {
                    if (this.checkMovement(this.curPiece, 1, 0)) this.curPiece.x++;
                } else if (rand < 0.12) {
                    this.tryRotation();
                }
            }

            tryRotation() {
                const N = this.curPiece.data.length;
                let rotatedData = Array.from({ length: N }, () => Array(N).fill(0));
                for (let r = 0; r < N; r++) {
                    for (let c = 0; c < N; c++) {
                        rotatedData[c][N - 1 - r] = this.curPiece.data[r][c];
                    }
                }

                let dummyPiece = { ...this.curPiece, data: rotatedData };
                if (this.checkMovement(dummyPiece, 0, 0)) {
                    this.curPiece.data = rotatedData;
                }
            }

            update() {
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

            drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha = 0.7) {
                let bX = x * this.unitSize;
                let bY = y * this.unitSize;

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
                // Ajustement du carré interne pour les petits blocs
                ctx.strokeRect(bX + 1, bY + 1, this.unitSize - 2, this.unitSize - 2);
                ctx.restore();
            }

            renderBoard() {
                this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
                for (let x = 0; x <= this.boardWidth; x++) {
                    for (let y = 0; y <= this.boardHeight; y++) {
                        if (this.board[x][y].data !== 0) {
                            this.drawBlock(this.bgCtx, x, y, this.board[x][y].color, 0.6);
                        }
                    }
                }
            }

            render() {
                this.fgCtx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
                if (!this.curPiece.data) return;

                for (let x = 0; x < 4; x++) {
                    for (let y = 0; y < 4; y++) {
                        if (this.curPiece.data[x][y] === 1) {
                            let targetX = this.curPiece.x + x;
                            let targetY = this.curPiece.y + y;

                            if (targetY > -1) {
                                this.drawBlock(this.fgCtx, targetX, targetY, this.curPiece.color, 0.8);
                            }
                        }
                    }
                }
            }

            checkMovement(curPiece: any, newX: number, newY: number) {
                if (!curPiece.data) return false;
                for (let x = 0; x < 4; x++) {
                    for (let y = 0; y < 4; y++) {
                        if (curPiece.data[x][y] === 1) {
                            let targetX = curPiece.x + x + newX;
                            let targetY = curPiece.y + y + newY;

                            if (targetX >= this.boardWidth || targetX < 0 || targetY > this.boardHeight) return false;
                            
                            if (!this.board[targetX]) this.board[targetX] = [];
                            if (!this.board[targetX][targetY]) this.board[targetX][targetY] = { data: 0 };

                            if (this.board[targetX][targetY].data == 1) return false;
                        }
                    }
                }
                return true;
            }

            checkLines() {
                let y = this.boardHeight + 1;
                while (y--) {
                    let x = this.boardWidth;
                    let lines = 0;
                    while (x--) if (this.board[x][y].data === 1) lines++;

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

            loseScreen() {
                let y = this.boardHeight - this.loseBlock;
                for (let x = 0; x < this.boardWidth; x++) {
                    let bX = x * this.unitSize;
                    let bY = y * this.unitSize;
                    this.bgCtx.fillStyle = 'rgb(80,80,80)';
                    this.bgCtx.fillRect(bX, bY, this.unitSize, this.unitSize);
                    this.bgCtx.fillStyle = 'rgb(150,150,150)';
                    // Ajustement des ratios de dessin pour les petits blocs
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

            fillBoard(curPiece: any) {
                for (let x = 0; x < 4; x++) {
                    for (let y = 0; y < 4; y++) {
                        if (curPiece.data[x][y] === 1) {
                            const bX = x + curPiece.x;
                            const bY = y + curPiece.y;
                            if (bX >= 0 && bX <= this.boardWidth && bY >= 0 && bY <= this.boardHeight) {
                                this.board[bX][bY].data = 1;
                                this.board[bX][bY].color = curPiece.color;
                            }
                        }
                    }
                }
                this.checkLines();
                this.renderBoard();
            }

            newTetromino() {
                let pieceNum = Math.floor(Math.random() * tetrominos.length);
                this.curPiece.data = tetrominos[pieceNum].data;
                this.curPiece.color = tetrominos[pieceNum].color;
                this.curPiece.x = Math.floor(Math.random() * (this.boardWidth - 3));
                this.curPiece.y = -2;
            }

            destroy() {
                cancelAnimationFrame(this.animationId);
                this.bgCanvas.remove();
                this.fgCanvas.remove();
            }
        }

        let tetrisInstances: Tetris[] = [];

        const setupBoards = () => {
            tetrisInstances.forEach(instance => instance.destroy());
            tetrisInstances = [];

            const cWidth = container.clientWidth;
            const cHeight = container.clientHeight;
            
            // On déclare la taille ici aussi pour la division des plateaux
            const unitSize = 10; 
            const boardDiv = unitSize * Math.round(cWidth / unitSize);
            const targetBoardWidth = 120; // Réduit pour s'adapter à la taille divisée par 2
            const boards = Math.max(2, Math.floor(cWidth / targetBoardWidth)); 
            
            const bWidth = boardDiv / boards;

            for (let w = 0; w < boards; w++) {
                tetrisInstances.push(new Tetris(unitSize * Math.round((w * bWidth) / unitSize), 0, bWidth, cHeight));
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