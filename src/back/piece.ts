class Piece {
    center!: Coordinates;
    type!: string;
    tiles: Array<Coordinates> = [];

    public constructor(x: number, y: number, type: string) {
        this.center = new Coordinates(x, y);
        this.type = type;
        this.setTiles(type);
    }

    private setTiles(type: string) {
        switch(type) {
            case PieceType.O:
                this.setTileO();
                break;
            case PieceType.I:
                this.setTileI();
                break;
            case PieceType.S:
                this.setTileS();
                break;
            case PieceType.Z:
                this.setTileZ();
                break;
            case PieceType.T:
                this.setTileT();
                break;
            case PieceType.J:
                this.setTileJ();
                break;
            case PieceType.L:
                this.setTileL();
                break;
        }
    }

    private setTileO() {
        this.tiles.push(new Coordinates(-0.5, -0.5));
        this.tiles.push(new Coordinates(0.5, -0.5));
        this.tiles.push(new Coordinates(-0.5, 0.5));
        this.tiles.push(new Coordinates(0.5, 0.5));
    }

    private setTileI() {
        this.tiles.push(new Coordinates(-1.5, -0.5));
        this.tiles.push(new Coordinates(-0.5, -0.5));
        this.tiles.push(new Coordinates(0.5, -0.5));
        this.tiles.push(new Coordinates(1.5, -0.5));
    }

    private setTileS() {
        this.tiles.push(new Coordinates(-1, 0));
        this.tiles.push(new Coordinates(0, 0));
        this.tiles.push(new Coordinates(0, -1));
        this.tiles.push(new Coordinates(1, -1));
    }

    private setTileZ() {
        this.tiles.push(new Coordinates(-1, -1));
        this.tiles.push(new Coordinates(0, -1));
        this.tiles.push(new Coordinates(0, 0));
        this.tiles.push(new Coordinates(1, 0));
    }

    private setTileL() {
        this.tiles.push(new Coordinates(-1, 0));
        this.tiles.push(new Coordinates(0, 0));
        this.tiles.push(new Coordinates(1, 0));
        this.tiles.push(new Coordinates(1, -1));
    }

    private setTileJ() {
        this.tiles.push(new Coordinates(-1, -1));
        this.tiles.push(new Coordinates(-1, 0));
        this.tiles.push(new Coordinates(0, 0));
        this.tiles.push(new Coordinates(1, 0));
    }

    private setTileT() {
        this.tiles.push(new Coordinates(-1, 0));
        this.tiles.push(new Coordinates(0, 0));
        this.tiles.push(new Coordinates(1, 0));
        this.tiles.push(new Coordinates(0, -1));
    }

}

class Coordinates {
    x!: number;
    y!: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public equals(toTest: Coordinates): boolean {
        return toTest.x == this.x && toTest.y == this.y;
    }
}

const PieceType = {
    O: "O",
    I: "I",
    S: "S",
    Z: "Z",
    L: "L",
    J: "J",
    T: "T"
}

export { PieceType, Piece, Coordinates }