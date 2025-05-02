import {
    AnimationGroup, ArcRotateCamera, Axis, Mesh, PickingInfo, Quaternion,
    Ray, Scene, SceneLoader, ShadowGenerator, Tools, TransformNode, Vector3
} from "@babylonjs/core";
import { Monster } from "./entities/monster";
import { App } from "./app";
import { createDeathAnimation } from "./entities/animation";
import { Memory, MemoryAsset, MemoryPiece } from "./memory";
import { PlayerInput } from "./inputController";

export class Player extends TransformNode {
    public camera: ArcRotateCamera;
    public scene: Scene;
    public mesh: Mesh;
    public animationGroups: AnimationGroup[] = [];
    public dashTime: number = 0;

    private _input: PlayerInput;
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;

    private _moveDirection: Vector3 = Vector3.Zero();
    private _gravity: Vector3 = new Vector3();
    private _h: number;
    private _v: number;
    private _inputAmt: number;
    private _deltaTime: number = 0;

    private _health: number = 100;
    private _damage: number = 10;
    private _memories:Memory[];

    private _grounded: boolean = false;
    private _jumpCount: number = 1;
    private _canDash: boolean = true;
    private _dashPressed: boolean = false;
    private _controlsLocked: boolean = false;

    private static readonly ORIGINAL_TILT = new Vector3(0.593, 0, 0);
    private static readonly PLAYER_SPEED = 0.45;
    private static readonly GRAVITY = -2.5;
    private static readonly JUMP_FORCE = 0.80;
    private static readonly DASH_FACTOR = 1.5;
    private static readonly DASH_TIME = 10;

    constructor(assets: { mesh: Mesh; }, scene: Scene, position: Vector3, shadowGenerator: ShadowGenerator, input?: any) {
        super("player", scene);
        this.scene = scene;
        this._input = input;
        this._setupPlayerCamera();
        this._setupCameraInputs();

        SceneLoader.ImportMeshAsync("", "assets/playerSkin/", "BrainStem.gltf", scene).then(result => {
            const playerMesh = result.meshes[0] as Mesh;
            playerMesh.name = "PlayerCharacter";
            playerMesh.position = position.clone();
            playerMesh.scaling = new Vector3(1.5, 1.5, 1.5);
            playerMesh.checkCollisions = true;
            playerMesh.ellipsoid = new Vector3(1, 1, 1);
            playerMesh.ellipsoidOffset = new Vector3(0, 1, 0);
            playerMesh.scalingDeterminant = 1.25;

            playerMesh.metadata = {
                isPlayer: true,
                playerInstance: this
            };

            this.mesh = playerMesh;
            this.mesh.parent = this;
            shadowGenerator.addShadowCaster(this.mesh);
            this.animationGroups = result.animationGroups;
            this.playIdleAnimation();
            playerMesh.position.y = 78;
        });

        this._input.onAttack = (pickInfo?: PickingInfo) => {
            if (pickInfo) this._attack(pickInfo);
        };
    }

    private _setupPlayerCamera(): ArcRotateCamera {
        this._camRoot = new TransformNode("root", this.scene);
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);

        this._yTilt = new TransformNode("ytilt", this.scene);
        this._yTilt.rotation = Player.ORIGINAL_TILT;
        this._yTilt.parent = this._camRoot;

        this.camera = new ArcRotateCamera("playerCamera", Math.PI / 2, Math.PI / 3, 20, Vector3.Zero(), this.scene);
        this.scene.activeCamera = this.camera;

        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 20;
        this.camera.lowerBetaLimit = Tools.ToRadians(30);
        this.camera.upperBetaLimit = Tools.ToRadians(85);

