import { Quest, QuestMenu } from "./questMenu";
import { Mesh, Scene } from "@babylonjs/core";
import { Player } from "./characterController";
import { Character } from "./interactiveCharacter";


export class QuestCharacter extends Character<QuestMenu>{
    


    private _isTalking:Boolean = false;

    // private _button3D: Button3D;
    // private _gui3dManager: GUI.GUI3DManager;

    
    constructor(mesh:Mesh, scene:Scene, player:Player, quests: Quest[]){
        super(mesh, scene, player, "Merlin", new QuestMenu(quests, player));

        // for(let i=0; i<30; i++){
        //     const quest = new Quest("Quête " + i);
        //     this.characterMenu.addQuest(quest);
        // }

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

}