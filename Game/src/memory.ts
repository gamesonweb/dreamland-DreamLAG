
import * as GUI from "@babylonjs/gui";

export class Memory{
    public readonly name:string;
    private _puzzleUrl:string;

    private _unlockedPieces:string[] = [];
    private _lockedPieces:string[] = [];

    private _advancedTexture:GUI.AdvancedDynamicTexture;
    private _memoryWindow: GUI.Rectangle;

    constructor(memoryName:string, puzzleUrl:string){
        this.name = memoryName;

        this._puzzleUrl = puzzleUrl;
        
        this._getPiecesUrl();

        this._setUpWindowMemory();
    }

    private _getPiecesUrl(){
        for(let i=1; i<26; i++){
            this._lockedPieces.push(this._puzzleUrl + "/" + "piece" + i);
        }
    }

    private _setUpWindowMemory(){
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this._memoryWindow = new GUI.Rectangle();
        this._memoryWindow.widthInPixels = 1000;
        this._memoryWindow.heightInPixels = 800;
        this._memoryWindow.thickness = 5;
        this._memoryWindow.background = "black";
        this._memoryWindow.isVisible = false;
        this._memoryWindow.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._memoryWindow.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this._advancedTexture.addControl(this._memoryWindow);

        for(const pUrl of this._unlockedPieces){
            this._displayPuzzlePiece(pUrl);
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

        closeButton.onPointerClickObservable.add(() => {
            this.closeWindow();
        })
    }

    private _displayPuzzlePiece(pieceUrl: string){
        const piece = new GUI.Image("piece", pieceUrl);
        piece.width="800px"
        piece.height = "800px";
        piece.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        piece.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

        this._memoryWindow.addControl(piece);
    }

    public unlockPiece(pieceName:string){
        const pieceUrl = this._puzzleUrl+"/"+pieceName;
        this._unlockedPieces.push(pieceUrl);
        this._displayPuzzlePiece(pieceUrl);
    }

    public showWindow(){
        this._memoryWindow.isVisible = true;
    }

    public closeWindow(){
        this._memoryWindow.isVisible = false;
    }


}