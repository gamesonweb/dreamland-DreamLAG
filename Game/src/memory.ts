import { Mesh, MeshBuilder, Nullable, Observable, Observer, Scene, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { Player } from "./characterController";

export class MemoryPiece{
    private _name:string;
    private _memoryName:string;
    private _url:string;

    private _scene:Scene;
    private _mesh:Mesh|null;
    private _advancedTexture: GUI.AdvancedDynamicTexture|null;
    private _claimButton:GUI.Button|null;

    private _player:Player;

    private _renderObserver:Nullable<Observer<Scene>> = null;

    private static readonly INTERACTION_MIN_DIST = 20;

    constructor(name:string, memoryName:string, url:string, mesh?:Mesh, scene?:Scene, player?:Player){
        this._name = name;
        this._memoryName = memoryName;
        this._url = url;

        //Pour les pièces de puzzle à récupérer directement en explorant l'environnement.
        

        if(mesh && scene && player){
        
            this._setUpMeshhPiece(mesh, scene, player);

            this._rederBeforeUpdate();
            
        }
        else{
            if(mesh && scene && !player) console.log("Error parameters MemoryPiece");
            if(mesh && !scene && player) console.log("Error parameters MemoryPiece");
            if(!mesh && scene && player) console.log("Error parameters MemoryPiece");
            if(!mesh && scene && !player) console.log("Error parameters MemoryPiece");
            if(!mesh && !scene && player) console.log("Error parameters MemoryPiece");
            if(mesh && !scene && !player) console.log("Error parameters MemoryPiece");
        }
        
    }
    


    private _setUpMeshhPiece(mesh:Mesh, scene:Scene, player:Player){
        this._player = player;
        this._scene = scene;

        console.log("Mesh = " + mesh);
        const puzzleMaterial = new StandardMaterial("puzzleMat", scene);
        puzzleMaterial.diffuseTexture = new Texture(this.url, scene);
        puzzleMaterial.diffuseTexture.hasAlpha = true;
        puzzleMaterial.useAlphaFromDiffuseTexture = true;
        puzzleMaterial.backFaceCulling = false; // optionnel : montre les 2 faces
        puzzleMaterial.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
        mesh.material = puzzleMaterial;            

        this._mesh = mesh;
        // 1. Crée une texture GUI attachée au mesh
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // 2. Crée un bouton
        this._claimButton = GUI.Button.CreateSimpleButton("claim", "Récupérer! (E)");
        this._claimButton.width = "150px";
        this._claimButton.height = "60px";
        this._claimButton.color = "white";
        this._claimButton.cornerRadius = 10;
        this._claimButton.background = "black";
        this._claimButton.isVisible = false;

        // 3. Ajoute le bouton à la texture GUI
        this._advancedTexture.addControl(this._claimButton);

        this._claimButton.linkWithMesh(this._mesh); // Le mesh que tu veux suivre
        this._claimButton.linkOffsetY = -50; // Décalage vers le haut en pixels (optionnel)

        this._claimButton.onPointerUpObservable.add(() => {
            this._player.claimReward(this);
            this._mesh.dispose();
        })
        
    }

    private _updateClaimButton(){
        const dist = Vector3.Distance(this._player.mesh.getAbsolutePosition(), this._mesh.getAbsolutePosition());
        if(dist<MemoryPiece.INTERACTION_MIN_DIST){
            this._claimButton.isVisible = true;
            if(this._player.input.interactKeyDown) {
                this._player.claimReward(this);
                this._stopRenderLoop();
                if(this._mesh) this._mesh.dispose();
                if(this._advancedTexture) this._advancedTexture.dispose();
            }    
        } 
        else this._claimButton.isVisible = false;
    }

    private _stopRenderLoop(){
        this._renderObserver = this._scene.onBeforeRenderObservable.add(() => {
            this._updateClaimButton();
        });
    }

    private _rederBeforeUpdate(){
        this._scene.registerBeforeRender(() => {
            this._updateClaimButton()
        });
    }

    public get name(){
        return this._name;
    }

    public get memoryName(){
        return this._memoryName;
    }

    public get url(){
        return this._url  //+"/"+this.name+".png";
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
        const seeingPiece = this._unlockedPieces.find(tempPiece => tempPiece === piece || tempPiece.url === piece.url);
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