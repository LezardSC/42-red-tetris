import EventEmitter from "events";
import { Piece, Coordinates, Color } from "./piece.ts";

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

    public moveDown() {
        if (!this.checkCollision(Direction.Down)) {
            this.piece.center.y++;
        }
        else {
            for (let i: number = 0; i < this.piece.tiles.length; i++) {
                let tile: Coordinates | undefined = this.piece.tiles[i];
                if (tile) {
                    let tileAbsolute = new Coordinates(tile.x + this.piece.center.x, tile.y + this.piece.center.y)
                    this.board[tileAbsolute.x + tileAbsolute.y * 10] = this.piece.color;
                }
            }
            this.playerEmitter.emit('piecedown', this.piece.id);
        }
    }

    public move() {

        if (this.rightKey && !this.checkCollision(Direction.Right)) {
            this.piece.center.x++;
        }
        if (this.leftKey && !this.checkCollision(Direction.Left)) {
            this.piece.center.x--;
        }
        if (this.upKey) {
            //TODO: Need to check collisions here as well...
            this.piece.tiles.forEach(tile => {
                tile.rotate(-90);
            });
        }
        
    }

    public checkCompletedRows(): number {
        let deletedRows: number = 0;
        for (let i: number = 0; i < this.boardSize[1]; i++) {
            for (let j: number = 0; j < this.boardSize[0]; j++) {
                if (this.board[i * 10 + j] === Color.Empty) {
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

    public keyPressed(key: string) {
        switch(key) {
            case "ArrowDown":
                this.downKey = true;
                break;
            case "ArrowUp":
                this.upKey = true;
                break;
            case "ArrowLeft":
                this.leftKey = true;
                break;
            case "ArrowRight":
                this.rightKey = true;
                break;
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
            }

            
            if (this.board[tileAbsolute.x + tileAbsolute.y * 10] != Color.Empty || tileAbsolute.x > this.boardSize[0] - 1 || tileAbsolute.x < 0 || tileAbsolute.y > this.boardSize[1] - 1) {
                if (this.piece.startPos.equals(this.piece.center))
                    this.lost = true;
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
}

export default Player