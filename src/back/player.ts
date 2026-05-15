import { Piece, PieceType, Coordinates, Color } from "./piece.ts";

class Player {
    playerId!: string;
    piece!: Piece;
    boardSize!: [number, number];
    board!: Array<Array<number>>;
    leftKey: boolean = false;
    rightKey: boolean = false;
    upKey: boolean = false;
    downKey: boolean = false;

    public constructor(playerId: string, boardSize: [number, number]) {
        this.playerId = playerId;
        this.boardSize = boardSize;
        this.board = new Array<Array<number>>(boardSize[0] * boardSize[1]);
        for (let i: number = 0; i < this.board.length; i++) {
            this.board[i] = Color.Empty;
        }
        this.piece = new Piece(4.5, 1.5, PieceType.O);
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
            this.piece = new Piece(4.5, 1.5, PieceType.O);
        }
    }

    public move() {

        if (this.rightKey && !this.checkCollision(Direction.Right)) {
            this.moveRight(this.piece);
        }
        if (this.leftKey && !this.checkCollision(Direction.Left)) {
            this.moveLeft(this.piece);
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
                    this.moveDownPieces(i);
                }
            }
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

    private moveRight(piece: Piece) {
        if(!this.checkCollision(Direction.Right)) {
            piece.center.x++;
        }
    }

    private moveLeft(piece: Piece) {
        if(!this.checkCollision(Direction.Left)) {
            piece.center.x--;
        }
    }

    private moveDownPieces(row: number) {
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

            if (this.board[tileAbsolute.x + tileAbsolute.y * 10] != Color.Empty ||
                tileAbsolute.x > this.boardSize[0] - 1 ||
                tileAbsolute.x < 0 ||
                tileAbsolute.y > this.boardSize[1] - 1) {
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