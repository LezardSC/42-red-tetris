import EventEmitter from "events";
import { Piece, Coordinates, Color } from "./piece.ts";

const SHIFT_DELAY = 170;
const SHIFT_REPEAT = 50;
const SOFT_DROP_REPEAT = 50;

class Player {
    playerId!: string;
    playerName!: string | undefined;
    piece!: Piece;
    boardSize!: [number, number];
    board!: Array<Array<number>>;
    lost: boolean = false; 
    leftKey: boolean = false;
    rightKey: boolean = false;
    upKey: boolean = false;
    downKey: boolean = false;
    shiftHeldSince: number = 0;
    lastShift: number = 0;
    lastSoftDrop: number = 0;
    playerEmitter: EventEmitter = new EventEmitter();
    
    public constructor(playerName: string | undefined, playerId: string, boardSize: [number, number], firstPiece: string | undefined) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.boardSize = boardSize;
        this.board = new Array<Array<number>>(boardSize[0] * boardSize[1]);
        for (let i: number = 0; i < this.board.length; i++) {
            this.board[i] = Color.Empty;
        }
        this.piece = new Piece(4, 1, firstPiece, 0);
    }

    public lose() {
        if (this.lost)
            return;
        this.lost = true;
        this.playerEmitter.emit('lost', this.playerId);
    }

    public moveDown() {
        if (!this.checkCollision(Direction.Down)) {
            this.piece.center.y++;
        }
        else {
            this.managePieceDown();
        }
    }

    public dropDown() {
        while(!this.checkCollision(Direction.Down)) {
            this.piece.center.y++;
        }
        this.managePieceDown();
    }

    public move(now: number = Date.now()) {
        if (this.lost)
            return;
        if ((this.leftKey || this.rightKey) && now - this.shiftHeldSince >= SHIFT_DELAY && now - this.lastShift >= SHIFT_REPEAT) {
            this.shift(now);
        }
        if (this.downKey && now - this.lastSoftDrop >= SOFT_DROP_REPEAT) {
            this.softDrop(now);
        }
    }

    public checkCompletedRows(): number {
        let deletedRows: number = 0;
        for (let i: number = 0; i < this.boardSize[1]; i++) {
            for (let j: number = 0; j < this.boardSize[0]; j++) {
                // Penalty rows are indestructible: a row holding an Idle cell is never cleared.
                if (this.board[i * 10 + j] === Color.Empty || this.board[i * 10 + j] === Color.Idle) {
                    break;
                }
                if (j == this.boardSize[0] - 1) {
                    deletedRows++;
                    this.deleteRow(i);
                }
            }
        }
        if (deletedRows > 1) {
            this.playerEmitter.emit('deletedrows', this.playerId, deletedRows)
        }
        return deletedRows;
    }

    public keyPressed(key: string, now: number = Date.now()) {
        if (this.lost)
            return;
        switch(key) {
            case "ArrowDown":
                if (this.downKey)
                    break;
                this.downKey = true;
                this.softDrop(now);
                break;
            case "ArrowUp":
                if (this.upKey)
                    break;
                this.upKey = true;
                this.rotate();
                break;
            case "ArrowLeft":
            case "ArrowRight":
                if (key === "ArrowLeft" ? this.leftKey : this.rightKey)
                    break;
                this.leftKey = key === "ArrowLeft";
                this.rightKey = key === "ArrowRight";
                this.shiftHeldSince = now;
                this.shift(now);
                break;
            case " ":
                this.dropDown();
                this.checkCompletedRows();
                break
        }
    }

    public keyReleased(key: string) {
        switch(key) {
            case "ArrowDown":
                this.downKey = false;
                break;
            case "ArrowUp":
                this.upKey = false;
                break;
            case "ArrowLeft":
                this.leftKey = false;
                break;
            case "ArrowRight":
                this.rightKey = false;
                break;
        }
    }

    public addIdleRows(nb: number) {
        for (let i: number = 0; i < this.board.length - 10 * nb; i++) {
            let color = this.board[i + 10 * nb];
            if (color == null)
                continue;
            this.board[i] = color;
        }

        for (let i: number = this.board.length - 10 * nb; i < this.board.length ; i++) {
            this.board[i] = Color.Idle;
        }

        this.piece.center.y = Math.max(this.piece.center.y - nb, this.piece.startPos.y);
    }

    // Height of the highest block of each column, 0 for an empty column (the falling piece is ignored).
    public getSpectrum(): Array<number> {
        const [width, height] = this.boardSize;
        return Array.from({ length: width }, (_, x) => {
            const top = Array.from({ length: height }, (_, y) => y)
                .find(y => this.board[y * width + x] !== Color.Empty);
            return top === undefined ? 0 : height - top;
        });
    }

    private shift(now: number) {
        this.lastShift = now;
        if (this.rightKey && !this.checkCollision(Direction.Right)) {
            this.piece.center.x++;
        }
        if (this.leftKey && !this.checkCollision(Direction.Left)) {
            this.piece.center.x--;
        }
    }

    private softDrop(now: number) {
        this.lastSoftDrop = now;
        this.moveDown();
        this.checkCompletedRows();
    }

    private rotate() {
        if (!this.checkCollision(Direction.Rotate)) {
            this.piece.tiles.forEach(tile => {
                tile.rotate(-90);
            });
        }
    }

    private managePieceDown() {
        for (let i: number = 0; i < this.piece.tiles.length; i++) {
            let tile: Coordinates | undefined = this.piece.tiles[i];
            if (tile) {
                let tileAbsolute = new Coordinates(tile.x + this.piece.center.x, tile.y + this.piece.center.y)
                this.board[tileAbsolute.x + tileAbsolute.y * 10] = this.piece.color;
            }
        }
        this.playerEmitter.emit('piecedown', this.piece.id);
    }

    private deleteRow(row: number) {
        for (let i: number = row * 10; i < row * 10 + 10; i++) {
            this.board[i] = Color.Empty;
        }
        for (let i: number = row * 10 - 1; i > 0; i--) {
            let color = this.board[i]
            if (color && color != Color.Empty) {
                this.board[i + 10] = color;
                this.board[i] = Color.Empty;
            }
        }
    }

    private checkCollision(direction: string): boolean {
        for (let i: number = 0; i < this.piece.tiles.length; i++) {
            let tileToTest = this.piece.tiles[i];
            if (!tileToTest) {
                return false;
            }
            let tileAbsolute: Coordinates = new Coordinates(tileToTest.x + this.piece.center.x, tileToTest.y + this.piece.center.y);
            switch (direction) {
                case Direction.Left:
                    tileAbsolute.x -= 1;
                    break;
                case Direction.Right:
                    tileAbsolute.x += 1;
                    break;
                case Direction.Down:
                    tileAbsolute.y += 1;
                    break;
                case Direction.Rotate:
                    tileAbsolute.rotate(-90, new Coordinates(this.piece.center.x, this.piece.center.y));
                    break;
            }

            
            if (this.board[tileAbsolute.x + tileAbsolute.y * 10] != Color.Empty || tileAbsolute.x > this.boardSize[0] - 1 || tileAbsolute.x < 0 || tileAbsolute.y > this.boardSize[1] - 1) {
                if (this.piece.startPos.equals(this.piece.center) && direction == Direction.Down)
                    this.lose();
                return true;
            }

        }

        return false;
    }
}

const Direction = {
    Up: "Up",
    Down: "Down",
    Left: "Left",
    Right: "Right",
    Rotate: "Rotate",
}

export default Player