import { Scene, ActionManager, ExecuteCodeAction, Scalar, PointerEventTypes, KeyboardEventTypes } from "@babylonjs/core";


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

    private attackLocked = false;
    private attackCooldown = 0.05; // en secondes, par exemple

    constructor(scene: Scene) {
        scene.actionManager = new ActionManager(scene);
    
        this.inputMap = {};
        // scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        //     this.inputMap[evt.sourceEvent.code] = evt.sourceEvent.type == "keydown";
        // }));
        // scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        //     this.inputMap[evt.sourceEvent.code] = evt.sourceEvent.type == "keydown";
        // }));
        scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.code;
            const logicalKey = kbInfo.event.key.toLowerCase(); 
            
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.inputMap[key] = true;
                    this.inputMap[logicalKey] = true;
                    break;
                case KeyboardEventTypes.KEYUP:
                    this.inputMap[key] = false;
                    this.inputMap[logicalKey] = false;
                    break;
            }
        });


        scene.onPointerObservable.add((pi) => {
            if (pi.event.button === 0 && !this.controlsLocked) {
                if(!this.attackLocked) this.onAttack?.();
                this.attackLocked = true;
                setTimeout(() => {this.attackLocked = false;}, this.attackCooldown * 1000);
            }
          });
    
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        });
    }

    private _updateFromKeyboard(): void {
        if (this.inputMap["KeyW"]) {
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
            this.verticalAxis = 1;
        } else if (this.inputMap["KeyS"]) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
        } else {
            this.vertical = 0;
            this.verticalAxis = 0;
        }
    
        if (this.inputMap["KeyA"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;
    
        } else if (this.inputMap["KeyD"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        }
        else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }

        if (this.inputMap["ShiftLeft"]){
            this.dashing = true;
        }else{
            this.dashing = false;
        }

        if(this.inputMap["Space"]){
            this.jumpKeyDown = true;
            this.resumeDialog = true;
        }else{
            this.jumpKeyDown = false;
            this.resumeDialog = false;
        }
        if (this.inputMap["KeyF"]) {
            this.flyDown=true
        }
        else{
            this.flyDown = false;
        }
        if(this.inputMap["KeyE"]){
            this.interactKeyDown = true;
        }
        else this.interactKeyDown = false;

        if (this.inputMap["m"]) {
            this.memoryKeyDown = true;
        } else {
            this.memoryKeyDown = false;
        }
    }

}