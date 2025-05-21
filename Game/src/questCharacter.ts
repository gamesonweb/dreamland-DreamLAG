import { QuestMenu } from "./questMenu";
import { Mesh, Scene } from "@babylonjs/core";
import { Player } from "./characterController";
import { Character } from "./interactiveCharacter";
import { Quest } from "./quest";
import { dialoguesAssets } from "./dialogue";


export class QuestCharacter extends Character<QuestMenu>{
    


    private _isTalking:Boolean = false;
    private _completedQuestsTitles:String[] = [];

    // private _button3D: Button3D;
    // private _gui3dManager: GUI.GUI3DManager;

    
    constructor(mesh:Mesh, scene:Scene, player:Player, quests: Quest[]){
        
        super(mesh, scene, player, "Morphéus", new QuestMenu(quests, player));

        this._updateQuestsStateUI();
        for(const quest of quests){
            quest.onStateChange.add(() => {
                this._updateDialogueState(quest);
            })
        }

    }
    
    private areEqualSets(a: any[], b: any[]): boolean {
        return new Set(a).size === new Set(b).size &&
            [...new Set(a)].every(item => new Set(b).has(item));
    }


    private _updateDialogueState(quest:Quest){
        if(quest.isCompleted && !quest.isRewardClaimed) this._completedQuestsTitles.push(quest.title);
        //this._completedQuestsTitles.push(quest.title);
        console.log("completed quests = " + this._completedQuestsTitles);
        if(!this.areEqualSets(this.dialogues[this.dialogueState].dialogue.questsConditionsForNextState, this._completedQuestsTitles)) return;

        this.dialogueState++;
        this._completedQuestsTitles=[];
        this._updateQuestsStateUI();
    }

    private _updateQuestsStateUI(){
        const currQuestsTitles = this.dialogues[this.dialogueState].dialogue.questsConditionsForNextState;
        if(currQuestsTitles){
            const menu = this.characterMenu as QuestMenu;
            for(const questTitle of currQuestsTitles){
                menu.showQuestUI(questTitle);
            }
        }
        else console.log("Error : No quests found in dialogue, dialogueState : "+this.dialogueState);
    }

}