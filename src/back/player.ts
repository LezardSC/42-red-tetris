import Piece from "./piece.ts";

class Player {
    playerId!: string;
    pieces: Array<Piece> = [];
    boardSize!: [number, number];

    public constructor(playerId: string, boardSize: [number, number]) {
        this.playerId = playerId;
        this.boardSize = boardSize;
        this.pieces.push(new Piece(0, 0));
    }

    public move() {
        const lastPiece = this.pieces.at(-1);
        if (!lastPiece){
            return;
        }
        if (lastPiece.y < this.boardSize[1] - 1) {
            lastPiece.y++;
        }
    }
}

export default Player