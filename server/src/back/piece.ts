class PieceManager {
    nextPieces: Array<string> = []

    public constructor() {
        this.generateNewSet();
    }

    public generateNewSet(){
        let unshuffled = Object.keys(PieceType);

        let shuffled = unshuffled
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)

        this.nextPieces = this.nextPieces.concat(shuffled);
    }
}


class Piece {
    center!: Coordinates;
    startPos!: Coordinates;
    type!: string;
    tiles: Array<Coordinates> = [];
    color!: Array<number>;
    id!: number;

    public constructor(x: number, y: number, type: string | undefined, id: number) {
        // Adjust coordinates here
        if (!type) {
            throw new Error("Cannot create a piece with an undefined type.");
        }

        if (type === PieceType.O || type === PieceType.I) {
            x += 0.5;
            y += 0.5;
        }
        this.center = new Coordinates(x, y);
        this.startPos = new Coordinates(x, y);
        this.type = type;
        this.setTiles(type);
        this.setColor(type);
        this.id = id;
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

    private setColor(type: string) {
        switch(type) {
            case PieceType.O:
                this.color = Color.O;
                break;
            case PieceType.I:
                this.color = Color.I;
                break;
            case PieceType.S:
                this.color = Color.S;
                break;
            case PieceType.Z:
                this.color = Color.Z;
                break;
            case PieceType.T:
                this.color = Color.T;
                break;
            case PieceType.J:
                this.color = Color.J;
                break;
            case PieceType.L:
                this.color = Color.L;
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

    public rotate(angle: number, center: Coordinates = new Coordinates(0, 0)) {
        let angleRad: number = angle * Math.PI / 180; 
        let newX: number = center.x + (this.x - center.x) * Math.cos(angleRad) + (this.y - center.y) * Math.sin(angleRad);
        newX = Math.round(newX * 10) / 10
        let newY: number = center.y + (this.y - center.y) * Math.cos(angleRad) - (this.x - center.x) * Math.sin(angleRad);
        newY = Math.round(newY * 10) / 10
        this.x = newX;
        this.y = newY;
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

const Color = {
    O: [254, 251, 52],
    I: [1, 237, 250],
    S: [234, 20, 28],
    Z: [57, 137, 47],
    L: [254, 72, 25],
    J: [221, 10, 178],
    T: [120, 37, 111],
    Idle: [128, 128, 128],
    Empty: [255, 255, 255],
}

export { PieceType, Color, Piece, Coordinates, PieceManager }