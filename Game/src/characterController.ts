import {
    AnimationGroup, ArcRotateCamera, Axis, Bone, Color3, Mesh, PickingInfo, Quaternion, Ray, RayHelper,
    Scene, SceneLoader, ShadowGenerator, Tools, TransformNode,
    Vector3
} from "@babylonjs/core";
import { Monster } from "./entities/monster";
import {App} from "./app";
import {createDeathAnimation} from "./entities/animation";
import { Memory, MemoryAsset, MemoryPiece } from "./memory";
import { PlayerInput } from "./inputController";
import {MemoryMenu} from "./memoryMenu";

export class Player extends TransformNode {
    //public camera: UniversalCamera;
    public camera: ArcRotateCamera;
    public scene: Scene;
    private _input;
    public animationGroups: AnimationGroup[] = [];
    public joggingAnimation: AnimationGroup = null;
    public idleAnimation: AnimationGroup = null;

    private _camRoot: TransformNode;
    private _yTilt: TransformNode;

    private _moveDirection: Vector3;
    private _h: number;
    private _v: number;
    private _inputAmt: number;
    private _gravity: Vector3 = new Vector3();
    private _grounded: boolean;
    private _jumpCount: number;
    private _dashPressed: boolean = false;
    private _canDash: boolean = true;
    private _inMovement:boolean = false;

    // Player properties
    private _mesh: Mesh; // Outer collisionbox of the player
    private _deltaTime: number = 0;
    private _health: number = 100;
    private _damage: number = 10;
    private _memories:Memory[];

    private _controlsLocked:Boolean = false;

    private static readonly ORIGINAL_TILT:  Vector3 = new Vector3(0.5934119456780721, 0, 0);
    private static readonly PLAYER_SPEED: number = 0.3;
    private static readonly GRAVITY: number = -2.5;
    private static readonly JUMP_FORCE: number = 0.50;
    private static readonly DASH_FACTOR: number = 1.5;
    private static readonly DASH_TIME: number = 10;
    public dashTime: number = 0;

    //public isInteracting:boolean = false;
    private _memoryMenu:MemoryMenu;
    private _memoryMenuKeyPressed:boolean = false;

    private _groundCheckInterval: number = 1; // Vérifier tous les 3 frames
    private _groundCheckCounter: number = 0;

    
    constructor(private _app: App, assets:any, scene: Scene, position: Vector3, shadowGenerator?: ShadowGenerator, input?) {
    super("player", scene);
    this.scene = scene;
    this._input = input;
    this._setupPlayerCamera();
    this._setupCameraInputs();
    this.animationGroups = []; // Assure-toi que c'est initialisé ici ou dans la déclaration de classe

    SceneLoader.ImportMeshAsync("", "assets/playerSkin/", "XBot.gltf", scene).then((result) => {
    const playerMesh = result.meshes[0] as Mesh;
    const playerSkeleton = result.skeletons[0];

    playerMesh.position = position.clone();
    playerMesh.scaling = new Vector3(1.2, 1.2, 1.2);
    playerMesh.checkCollisions = true;
    playerMesh.ellipsoid = new Vector3(1, 1, 1);
    playerMesh.ellipsoidOffset = new Vector3(0, 1, 0);
    
    console.log("Player Mesh Loaded:", playerMesh);
    console.log("Player Skeleton Loaded:", playerSkeleton);

    this._mesh = playerMesh;
    this._mesh.parent = this;
    if(shadowGenerator) shadowGenerator.addShadowCaster(this.mesh);

    this.animationGroups = result.animationGroups;
    console.log(this.animationGroups);

    this.joggingAnimation = result.animationGroups.find(g => g.name === "jogging");
    this.idleAnimation = result.animationGroups.find(g => g.name === "idle");

});


    this._input.onAttack = () => {
        this._attack();
    };
    this._memoryMenu = new MemoryMenu(this._scene, this);
}

    public get mesh(){
        return this._mesh;
    }

