import { Camera, Mesh, Scene, Vector3 } from "@babylonjs/core";
import { Environment } from "./environment";
import * as GUI from "@babylonjs/gui"
import { Player } from "./characterController";
import { Button3D } from "@babylonjs/gui";
import { PlayerInput } from "./inputController";
import { Quest, QuestMenu } from "./questMenu";

export class QuestCharacter{
    private _mesh: Mesh;
    public scene:Scene;
    private _input: PlayerInput;

    private _advancedTexture: GUI.AdvancedDynamicTexture;
    private _talkButton: GUI.Button;
    private _dialogBox: GUI.Rectangle;
    private _dialogText: GUI.TextBlock;
    private _isTalking: Boolean;
    private _displayQuests:Boolean;

    private _questMenu: QuestMenu;

    // private _button3D: Button3D;
    // private _gui3dManager: GUI.GUI3DManager;

    private player:Player;
    
    private static readonly MIN_DIST_INTERACTION: number = 50;
    private static readonly TEXTSPEED = 40; //en ms

    constructor(mesh:Mesh, scene:Scene, player:Player){
        this._mesh = mesh;
        this.scene = scene;
        this.player = player;

        this._questMenu = new QuestMenu(this.scene);
        this._displayQuests = false;
        for(let i=0; i<30; i++){
            const quest = new Quest("Quête " + i);
            this._questMenu.addQuest(quest);
        }

        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._talkButton = GUI.Button.CreateSimpleButton("talkBtn", "Parler (E)");
        this._talkButton.width        = "150px";
        this._talkButton.height       = "40px";
        this._talkButton.color        = "white";
        this._talkButton.background   = "green";
        this._talkButton.isVisible    = false;     // caché par défaut

        this._talkButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;          
        this._talkButton.verticalAlignment   = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;           
        this._talkButton.top                 = "-50px";   


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

        this._isTalking = false;


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

        this._advancedTexture.addControl(this._talkButton);

        this._talkButton.onPointerUpObservable.add(() => {
            this._isTalking = true;
            this._talkButton.isVisible = false;
            this._showMessage("Salut! Comment vas-tu? Je m'appelle Merlin, le sorcier légendaire de ces lieux!");
        });
    }

    private _isPlayerNear(){
        const distance = Vector3.Distance(this._mesh.getAbsolutePosition(), this.player.mesh.getAbsolutePosition());
        //console.log("Distance : " + distance);
        return distance<QuestCharacter.MIN_DIST_INTERACTION;
    }

    private _updateTalkButton(){
        if(this._isPlayerNear() && !this._isTalking){
            console.log("Bouton Visibke!");
            this._talkButton.isVisible=true;
            // this._button3D.isVisible = true;
        }
        else{
            //this._button3D.isVisible = false;
            this._talkButton.isVisible=false;
        }
    }

    private _updateDialogueBox(){
        if(this.player.wantsResumeDialogue()){
            if(this._displayQuests){
                this._isTalking = false;
                this._questMenu.toggleQuestWindow();
                this._displayQuests = false;
            }
                
                else if(this._dialogBox.isVisible){
                this._dialogBox.isVisible = false;

                this._dialogText.text = "";
                this._questMenu.toggleQuestWindow();
                this._displayQuests = true;
            }
            
        }
    }

    public activateQuestCharacter(){
        this.scene.registerBeforeRender(() => {
            this._updateTalkButton();
            this._updateDialogueBox();
        })
    }

    private _showMessage(message: string) {
        this._dialogBox.isVisible = true;
        let i=0
        const interval = setInterval(() => {
            if(this._isTalking && i < message.length){
                this._dialogText.text += message.charAt(i);
                i++;
            }
            else{
                clearInterval(interval);
            }
        }, QuestCharacter.TEXTSPEED);
    }


    // public activateQuestCharacter(){
    //     this.scene.beforeCameraRender(() => {
    //         this._updatethis.talkButton();
    //     });
    // }

    // private _checkDistance(){

    // }
    
    // private _updatethis.talkButton(){
    //     if
    // }
}