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

    private _characterName:string;
    private _dialogueManager: DialogueManager;
    private _dialogueState: number;
    private _dialogues: Dialogues;

    private _isInteracting:Boolean = false;
    //private _onDialogueEnd:(() => void) | null;
    protected characterMenu:T|null;

    // private _button3D: Button3D;
    // private _gui3dManager: GUI.GUI3DManager;

    private player:Player;
    
    private static readonly MIN_DIST_INTERACTION: number = 200;

    constructor(mesh:Mesh, scene:Scene, player:Player, characterName:string, characterMenu?:T){
        this._mesh = mesh;
        this.scene = scene;
        this.player = player;
        this._characterName = characterName;
        this._dialogues = dialoguesAssets[this._characterName];
        //this._onDialogueEnd = onDialogueEnd;
        this.characterMenu = characterMenu;

        this._setUpTalkButton();
        this._setUpBoxDialogue();

        this._dialogueManager = new DialogueManager(this._dialogBox, this._dialogText);
        this._dialogueState = 0;


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
        this._talkButton.background   = "green";
        this._talkButton.isVisible    = false;     
        
        //Texte du bouton
        this._talkButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;          
        this._talkButton.verticalAlignment   = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;           
        this._talkButton.top                 = "-50px";
        this._advancedTexture.addControl(this._talkButton);

        
        this._talkButton.onPointerUpObservable.add(() => {
            this._talkButton.isVisible = false;
            this._startDialogue();
        });
    }

    private _setUpBoxDialogue(){

        // Création de la boîte de this._dialogue
        this._dialogBox = new GUI.Rectangle();
        this._dialogBox.width = "400px";
        this._dialogBox.height = "100px";
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

        this._dialogBox.addControl(this._dialogText);

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
        })
    }

    private _startDialogue(){
        this.player.lockControls();
        this._isInteracting = true;
        this._dialogueManager.startDialogue(this._dialogues[this._dialogueState]);
    }
}