    private _setupPlayerCamera(): ArcRotateCamera {
        // Racine de la caméra qui suit le joueur
        this._camRoot = new TransformNode("root");
        this._camRoot.position = new Vector3(0, 0, 0);
        // Pour regarder derrière le joueur (180°)
        this._camRoot.rotation = new Vector3(0, Math.PI, 0);

        // Node qui gère le tilt (rotation verticale)
        this._yTilt = new TransformNode("ytilt");
        this._yTilt.rotation = Player.ORIGINAL_TILT;
        this._yTilt.parent = this._camRoot;

        // Création de la caméra qui regarde vers la racine
        //this.camera = new UniversalCamera("cam", new Vector3(0, 0, -30), this.scene);
        this.camera = new ArcRotateCamera("playerCamera", Math.PI / 2, Math.PI / 3, 20, new Vector3(0,0,0), this._scene);
        
        //this.camera.lockedTarget = this._camRoot.position;
        //this.camera.fov = 0.47350045992678597;
        //this.camera.parent = this._yTilt;

        this.scene.activeCamera = this.camera;
        this.camera
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 20;
        // 2. Angle vertical min / max (beta en radians)
        this.camera.lowerBetaLimit = Tools.ToRadians(30);  // Empêche de trop regarder d'en haut
        this.camera.upperBetaLimit = Tools.ToRadians(85); 

        return this.camera;
    }

