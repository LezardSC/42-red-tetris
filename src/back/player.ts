import type { Direction } from "node:readline";
import { Piece, PieceType, Coordinates } from "./piece.ts";
import { server } from "../server/server.ts";

class Player {
    playerId!: string;
    pieces: Array<Piece> = [];
    boardSize!: [number, number];
    leftKey: boolean = false;
    rightKey: boolean = false;
    upKey: boolean = false;
    downKey: boolean = false;

    public constructor(playerId: string, boardSize: [number, number]) {
        this.playerId = playerId;
        this.boardSize = boardSize;
        this.pieces.push(new Piece(5, 1, PieceType.Z));
    }

    public moveDown() {
        const lastPiece = this.pieces.at(-1);
        server.log.info(`Number of pieces: ${this.pieces.length}`);
        this.pieces.forEach(p => {
            p.tiles.forEach(t => {
                server.log.info(`Tile coord: x = ${t.x} and y = ${t.y}`);
            })
        });
        if (!lastPiece){
            return;
        }
        if (lastPiece.center.y < this.boardSize[1] - 1 && !this.checkCollision(Direction.Down)) {
            lastPiece.center.y++;
        }
        else {
            this.pieces.push(new Piece(5, 1, PieceType.Z));
        }
    }

    public move() {
        const lastPiece = this.pieces.at(-1);
        if (!lastPiece){
            return;
        }

        if (this.rightKey && !this.checkCollision(Direction.Right)) {
            this.moveRight(lastPiece);
        }
        if (this.leftKey && !this.checkCollision(Direction.Left)) {
            this.moveLeft(lastPiece);
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
        const lastPiece = this.pieces.at(-1);
        if (!lastPiece){
            return false;
        }
        
        for (let i: number = 0; i < lastPiece.tiles.length; i++) {
            let tileToTest = lastPiece.tiles[i];
            if (!tileToTest) {
                return false;
            }
            let tileToTestAbsolute: Coordinates = new Coordinates(tileToTest.x + lastPiece.center.x, tileToTest.y + lastPiece.center.y);
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
            for (let j: number = 0; j < this.pieces.length - 1; j++) {
                let piece: Piece | undefined = this.pieces[j];
                if (!piece) {
                    return false;
                }
                for (let k: number = 0; k < piece.tiles.length; k++) {
                    let tile: Coordinates | undefined = piece.tiles[k];
                    if (!tile) {
                        return false;
                    }
                    let tileAbsolute: Coordinates = new Coordinates(tile.x + piece.center.x, tile.y + piece.center.y);
                    
                    if (tileToTestAbsolute.equals(tileAbsolute)) {
                        return true;
                    }
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