        return this.camera;
    }

    private _setupCameraInputs(): void {
        const canvas = this.scene.getEngine().getRenderingCanvas();
        if (!canvas) return;

        let previousX = 0, previousY = 0, dragging = false;

        canvas.addEventListener("pointerdown", (evt) => {
            dragging = true;
            previousX = evt.clientX;
            previousY = evt.clientY;
            canvas.requestPointerLock();
        });

        canvas.addEventListener("pointerup", () => {
            dragging = false;
            document.exitPointerLock();
        });

        canvas.addEventListener("pointermove", (evt) => {
            if (!dragging) return;

            const deltaX = evt.clientX - previousX;
            const deltaY = evt.clientY - previousY;
            previousX = evt.clientX;
            previousY = evt.clientY;

            const sensitivity = 0.005;
            this._camRoot.rotation.y -= deltaX * sensitivity;

            let newTiltX = this._yTilt.rotation.x - deltaY * sensitivity;
            newTiltX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, newTiltX));
            this._yTilt.rotation.x = newTiltX;
        });
    }

    private _updateFromControls(): void {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        this._h = this._input.horizontal;
        this._v = this._input.vertical;

        let fwd = this.camera.getDirection(Axis.Z);
        let right = this.camera.getDirection(Axis.X);

        let correctedVertical = fwd.scale(this._v);
        let correctedHorizontal = right.scale(this._h);

        let move = correctedHorizontal.add(correctedVertical);
        move.y = 0;
        
        if(!this._hasFrontAnObstacle()){
            this._moveDirection = move.normalize();
        }

        this._inputAmt = Math.min(1, Math.abs(this._h) + Math.abs(this._v));
        this._moveDirection = this._moveDirection.scale(this._inputAmt * Player.PLAYER_SPEED);

        if(!move.equals(Vector3.Zero())){
            const angle = Math.atan2(move.x, move.z);
            const targetQuat = Quaternion.FromEulerAngles(0, angle, 0);
            this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion || Quaternion.Identity(), targetQuat, 10 * this._deltaTime);
        }

        let dashFactor = 1;
        if (this._input.dashing && !this._dashPressed && this._canDash && !this._grounded) {
            this._canDash = false;
            this._dashPressed = true;
        }

        if (this._dashPressed) {
            if (this.dashTime > Player.DASH_TIME) {
                this.dashTime = 0;
                this._dashPressed = false;
            } else {
                dashFactor = Player.DASH_FACTOR;
            }
            this.dashTime++;
            this._moveDirection = this._moveDirection.scale(dashFactor);
        }
    }

    private _updateCamera(): void {
        const centerPlayer = this.mesh.position.y + 2;
        this.camera.setTarget(this.mesh.position);
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);
    }

    private _beforeRenderUpdate(): void {
        if(!this._controlsLocked) this._updateFromControls();
        this._updateGroundDetection();
    }

    public activatePlayerCamera(): ArcRotateCamera{
        this.scene.registerBeforeRender(() => {
            this._beforeRenderUpdate();
            this._updateCamera();
        });
        return this.camera;
    }

    private _hasFrontAnObstacle(): boolean {
        return !this._frontRaycast(0, 2).equals(Vector3.Zero());
    }

    private _frontRaycast(offset: number, length: number): Vector3 {
        const origin = this.mesh.position.add(this.mesh.getDirection(Axis.Z).scale(offset)).add(new Vector3(0, 0.7, 0));
        const ray = new Ray(origin, this.mesh.getDirection(Axis.Z).normalize(), length);
        const pick = this.scene.pickWithRay(ray, mesh => mesh.isPickable && mesh.isEnabled());
        return pick.hit ? pick.pickedPoint : Vector3.Zero();
    }

    private _floorRaycast(x: number, z: number, len: number): Vector3 {
        const pos = this.mesh.position.add(new Vector3(x, 0.5, z));
        const ray = new Ray(pos, Vector3.Up().scale(-1), len);
        const pick = this.scene.pickWithRay(ray, mesh => mesh.isPickable && mesh.isEnabled());
        return pick.hit ? pick.pickedPoint : Vector3.Zero();
    }

    private _isGrounded(): boolean {
        const result = this._floorRaycast(0, 0, 1.5);
        if (!result.equals(Vector3.Zero())) {
            if (!this._input.jumpKeyDown) this.mesh.position.y = result.y + 0.1;
            return true;
        }
        return false;
    }

    private _updateGroundDetection(): void {
        if (!this._isGrounded()) {
            this._gravity = this._gravity.add(Vector3.Up().scale(this._deltaTime * Player.GRAVITY));
            this._grounded = false;
        } else {
            this._gravity.y = 0;
            this._grounded = true;
            this._jumpCount = 1;
            this._canDash = true;
            this.dashTime = 0;
            this._dashPressed = false;
        }

        if (this._input.jumpKeyDown && this._jumpCount > 0 && !this._controlsLocked) {
            this._gravity.y = Player.JUMP_FORCE;
            this._jumpCount--;
        }

        this._gravity.y = Math.max(this._gravity.y, -Player.JUMP_FORCE);
        this.mesh.moveWithCollisions(this._moveDirection.add(this._gravity));
    }

    public wantsResumeDialogue(): boolean {
        return this._input.resumeDialog;
    }

    public lockControls(): void {
        this._moveDirection = Vector3.Zero();
        this._controlsLocked = true;
    }

    public unlockControls(): void {
        this._controlsLocked = false;
    }

    public claimReward(piece:MemoryPiece){
        const memo = MemoryAsset.memories.find(memo => memo.name === piece.memoryName)
        if(memo) memo.unlockPiece(piece);
        else console.log("Error, piece does not exist : PieceName = " + piece.name +", memoryName = " + piece.memoryName + ", memories = " + MemoryAsset.memories.length);
    }

    public set health(value: number) {
        this._health = value;
    }

    public isAlive(): boolean {
        return this._health > 0;
    }

    public takeDamage(amount: number): void {
        this._health -= amount;
        console.log(`Player takes ${amount} damage. Remaining health: ${this._health}`);
        if (this._health <= 0) {
            this.die();
            setTimeout(() => console.log("Dead Player"), 3000);
            App.goToLose();
        }
    }

    public die(): void {
        console.log("Player has died.");
        this.playDeathAnimation();
    }

    public playIdleAnimation(): void {
        const idleAnim = this.animationGroups.find(a => a.name.toLowerCase().includes("idle"));
        if (idleAnim) idleAnim.start(true);
    }

    public playDeathAnimation(): void {
        const anim = createDeathAnimation(this.mesh);
        this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, false);
        setTimeout(() => {
            this.mesh.dispose();
            console.log("Player is dead.");
        }, 3000);
    }

    private _attack(pickInfo: PickingInfo): void {
        const mesh = pickInfo.pickedMesh;
        if (pickInfo.hit && mesh?.metadata?.isMonster) {
            const monster = mesh.metadata.monsterInstance as Monster;
            monster?.takeDamage(this._damage);
        }
    }
}
