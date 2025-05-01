import * as GUI from "@babylonjs/gui";

export class MemoryPiece{
    private _name:string;
    private _memoryName:string;
    private _puzzleUrl:string;

    constructor(name:string, memoryName:string, puzzleUrl:string){
        this._name = name;
        this._memoryName = memoryName;
        this._puzzleUrl = puzzleUrl;
    }

    

    // private async _isUrlValid(puzzleUrl:string){
    //     const fs = require('fs/promises');

    //     async function checkPath(chemin) {
    //     try {
    //         await fs.access(chemin);
    //         console.log('Fichier trouvé');
    //     } catch (err) {
    //         console.log('Fichier non trouvé');
    //     }
    //     }

    //     await checkPath(puzzleUrl);

    // }

    public get name(){
        return this._name;
    }

    public get memoryName(){
        return this._memoryName;
    }

    public get url(){
        return this._puzzleUrl+"/"+this.name+".png";
    }
}



export class Memory{
    public readonly name:string;
    private _puzzleUrl:string;
    private _isMemoryAchieved:boolean = false;
    private static readonly NB_OF_MEMORY_PIECES = 25;

    private _unlockedPieces:MemoryPiece[] = [];
    //private _lockedPieces:MemoryPiece[] = [];

    private _advancedTexture:GUI.AdvancedDynamicTexture;
    private _memoryWindow: GUI.Rectangle;

    constructor(memoryName:string, puzzleUrl:string){
        this.name = memoryName;

        this._puzzleUrl = puzzleUrl;
        
        //this._getPiecesUrl();
    }

    public init(){
        this._setUpWindowMemory();
    }

    private _checkMemoryAchieved(){
        if(this._unlockedPieces.length === Memory.NB_OF_MEMORY_PIECES){
            this._isMemoryAchieved = true;
        }
    }

    private get isMemoryAchieved(){
        return this._isMemoryAchieved;
    }

    private _isPieceAlreadyUnlocked(piece:MemoryPiece){
        const seeingPiece = this._unlockedPieces.find(tempPiece => tempPiece === piece);
        if(seeingPiece) return true;
        else return false;
    }    

    private _setUpWindowMemory(){
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this._memoryWindow = new GUI.Rectangle();
        this._memoryWindow.width = "70%";
        this._memoryWindow.height = "80%";
        this._memoryWindow.thickness = 5;
        this._memoryWindow.background = "black";
        this._memoryWindow.isVisible = false;
        this._memoryWindow.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._memoryWindow.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this._advancedTexture.addControl(this._memoryWindow);

        for(const piece of this._unlockedPieces){
            this._createPieceUi(piece);
        }

        // === Ajout du bouton "croix" ===
        const closeButton = GUI.Button.CreateSimpleButton("closeButton", "X");
        closeButton.width = "40px";
        closeButton.height = "40px";
        closeButton.color = "white";
        closeButton.background = "red";
        
        closeButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        closeButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        closeButton.top = "10px";
        closeButton.left = "-10px";

        this._memoryWindow.addControl(closeButton);
        this._advancedTexture.isForeground = true; // (normalement c’est le cas par défaut)
        closeButton.onPointerClickObservable.add(() => {
            console.log("Bouton fermé !");
            this.closeWindow();
        })
    }

    private _createPieceUi(piece:MemoryPiece){
        const pieceImg = new GUI.Image("piece", piece.url);
        pieceImg.width="60%"
        pieceImg.height = "100%";
        pieceImg.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        pieceImg.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

        this._memoryWindow.addControl(pieceImg);
    }

    public unlockPiece(piece:MemoryPiece){
        console.log(piece.memoryName + " and " + this.name);
        if(this._isPieceAlreadyUnlocked(piece)){
            console.log("Error, piece already unlock");
            return;
        }

        if(this.isMemoryAchieved){
            console.log("Erreur, Memory already achieved");
            return;
        }

        if(piece.memoryName === this.name){
            console.log("OK PUZZLE AND PIECE : " + piece.url)
            this._unlockedPieces.push(piece);
            this._createPieceUi(piece);
            this._checkMemoryAchieved();
        }
        else console.log("Error Piece does not correspond to the current memory");

        // const indexPiece = this._lockedPieces.findIndex(tempPiece => tempPiece.name == piece.name);
        // let currentPiece=null;
        // if (indexPiece !== -1) {
        //     currentPiece = this._lockedPieces.splice(indexPiece, 1)[0];
        //     this._unlockedPieces.push(currentPiece);
        //     this._createPieceUi(currentPiece);
        // }
        // else {
        //     console.log("Piece Error :" + piece.url + "/" + piece.name +  " does not exist");
        // }
    }

    public showWindow(){
        this._memoryWindow.isVisible = true;
    }

    public closeWindow(){
        this._memoryWindow.isVisible = false;
    }


}


export class MemoryAsset{
    private static _memories:Memory[] = [];

    public static async init(){
        MemoryAsset._memories = [new Memory("memo1", "assets/images/Puzzle1")];
    }

    public static get memories(){
        return this._memories;
    }
}