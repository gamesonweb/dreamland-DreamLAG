import { Scene, ActionManager, ExecuteCodeAction, Scalar, PointerEventTypes } from "@babylonjs/core";


export class PlayerInput {
    private inputMap;

    public vertical:number;
    public verticalAxis:number;
    public horizontal:number;
    public horizontalAxis:number;
    public dashing:boolean = false;
    public jumpKeyDown:boolean = false;
    public flyDown:boolean = false;
    
    public resumeDialog: boolean = false;
    public interactKeyDown:boolean = false;
    
    public memoryKeyDown:boolean = false;

    public onAttack: (() => void) | null = null;
    public controlsLocked:boolean = false;

    constructor(scene: Scene) {
        scene.actionManager = new ActionManager(scene);
    
        this.inputMap = {};
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));

        scene.onPointerObservable.add((pi) => {
            if (
                //pi.type === PointerEventTypes.POINTERDOWN &&
                pi.event.button === 0 &&
                !this.controlsLocked
            ) {
              this.onAttack?.();
            }
            // else if(this.controlsLocked && pi.event.button === 0) this.resumeDialog=true;
            // else this.resumeDialog=false;
          });
    
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        });
    }

    private _updateFromKeyboard(): void {
        if (this.inputMap["w"] ||this.inputMap["W"]) {
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
            this.verticalAxis = 1;
    
        } else if (this.inputMap["s"] ||this.inputMap["S"]) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
        } else {
            this.vertical = 0;
            this.verticalAxis = 0;
        }
    
        if (this.inputMap["a"] || this.inputMap["A"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;
    
        } else if (this.inputMap["d"] ||this.inputMap["D"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        }
        else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }

        if (this.inputMap["Shift"]){
            this.dashing = true;
        }else{
            this.dashing = false;
        }

        if(this.inputMap[" "]){
            this.jumpKeyDown = true;
            this.resumeDialog = true;
        }else{
            this.jumpKeyDown = false;
            this.resumeDialog = false;
        }
        if (this.inputMap["f"] || this.inputMap["F"]) {
            this.flyDown=true
        }
        else{
            this.flyDown = false;
        }
        if(this.inputMap["e"] || this.inputMap["E"]){
            this.interactKeyDown = true;
        }
        else this.interactKeyDown = false;

        if(this.inputMap["m"] || this.inputMap["M"]){
            this.memoryKeyDown = true;
        }
        else this.memoryKeyDown = false;
    }

}