import Piece from "./piece.ts";

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
        this.pieces.push(new Piece(0, 0));
    }

    public moveDown() {
        const lastPiece = this.pieces.at(-1);
        if (!lastPiece){
            return;
        }
        if (lastPiece.y < this.boardSize[1] - 1) {
            lastPiece.y++;
        }
    }

    public move() {
        const lastPiece = this.pieces.at(-1);
        if (!lastPiece){
            return;
        }

        if (this.rightKey) {
            this.moveRight(lastPiece);
        }
        if (this.leftKey) {
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
        if(piece.x < this.boardSize[0] - 1) {
            piece.x++;
        }
    }

    private moveLeft(piece: Piece) {
        if(piece.x > 1) {
            piece.x--;
        }
    }
}

export default Player