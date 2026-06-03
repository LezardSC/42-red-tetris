<script lang="ts">
    import { onMount } from 'svelte';

    let container: HTMLDivElement;

    onMount(() => {
        if (!container) return;

        const tetrominos = [
            { colors: ['rgb(59,84,165)', 'rgb(118,137,196)', 'rgb(79,111,182)'], data: [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]] },
            { colors: ['rgb(214,30,60)', 'rgb(241,108,107)', 'rgb(236,42,75)'], data: [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]] },
            { colors: ['rgb(88,178,71)', 'rgb(150,204,110)', 'rgb(115,191,68)'], data: [[0, 0, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 0]] },
            { colors: ['rgb(62,170,212)', 'rgb(120,205,244)', 'rgb(54,192,240)'], data: [[0, 0, 0, 0], [0, 1, 1, 1], [0, 0, 1, 0], [0, 0, 0, 0]] },
            { colors: ['rgb(236,94,36)', 'rgb(234,154,84)', 'rgb(228,126,37)'], data: [[0, 0, 0, 0], [0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0]] },
            { colors: ['rgb(220,159,39)', 'rgb(246,197,100)', 'rgb(242,181,42)'], data: [[0, 0, 1, 0], [0, 0, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]] },
            { colors: ['rgb(158,35,126)', 'rgb(193,111,173)', 'rgb(179,63,151)'], data: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]] }
        ];

        class Tetris {
            posX: number; posY: number; width: number; height: number;
            bgCanvas: HTMLCanvasElement; fgCanvas: HTMLCanvasElement;
            bgCtx: CanvasRenderingContext2D; fgCtx: CanvasRenderingContext2D;
            curPiece: any; lastMove: number = 0; curSpeed: number = 0;
            unitSize: number = 20; linesCleared: number = 0; level: number = 0; loseBlock: number = 0;
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
                this.curPiece = { data: null, colors: [0,0,0], x: 0, y: 0 };
                this.lastMove = Date.now();
                this.curSpeed = 50 + Math.random() * 50;
                this.linesCleared = 0;
                this.level = 0;
                this.loseBlock = 0;

                this.board = [];
                this.boardWidth = Math.floor(this.width / this.unitSize);
                this.boardHeight = Math.floor(this.height / this.unitSize);

                let halfHeight = this.boardHeight / 2;

                for (let x = 0; x <= this.boardWidth; x++) {
                    this.board[x] = [];
                    for (let y = 0; y <= this.boardHeight; y++) {
                        this.board[x][y] = { data: 0, colors: ['rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)'] };
                        if (Math.random() > 0.15 && y > halfHeight) {
                            this.board[x][y] = {
                                data: 1,
                                colors: tetrominos[Math.floor(Math.random() * tetrominos.length)].colors
                            };
                        }
                    }
                }

                for (let x = 0; x <= this.boardWidth; x++) {
                    for (let y = this.boardHeight - 1; y > -1; y--) {
                        if (this.board[x][y].data === 0 && y > 0) {
                            for (let yy = y; yy > 0; yy--) {
                                if (this.board[x][yy - 1].data) {
                                    this.board[x][yy].data = 1;
                                    this.board[x][yy].colors = this.board[x][yy - 1].colors;
                                    this.board[x][yy - 1].data = 0;
                                    this.board[x][yy - 1].colors = ['rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)'];
                                }
                            } 
                        }
                    }
                }

                this.checkLines();
                this.renderBoard();
                this.newTetromino();
                this.update();
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

            renderBoard() {
                this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
                for (let x = 0; x <= this.boardWidth; x++) {
                    for (let y = 0; y <= this.boardHeight; y++) {
                        if (this.board[x][y].data !== 0) {
                            let bX = x * this.unitSize;
                            let bY = y * this.unitSize;

                            this.bgCtx.fillStyle = this.board[x][y].colors[0];
                            this.bgCtx.fillRect(bX, bY, this.unitSize, this.unitSize);
                            this.bgCtx.fillStyle = this.board[x][y].colors[1];
                            this.bgCtx.fillRect(bX + 2, bY + 2, this.unitSize - 4, this.unitSize - 4);
                            this.bgCtx.fillStyle = this.board[x][y].colors[2];
                            this.bgCtx.fillRect(bX + 4, bY + 4, this.unitSize - 8, this.unitSize - 8);
                        }
                    }
                }
            }

            render() {
                this.fgCtx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
                for (let x = 0; x < 4; x++) {
                    for (let y = 0; y < 4; y++) {
                        if (this.curPiece.data[x][y] === 1) {
                            let xPos = (this.curPiece.x + x) * this.unitSize;
                            let yPos = (this.curPiece.y + y) * this.unitSize;

                            if (yPos > -1) {
                                this.fgCtx.fillStyle = this.curPiece.colors[0];
                                this.fgCtx.fillRect(xPos, yPos, this.unitSize, this.unitSize);
                                this.fgCtx.fillStyle = this.curPiece.colors[1];
                                this.fgCtx.fillRect(xPos + 2, yPos + 2, this.unitSize - 4, this.unitSize - 4);
                                this.fgCtx.fillStyle = this.curPiece.colors[2];
                                this.fgCtx.fillRect(xPos + 4, yPos + 4, this.unitSize - 8, this.unitSize - 8);
                            }
                        }
                    }
                }
            }

            checkMovement(curPiece: any, newX: number, newY: number) {
                for (let x = 0; x < 4; x++) {
                    for (let y = 0; y < 4; y++) {
                        if (curPiece.data[x][y] === 1) {
                            let targetX = curPiece.x + x + newX;
                            let targetY = curPiece.y + y + newY;

                            if (!this.board[targetX]) this.board[targetX] = [];
                            if (!this.board[targetX][targetY]) this.board[targetX][targetY] = { data: 0 };

                            if (targetX >= this.boardWidth || targetX < 0 || this.board[targetX][targetY].data == 1) return false;
                            if (targetY > this.boardHeight) return false;
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
                                    this.board[x][lineY].colors = this.board[x][lineY - 1].colors;
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
                    this.bgCtx.fillRect(bX + 2, bY + 2, this.unitSize - 4, this.unitSize - 4);
                    this.bgCtx.fillStyle = 'rgb(100,100,100)';
                    this.bgCtx.fillRect(bX + 4, bY + 4, this.unitSize - 8, this.unitSize - 8);
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
                            this.board[x + curPiece.x][y + curPiece.y].data = 1;
                            this.board[x + curPiece.x][y + curPiece.y].colors = curPiece.colors;
                        }
                    }
                }
                this.checkLines();
                this.renderBoard();
            }

            newTetromino() {
                let pieceNum = Math.floor(Math.random() * tetrominos.length);
                this.curPiece.data = tetrominos[pieceNum].data;
                this.curPiece.colors = tetrominos[pieceNum].colors;
                this.curPiece.x = Math.floor(Math.random() * (this.boardWidth - this.curPiece.data.length + 1));
                this.curPiece.y = -4;
            }

            destroy() {
                cancelAnimationFrame(this.animationId);
                this.bgCanvas.remove();
                this.fgCanvas.remove();
            }
        }

        let tetrisInstances: Tetris[] = [];

        const setupBoards = () => {
            // Nettoyage si on redimensionne
            tetrisInstances.forEach(instance => instance.destroy());
            tetrisInstances = [];

            const cWidth = container.clientWidth;
            const cHeight = container.clientHeight;
            
            // Calcul du nombre de grilles (boards)
            const unitSize = 20;
            const boardDiv = unitSize * Math.round(cWidth / unitSize);
            const boards = 8;
            const bWidth = boardDiv / boards;

            for (let w = 0; w < boards; w++) {
                tetrisInstances.push(new Tetris(unitSize * Math.round((w * bWidth) / unitSize), 0, bWidth, cHeight));
            }
        };

        setupBoards();

        // Optionnel: Gérer le redimensionnement de l'écran
        const resizeObserver = new ResizeObserver(() => setupBoards());
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            tetrisInstances.forEach(instance => instance.destroy());
        };
    });
</script>

<div bind:this={container} class="absolute inset-0 w-full h-full overflow-hidden opacity-30 pointer-events-none"></div>