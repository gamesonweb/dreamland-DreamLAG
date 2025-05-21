import { BiPlanarBlock, Mesh, Scene, Vector3 } from "@babylonjs/core";
import { Player } from "./characterController";
import * as GUI from "@babylonjs/gui"
import { DialogueManager } from "./dialogueManager";
import { DialogueAssets, Dialogues, dialoguesAssets } from "./dialogue";
import { CharacterMenu } from "./questMenu";


export class Character<T extends CharacterMenu>{
    private _mesh: Mesh;
    public scene:Scene;

    //Propriétés pour la boîte de dialogue
    private _advancedTexture: GUI.AdvancedDynamicTexture;
    private _talkButton: GUI.Button;
    private _dialogBox: GUI.Rectangle;
    private _dialogText: GUI.TextBlock;
    private _indicationText: GUI.TextBlock;

    private _characterName:string;
    private _dialogueManager: DialogueManager;
    //private dialogueState: number;
    protected dialogues: Dialogues; //protected car les dialogues peuvent changer en fonction de l'évolution du jeu

    private _isInteracting:Boolean = false;
    //private _onDialogueEnd:(() => void) | null;
    protected characterMenu:T|null;

    // private _button3D: Button3D;
    // private _gui3dManager: GUI.GUI3DManager;

    private player:Player;

    protected dialogueState:number = 0;
    
    private static readonly MIN_DIST_INTERACTION: number = 15;

    constructor(mesh:Mesh, scene:Scene, player:Player, characterName:string, characterMenu?:T){
        this._mesh = mesh;
        this.scene = scene;
        this.player = player;
        this._characterName = characterName;
        this.dialogues = dialoguesAssets[this._characterName];
        //this._onDialogueEnd = onDialogueEnd;
        this.characterMenu = characterMenu;

        this._setUpTalkButton();
        this._setUpBoxDialogue();

        this._dialogueManager = new DialogueManager(this._dialogBox, this._dialogText);
        this.dialogueState = 0;


        //this._gui3dManager = new GUI.GUI3DManager(this.scene);

        // this._button3D = new Button3D("talk3D", {
        //     width:  0.3,
        //     height: 0.3,
        //     depth:  0.3
        //   });
        // const label3D = new GUI.TextBlock("lbl3D", "Parler (E)");
        // label3D.fontSize = 24;
        // this._button3D.content = label3D;

        // // 3) Ajoute le bouton au manager et lie-le au mesh
        // this._gui3dManager.addControl(this._button3D);
        // this._button3D.linkToTransformNode(this._mesh);
        // this._button3D.isVisible = false;

        // // 4) Déclenche l’interaction au clic
        // this._button3D.onPointerUpObservable.add(() => {
        // console.log("On parle !");
        // }); 
    }
    

    private _setUpTalkButton(){
        //Création du bouton
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._talkButton = GUI.Button.CreateSimpleButton("talkBtn", "Parler (E)");
        this._talkButton.width        = "150px";
        this._talkButton.height       = "40px";
        this._talkButton.color        = "white";
        this._talkButton.cornerRadius = 10;
        this._talkButton.background   = "black";
        this._talkButton.isVisible    = false;     
        
        //Texte du bouton
        this._talkButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;          
        this._talkButton.verticalAlignment   = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;           
        this._talkButton.top                 = "-50px";
        this._advancedTexture.addControl(this._talkButton);

        this._talkButton.linkWithMesh(this._mesh);

        
        this._talkButton.onPointerUpObservable.add(() => {
            this.startInteraction();
            this._startDialogue();
        });
    }

    private _setUpBoxDialogue(){

        // Création de la boîte de this._dialogue
        this._dialogBox = new GUI.Rectangle();
        this._dialogBox.width = "500px";
        this._dialogBox.height = "200px";
        this._dialogBox.cornerRadius = 10;
        this._dialogBox.color = "white";
        this._dialogBox.thickness = 2;
        this._dialogBox.background = "black";
        this._dialogBox.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._dialogBox.top = "-150px";
        this._dialogBox.isVisible = false;
        this._advancedTexture.addControl(this._dialogBox);

        // Création du texte à l'intérieur de la boîte
        this._dialogText = new GUI.TextBlock();
        this._dialogText.text = "";
        this._dialogText.color = "white";
        this._dialogText.fontSize = 24;
        this._dialogText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this._dialogText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._dialogText.textWrapping = true;

        //Texte pour indique comment passer
        this._indicationText = new GUI.TextBlock();
        this._indicationText.text = "Taper sur ESPACE pour passer";
        this._indicationText.color = "white";
        this._indicationText.fontSize = 15;
        this._indicationText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._indicationText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

        this._dialogBox.addControl(this._dialogText);
        this._dialogBox.addControl(this._indicationText);

        this._dialogBox.onPointerUpObservable.add(() => {
            if (this._dialogueManager.isDialogueActivated) {
                this._dialogueManager.nextLine();
                if (!this._dialogueManager.isDialogueActivated && this.characterMenu) { // Si le dialogue vient d'être terminé
                    if (!this.characterMenu.isWindowRecentlyClosed()) this.characterMenu.showWindow();
                }
            }
        });

    }


    private _isPlayerNear(){
        const distance = Vector3.Distance(this._mesh.getAbsolutePosition(), this.player.mesh.getAbsolutePosition());
        //console.log("Distance : " + distance);
        return distance<Character.MIN_DIST_INTERACTION;
    }

    private _updateTalkButton(){
        if(this._isPlayerNear() && !this._dialogueManager.isDialogueActivated && !this._isInteracting){
            this._talkButton.isVisible=true;
            // this._button3D.isVisible = true;
        }
        else{
            //this._button3D.isVisible = false;
            this._talkButton.isVisible=false;
        }
    }

    private _updateDialogueBox(){
        if(this.player.wantsResumeDialogue()&&this._dialogueManager.isDialogueActivated){
            this._dialogueManager.nextLine();
            if(!this._dialogueManager.isDialogueActivated && this.characterMenu){ //Si le dialogue vient d'être terminé
                if(!this.characterMenu.isWindowRecentlyClosed()) this.characterMenu.showWindow();
            }
        } 

        if(this.characterMenu.isWindowRecentlyClosed()&&this._isInteracting){
            this.player.unlockControls();
            this._isInteracting=false;
        }      
    }

    public activateCharacter(){
        this.scene.registerBeforeRender(() => {
            this._updateTalkButton();
            this._updateDialogueBox();


            if (this.player.input.interactKeyDown && this._isPlayerNear() && !this._dialogueManager.isDialogueActivated && !this._isInteracting) {
                this.startInteraction();

                this.player.input.interactKeyDown = false;
            }
        })
    }

    public startInteraction(): void {
        if (this._isPlayerNear() && !this._dialogueManager.isDialogueActivated && !this._isInteracting) {
            this._talkButton.isVisible = false;
            document.exitPointerLock();
            this.player.lockControls();
            this._startDialogue();
        }
    }

    private _startDialogue(){
        this._isInteracting = true;
        this._dialogueManager.startDialogue(this.dialogues[this.dialogueState].dialogue);
        if(this.dialogues[this.dialogueState].dialogue.changeState) this.dialogueState++;
    }
}