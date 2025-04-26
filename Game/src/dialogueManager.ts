import * as GUI from "@babylonjs/gui"
import { Dialogue } from "./dialogue";
import { Player } from "./characterController";


export class DialogueManager {
    private _currentLineIndex = 0;
    private _currentDialogue: Dialogue | null = null;
    private _onDialogueEnd: (() => void) | null = null;
    public dialogueActivated: Boolean = false;

    private canAdvance = true;

    private static readonly TEXTSPEED:number = 40; //en ms

    constructor(private dialogBox: GUI.Rectangle, private dialogText: GUI.TextBlock) {}


    startDialogue(dialogue: Dialogue, onDialogueEnd: (() => void)) {
        Player.controlsLocked = true;
        this._currentDialogue = dialogue;
        this._currentLineIndex = 0;
        this.dialogueActivated = true;
        this._onDialogueEnd = onDialogueEnd;
        this.showCurrentLine();
    }

    showCurrentLine() {
        if (this._currentDialogue && this._currentLineIndex < this._currentDialogue.lines.length) {
            let index = this._currentLineIndex;
            this.dialogBox.isVisible = true;
            const line = this._currentDialogue.lines[this._currentLineIndex];

            let i=0;
            const interval = setInterval(() => {
                if(this.dialogueActivated && i<line.length && this._currentLineIndex == index){
                    this.dialogText.text += line.charAt(i);
                    i++;
                }
                else{
                    clearInterval(interval);
                }
            }, DialogueManager.TEXTSPEED)
        } else {
            this.endDialogue();
        }
    }

    nextLine() {
        if(!this.canAdvance) return;

        this.dialogText.text = "";
        this.canAdvance=false;

        if (this._currentDialogue) {
            this._currentLineIndex++;
            this.showCurrentLine();
        }

        setTimeout(() => {
            this.canAdvance=true;
        },200);
    }

    endDialogue() {
        this.dialogBox.isVisible = false;
        this._currentDialogue = null;
        this._currentLineIndex = 0;
        this.dialogueActivated = false;
        if(this._onDialogueEnd) this._onDialogueEnd();
        else Player.controlsLocked = false;
    }
}