    // Fonction pour attacher des inputs personnalisés pour la rotation de la caméra
    private _setupCameraInputs(): void {
        const canvas = this.scene.getEngine().getRenderingCanvas();
        if (!canvas) return;

        let previousX: number;
        let previousY: number;
        let dragging = false;

        canvas.addEventListener("pointermove", (evt) => {
            if (!dragging) return;
            let deltaX = evt.clientX - previousX;
            let deltaY = evt.clientY - previousY;
            previousX = evt.clientX;
            previousY = evt.clientY;

            const sensitivity = 0.005;
            this._camRoot.rotation.y -= deltaX * sensitivity;

            let newTiltX = this._yTilt.rotation.x - deltaY * sensitivity;
            newTiltX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, newTiltX));
            this._yTilt.rotation.x = newTiltX;
        });
    }

    private _updateCamera(): void {
        let centerPlayer = this.mesh.position.y + 2;
        this.camera.setTarget(this.mesh.position);
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);
    }

    private _updateFromControls() {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

        this._moveDirection = Vector3.Zero();
        this._h = this._input.horizontal;
        this._v = this._input.vertical;


        if(!this._h && !this._v) this._inMovement = false;
        else this._inMovement = true;
        this.playMovementAnimation();


        // let fwd = this._camRoot.forward;
        // let right = this._camRoot.right;

        let fwd = this.camera.getDirection(Axis.Z);
        let right = this.camera.getDirection(Axis.X);

        let correctedVertical = fwd.scale(this._v);
        let correctedHorizontal = right.scale(this._h);

        let move = correctedHorizontal.add(correctedVertical);
        move.y = 0;
        
        if(!this._hasFrontAnObstacle()){
            this._moveDirection = move.normalize();
        }
        

        let inputMag = Math.abs(this._h) + Math.abs(this._v);
        this._inputAmt = inputMag > 1 ? 1 : inputMag;

        this._moveDirection = this._moveDirection.scale(this._inputAmt * Player.PLAYER_SPEED);
        
        if(!move.equals(Vector3.Zero())){
            let angle = Math.atan2(move.x, move.z);
        const targetQuat = Quaternion.FromEulerAngles(0, angle, 0);

        this.mesh.rotationQuaternion = Quaternion.Slerp(
            this.mesh.rotationQuaternion || Quaternion.Identity(), 
            targetQuat, 
            10 * this._deltaTime
          )
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

    private _updateMenus(){
        if(this._input.memoryKeyDown && !this._memoryMenuKeyPressed){
            this._memoryMenu.toggleMenu();
            this._memoryMenuKeyPressed = true;
        } else if (!this._input.memoryKeyDown){
            this._memoryMenuKeyPressed = false;
        }
    }

    private _beforeRenderUpdate(): void {
        if(!this._controlsLocked) this._updateFromControls();
        this._updateGroundDetection();
        this._updateMenus();
    }

    public activatePlayerCamera(): ArcRotateCamera{
        this.scene.registerBeforeRender(() => {
            this._beforeRenderUpdate();
            this._updateCamera();
        });
        return this.camera;
    }

    private _hasFrontAnObstacle(){
        return (!this._frontRaycast(0, 1).equals(Vector3.Zero()));
    }

    get areControlsLocked(): Boolean {
        return this._controlsLocked;
    }

    get input() {
        return this._input;
    }

    /**
     * Renvoie un résultat de raycast devant le joueur
     * @param forwardOffset distance à laquelle commencer le rayon devant le joueur
     * @param length longueur du rayon
     */
    private _frontRaycast(forwardOffset: number, length: number): Vector3 {
        const origin = this.mesh.position.add(this.mesh.getDirection(Axis.Z).scale(forwardOffset)).add(new Vector3(0, 0.7, 0));
        // 2) Direction : vers l’avant local (axe Z)
        const direction = this.mesh.getDirection(Axis.Z).normalize();
        // 3) Création du rayon
        const ray = new Ray(origin, direction, length);

        let predicate = function(mesh){
            return mesh.isPickable && mesh.isEnabled();
        }

        let pick = this.scene.pickWithRay(ray, predicate);

        if(pick.hit){
            return pick.pickedPoint;
        }
        else{
            return Vector3.Zero();
        }
    
        // // 4) Test contre tous les meshes pickables (on peut filtrer par m.name ou tags)
        // const pickInfo = this.scene.pickWithRay(ray, (m) =>
        // m.isPickable && m.isEnabled() && m !== this.mesh
        // );
    
        // return {
        // hit: pickInfo.hit,
        // pickedMesh: pickInfo.hit ? pickInfo.pickedMesh as Mesh : undefined,
        // point:     pickInfo.hit ? pickInfo.pickedPoint  : undefined
        // };
    }
  

    private _floorRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
        let raycastFloorPos = new Vector3(this.mesh.getAbsolutePosition().x + offsetx, this.mesh.getAbsolutePosition().y, this.mesh.getAbsolutePosition().z + offsetz);
        let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

        let predicate = function (mesh) {
            //if(mesh.name === "InvisibleGround") 
            if(!mesh.name.includes("Area")) return mesh.isPickable && mesh.isEnabled();
            else return false;


            //return false;
            
        }
        let pick = this.scene.pickWithRay(ray, predicate);

        if (pick.hit) {
            return pick.pickedPoint;
        } else {
            return Vector3.Zero();
        }
    }

    private _isGrounded() {
        const result = this._floorRaycast(0, 0, 0.5);
        if(!result.equals(Vector3.Zero())){
            //if(!this._input.jumpKeyDown) this.mesh.position.y = result.y + 0.1;
            return true;
        }
        else{
            return false;
        } 

        // const offsets = [
        //     new Vector3(0, 0, 0),             // Centre
        //     new Vector3(0.5, 0, 0),           // Avant (ajuster l'offset)
        //     new Vector3(-0.5, 0, 0),          // Arrière (ajuster l'offset)
        //     new Vector3(0, 0, 0.5),           // Droite (ajuster l'offset)
        //     new Vector3(0, 0, -0.5)           // Gauche (ajuster l'offset)
        // ];
        // const raycastLen = 2;
    
        // for (const offset of offsets) {
        //     const result = this._floorRaycast(offset.x, offset.z, raycastLen);
        //     if (!result.equals(Vector3.Zero())) {
        //         if (!this._input.jumpKeyDown) {
        //             this.mesh.position.y = result.y + 0.1; // Ajustez l'offset si nécessaire
        //         }
        //         return true;
        //     }
        // }
        // return false;
    }

    private _updateGroundDetection() {
        this._groundCheckCounter++;
         if(this._groundCheckCounter>=this._groundCheckInterval){
             if (!this._isGrounded()) {
                 // if (this._checkSlope() && this._gravity.y <= 0*/) {
                 //     this._gravity.y = 0;
                 //     this._jumpCount = 1;
                 //     this._grounded = true;
                 // } else{
                     this._gravity = this._gravity.add(Vector3.Up().scale(this._deltaTime * Player.GRAVITY));
                     this._grounded = false;
                 // }
             }
             else{
                 this._gravity.y = 0;
                 this._grounded = true;
                 this._jumpCount = 1;
                 this._canDash = true;
                 this.dashTime = 0;
                 this._dashPressed = false;
             }
             this._groundCheckCounter = 0;

            // else{
            //     this._gravity.y = 0;
            //     this._grounded = true;
            //     this._jumpCount = 1;
            //     this._canDash = true;
            //     this.dashTime = 0;
            //     this._dashPressed = false;
            // }
        }

        if (this._input.jumpKeyDown && this._jumpCount > 0 && !this._controlsLocked) {
            this._gravity.y = Player.JUMP_FORCE;
            this._jumpCount--;
        }

        if (this._gravity.y < -Player.JUMP_FORCE*this._groundCheckInterval*2) {
            this._gravity.y = -Player.JUMP_FORCE*this._groundCheckInterval*2;
        }

        this.mesh.moveWithCollisions(this._moveDirection.add(this._gravity));

        // if (this._isGrounded()) {
        //     this._gravity.y = 0;
        //     this._grounded = true;
        //     this._jumpCount = 1;
        //     this._canDash = true;
        //     this.dashTime = 0;
        //     this._dashPressed = false;
        // }


    }



    public wantsResumeDialogue(){
        return this._input.resumeDialog;
    }

    public lockControls(){
        document.exitPointerLock();
        this._moveDirection = Vector3.Zero();
        this._controlsLocked = true;
        this._input.controlsLocked = true;
    }

    public unlockControls(){
        this._controlsLocked = false;
        this._input.controlsLocked = false;
    }

    public claimReward(piece:MemoryPiece){
        const memo = MemoryAsset.memories.find(memo => memo.name === piece.memoryName)
        if(memo) memo.unlockPiece(piece);
        else console.log("Error, piece does not exist : PieceName = " + piece.name +", memoryName = " + piece.memoryName + ", memories = " + MemoryAsset.memories.length);
    }

    set health(value: number) {
        this._health = value;
    }

    private _attack(/*pickInfo: PickingInfo*/) {
        // pickInfo vient de onPointerObservable
        //console.log(pickInfo.pickedMesh?.name);
        //console.log("Picked metadata:", pickInfo.pickedMesh?.metadata);
        //if (pickInfo.hit && pickInfo.pickedMesh?.metadata?.isMonster) {
          //const monster = pickInfo.pickedMesh.metadata.monsterInstance as Monster;
          //console.log(monster);
          
          ///if(monster) monster.takeDamage(this._damage);
        if (!this.mesh) {
            return;
        }

        // Récupérer la position du joueur (légèrement au-dessus du centre)
        const playerPosition = this.mesh.getAbsolutePosition().add(this.mesh.getDirection(Axis.Z).scale(0)).add(new Vector3(0, 0.4, 0));

        // Récupérer la direction "avant" du joueur
        const playerForward = this.mesh.getDirection(Axis.Z).normalize();

        // Créer le rayon d'attaque
        const ray = new Ray(playerPosition, playerForward, 5); // Portée de l'attaque

        // Visualisation du rayon pour le débogage
        const rayHelper = new RayHelper(ray);
        rayHelper.show(this.scene, new Color3(1, 0, 0));
        setTimeout(() => {
            rayHelper.dispose();
        }, 100);

        // Effectuer un picking avec le rayon pour détecter les intersections
        const hit = this.scene.pickWithRay(ray);

        // Vérifier si une intersection a eu lieu et si l'objet touché est un monstre
        if (hit.hit && hit.pickedMesh && hit.pickedMesh.metadata && hit.pickedMesh.metadata.isMonster) {
            const targetMonster = hit.pickedMesh.metadata.monsterInstance as Monster;
            console.log("Le joueur attaque monstre : health: ", targetMonster.health);
            targetMonster.takeDamage(this._damage); // Appliquer les dégâts au monstre

        } else if (hit.hit && hit.pickedMesh) {
            console.log("Le rayon a touché :", hit.pickedMesh.name);
        } else {
            console.log("Le rayon n'a rien touché.");
        }
    }

    public playMovementAnimation(){
        if(this._inMovement){
            if(this.idleAnimation.isPlaying) this.idleAnimation.stop();
            if(this.joggingAnimation) this.joggingAnimation.play();
        }   
        else{
            if(this.joggingAnimation.isPlaying) this.joggingAnimation.stop();
            if(!this.idleAnimation.isPlaying) this.idleAnimation.play()
        }        
    }


    takeDamage(amount: number) {
        this._health -= amount;
        console.log(`Player takes ${amount} damage. Remaining health: ${this._health}`);
        if (this._health <= 0) {
            this.die();
            this._app._goToLose().then(() => {
                this._app._scene.clearCachedVertexData();
                this._app._scene.cleanCachedTextureBuffer();
            });
        }
    }

    isAlive(): boolean {
        return this._health > 0;
    }

    die() {
        console.log("Player has died.");
        this.playDeathAnimation();
    }

    public playIdleAnimation(): void {
        const idleAnim = this.animationGroups.find(a => a.name.toLowerCase().includes("idle"));
        //if (idleAnim) idleAnim.start(true);
    }

    public playDeathAnimation(): void {
        const anim = createDeathAnimation(this.mesh);
        this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, false);
        setTimeout(() => {
            this.mesh.dispose();
            console.log("Player is dead.");
        }, 1000); // délai pour laisser l’animation jouer
    }
}
