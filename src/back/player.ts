import type { Direction } from "node:readline";
import { Piece, PieceType, Coordinates } from "./piece.ts";

class Player {
    playerId!: string;
    piece!: Piece;
    board: Array<[Coordinates, Array<number>]> = [];
    boardSize!: [number, number];
    leftKey: boolean = false;
    rightKey: boolean = false;
    upKey: boolean = false;
    downKey: boolean = false;

    public constructor(playerId: string, boardSize: [number, number]) {
        this.playerId = playerId;
        this.boardSize = boardSize;
        this.piece = new Piece(5, 1, PieceType.O);
    }

    public moveDown() {
        if (this.piece.center.y < this.boardSize[1] - 1 && !this.checkCollision(Direction.Down)) {
            this.piece.center.y++;
        }
        else {
            for (let i: number = 0; i < this.piece.tiles.length; i++) {
                let tile: Coordinates | undefined = this.piece.tiles[i];
                if (tile) {
                    let tileAbsolute = new Coordinates(tile.x + this.piece.center.x, tile.y + this.piece.center.y)
                    this.board.push([tileAbsolute, this.piece.color]);
                }
            }
            this.piece = new Piece(5, 1, PieceType.O);
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
        if(piece.center.x < this.boardSize[0] - 1) {
            piece.center.x++;
        }
    }

    private moveLeft(piece: Piece) {
        if(piece.center.x > 1) {
            piece.center.x--;
        }
    }

    private checkCollision(direction: string): boolean {
        for (let i: number = 0; i < this.piece.tiles.length; i++) {
            let tileToTest = this.piece.tiles[i];
            if (!tileToTest) {
                return false;
            }
            let tileToTestAbsolute: Coordinates = new Coordinates(tileToTest.x + this.piece.center.x, tileToTest.y + this.piece.center.y);
            switch (direction) {
                case Direction.Left:
                    tileToTestAbsolute.x -= 1;
                    break;
                case Direction.Right:
                    tileToTestAbsolute.x += 1;
                    break;
                case Direction.Down:
                    tileToTestAbsolute.y += 1;
                    break;
            }

            for (let k: number = 0; k < this.board.length; k++) {
                let tile: [Coordinates, Array<number>] | undefined = this.board[k];
                if (!tile) {
                    return false;
                }
                let tileAbsolute: Coordinates = new Coordinates(tile[0].x, tile[0].y);
                
                if (tileToTestAbsolute.equals(tileAbsolute)) {
                    return true;
                }
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