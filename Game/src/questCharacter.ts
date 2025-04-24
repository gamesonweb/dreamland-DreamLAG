import { Camera, Mesh, Scene, Vector3 } from "@babylonjs/core";
import { Environment } from "./environment";
import * as GUI from "@babylonjs/gui"
import { Player } from "./characterController";
import { Button3D } from "@babylonjs/gui";

export class QuestCharacter{
    private _mesh: Mesh;
    public scene:Scene;
    private _advancedTexture: GUI.AdvancedDynamicTexture;
    private _talkButton: GUI.Button;

    // private _button3D: Button3D;
    // private _gui3dManager: GUI.GUI3DManager;

    private player:Player;
    
    private static readonly MIN_DIST_INTERACTION: number = 50;

    constructor(mesh:Mesh, scene:Scene, player:Player){
        this._mesh = mesh;
        this.scene = scene;
        this.player = player;

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
            // Ton code d'interaction
            console.log("On parle !");
        });
    }

    private _isPlayerNear(){
        const distance = Vector3.Distance(this._mesh.getAbsolutePosition(), this.player.mesh.getAbsolutePosition());
        //console.log("Distance : " + distance);
        return distance<QuestCharacter.MIN_DIST_INTERACTION;
    }

    private _updateTalkButton(){
        if(this._isPlayerNear()){
            console.log("Bouton Visibke!");
            this._talkButton.isVisible=true;
            // this._button3D.isVisible = true;
        }
        else{
            //this._button3D.isVisible = false;
            this._talkButton.isVisible=false;
        }
    }

    public activateQuestCharacter(){
        this.scene.registerBeforeRender(() => {
            this._updateTalkButton();
        })
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