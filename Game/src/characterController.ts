import {
    AbstractMesh,
    AnimationGroup, ArcRotateCamera, Axis, Bone, Color3, DynamicTexture, GlowLayer, Mesh, MeshBuilder, Nullable, PickingInfo, Quaternion, Ray, RayHelper,
    Scene, SceneLoader, ShadowGenerator, StandardMaterial, Texture, Tools, TransformNode,
    Vector3
} from "@babylonjs/core";
import { Monster } from "./entities/monster";
import {App} from "./app";
import {createDeathAnimation} from "./entities/animation";
import { Memory, MemoryAsset, MemoryPiece } from "./memory";
import { PlayerInput } from "./inputController";
import {MemoryMenu} from "./memoryMenu";
import { AdvancedDynamicTexture, Control, Rectangle, TextBlock } from "@babylonjs/gui";


export class Player extends TransformNode {
    //public camera: UniversalCamera;
    public camera: ArcRotateCamera;
    public scene: Scene;
    private _input;
    public animationGroups: AnimationGroup[] = [];
    public runningAnimation: AnimationGroup = null;
    public idleAnimation: AnimationGroup = null;

    private _camRoot: TransformNode;
    private _yTilt: TransformNode;

    //Propriétés de mouvement
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
    private _isFlying = false;
    private _regenTimeoutId: any = null;

    // Player properties
    private _mesh: Mesh; // Outer collisionbox of the player
    private _deltaTime: number = 0;
    private _health: number = 100;
    private _damage: number = 10;
    private _memories:Memory[];

    private _controlsLocked:Boolean = false;

    private static readonly ORIGINAL_TILT:  Vector3 = new Vector3(0.5934119456780721, 0, 0);
    private static readonly PLAYER_SPEED: number = 0.5;
    private static readonly PLAYER_FLIGHT_SPEED:number = 1.2;
    private static readonly GRAVITY: number = -2.5;
    private static readonly JUMP_FORCE: number = 0.7;
    private static readonly DASH_FACTOR: number = 1.5;
    private static readonly DASH_TIME: number = 10;
    private static readonly DEATH_Y_THRESHOLD = -500;
    private static readonly REGEN_TIMER = 1000;
    private static readonly REGEN_AMOUNT = 1;
    public dashTime: number = 0;

    //Player UI properties
    private _memoryMenu:MemoryMenu;
    private _memoryMenuKeyPressed:boolean = false;

    private _healthBar:Rectangle;
    private _healthText:TextBlock;

    //Conditions de vol
    private _flyKeyPressed:boolean = false;
    private _flightUnlocked = false;

    private _groundCheckInterval: number = 1; // Vérifier tous les 3 frames
    private _groundCheckCounter: number = 0;


    //player attack properties
    private _dynTex:DynamicTexture;
    private _glow:GlowLayer;

    //fontion pour update en fonction des commandes choisies par le joueur
    private _renderLoop = () => {};
    
    constructor(private _app: App, assets:any, scene: Scene, position: Vector3, shadowGenerator?: ShadowGenerator, input?) {
    super("player", scene);
    this.scene = scene;
    this._input = input;
    this._setupPlayerCamera();
    this._setupCameraInputs();
    this.animationGroups = []; 

    SceneLoader.ImportMeshAsync("", "assets/playerSkin/", "character.gltf", scene).then((result) => {
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

    this.runningAnimation = result.animationGroups.find(g => g.name === "Run");
    this.idleAnimation = result.animationGroups.find(g => g.name === "Idle");

    this._createLightRayTexture();
    

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

    public createPlayerUI(scene:Scene){

        // GUI
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
        // loseBtn.width = 0.2;
        // loseBtn.height = "40px";
        // loseBtn.color = "white";
        // loseBtn.top = "-14px";
        // loseBtn.thickness = 0;
        // loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        // playerUI.addControl(loseBtn);

        // loseBtn.onPointerDownObservable.add(() => {
        //     this._goToLose();
        //     scene.detachControl(); // Observables disabled
        // });

        //Pour afficher les fps
        // this.fpsDisplay = new TextBlock();
        // this.fpsDisplay.text = "FPS: 0";
        // this.fpsDisplay.color = "black";
        // this.fpsDisplay.fontSize = 24;
        // this.fpsDisplay.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        // this.fpsDisplay.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        // this.fpsDisplay.paddingLeft = "10px";
        // this.fpsDisplay.paddingBottom = "10px";
        // this.fpsDisplay.isVisible = true;
        // playerUI.addControl(this.fpsDisplay);
        // 2. Conteneur pour la barre
        const healthBarContainer = new Rectangle();
        healthBarContainer.width = "20%";
        healthBarContainer.height = "10%";
        healthBarContainer.cornerRadius = 10;
        healthBarContainer.color = "white";
        healthBarContainer.thickness = 1;
        healthBarContainer.background = "gray";
        healthBarContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        healthBarContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        healthBarContainer.paddingBottom = "50px";
        playerUI.addControl(healthBarContainer);

        
        const healthBar = new Rectangle();
        healthBar.width = "100%"; // 1 = 100%
        healthBar.height = 1;
        healthBar.cornerRadius = 0;
        healthBar.color = "red";
        healthBar.thickness = 0;
        healthBar.background = "red";
        healthBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        healthBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        healthBarContainer.addControl(healthBar);
        this._healthBar = healthBar;

        const healthText = new TextBlock();
        healthText.text = "100/100";
        healthText.color = "black";
        healthText.fontSize = 20;
        healthText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        healthText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        healthText.isVisible = true;
        healthBarContainer.addControl(healthText);
        this._healthText = healthText;

        scene.detachControl();
    }

    private _updateHealthUI(){
        this._healthText.text = `${this._health}/100`;
        this._healthBar.width = `${this._health}%`;
    }

    private _updateCamera(): void {
        if (!this._mesh || !this._camRoot) return;
        let centerPlayer = this.mesh.position.y + 2;
        this.camera.setTarget(this.mesh.position);
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);
    }

    private _updateFromControls() {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        let move=null
        this._moveDirection = Vector3.Zero();
        this._h = this._input.horizontal;
        this._v = this._input.vertical;
        if (this._flightUnlocked && this._input.flyDown && !this._flyKeyPressed){
            console.log("Je vole")
            this._isFlying=!this._isFlying;
            this._flyKeyPressed = true;
        }
        else if(!this._input.flyDown) this._flyKeyPressed = false;

        if (this._isFlying) {
            // Désactive la gravité en vol
            this._gravity = Vector3.Zero();

            // Autoriser le déplacement vertical avec d'autres touches
            let verticalMove = 0;
            if (this._input.jumpKeyDown) verticalMove = 1;
            else if (this._input.dashing) verticalMove=-1// touche saut = monter// touche accroupir = descendre

            let fwd = this.camera.getDirection(Axis.Z);
            let right = this.camera.getDirection(Axis.X);

            let correctedVertical = fwd.scale(this._v);
            let correctedHorizontal = right.scale(this._h);

            // Ajoute le mouvement vertical
            move = correctedHorizontal.add(correctedVertical);
            move.y = verticalMove;

            if (!this._hasFrontAnObstacle()) {
                this._moveDirection = move.normalize().scale(Player.PLAYER_FLIGHT_SPEED);
            }

            if(!this.idleAnimation.isPlaying) this.idleAnimation.play()

        } else {

            if (!this._h && !this._v) this._inMovement = false;
            else this._inMovement = true;
            this.playMovementAnimation();


            // let fwd = this._camRoot.forward;
            // let right = this._camRoot.right;

            let fwd = this.camera.getDirection(Axis.Z);
            let right = this.camera.getDirection(Axis.X);

            let correctedVertical = fwd.scale(this._v);
            let correctedHorizontal = right.scale(this._h);

            move = correctedHorizontal.add(correctedVertical);
            move.y = 0;

            if (!this._hasFrontAnObstacle()) {
                this._moveDirection = move.normalize();
            }


            let inputMag = Math.abs(this._h) + Math.abs(this._v);
            this._inputAmt = inputMag > 1 ? 1 : inputMag;

            this._moveDirection = this._moveDirection.scale(this._inputAmt * Player.PLAYER_SPEED);
        }
        if(!this._moveDirection.equals(Vector3.Zero())) {
            let angle = Math.atan2(this._moveDirection.x, this._moveDirection.z);
            const targetQuat = Quaternion.FromEulerAngles(0, angle, 0);

            this.mesh.rotationQuaternion = Quaternion.Slerp(
                this.mesh.rotationQuaternion || Quaternion.Identity(),
                targetQuat,
                10 * this._deltaTime
            );
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

    private _checkPlayerHeight(){
        if(this.mesh.getAbsolutePosition().y < Player.DEATH_Y_THRESHOLD) this.die();
    }

    private _beforeRenderUpdate(): void {
        if(!this._controlsLocked) this._updateFromControls();
        this._updateGroundDetection();
        this._updateMenus();
    }

    public activatePlayerCamera(): ArcRotateCamera{
        this._renderLoop = () => {
            this._beforeRenderUpdate();
            this._updateCamera();
            this._checkPlayerHeight();
        };
        this.scene.registerBeforeRender(this._renderLoop);
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
                 if(!this._isFlying) {
                     // Appliquer gravité seulement si pas en mode vol
                     this._gravity = this._gravity.add(Vector3.Up().scale(this._deltaTime * Player.GRAVITY));
                     this._grounded = false;
                 } else {
                     // En vol, on ne tombe pas
                     this._gravity = Vector3.Zero();
                     this._grounded = false;
                 }
                 // }
             }
             else{
                 this._gravity.y = 0;
                 this._grounded = true;
                 this._jumpCount = 1;
                 this._canDash = true;
                 this.dashTime = 0;
                 this._dashPressed = false;
                 this._isFlying=false;
             }
             this._groundCheckCounter = 0;
        }

        if (this._input.jumpKeyDown && this._jumpCount > 0 && !this._controlsLocked && !this._isFlying) {
            this._gravity.y = Player.JUMP_FORCE;
            this._jumpCount--;
        }

        if (this._gravity.y < -Player.JUMP_FORCE*this._groundCheckInterval*2) {
            this._gravity.y = -Player.JUMP_FORCE*this._groundCheckInterval*2;
        }

        this.mesh.moveWithCollisions(this._moveDirection.add(this._gravity));
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
        this._damage+=1;
        if(memo) memo.unlockPiece(piece);
        else console.log("Error, piece does not exist : PieceName = " + piece.name +", memoryName = " + piece.memoryName + ", memories = " + MemoryAsset.memories.length);
    }

    public unlockFlightMode(){
        this._flightUnlocked = true;
    }

    set health(value: number) {
        this._health = value;
    }

    private _createLightRayTexture(){
        const size = 256;
        const dynTex = new DynamicTexture("beamGrad", { width: size, height: size }, this.scene, false);
        const ctx = dynTex.getContext();

        // Création du dégradé horizontal (de gauche à droite)
        const grd = ctx.createLinearGradient(0, 0, size, 0);
        grd.addColorStop(0.0, "rgba(255,  50,  50, 1)");   // rouge vif
        grd.addColorStop(0.5, "rgba(255, 200,  50, 0.6)"); // jaune cuivré semi-transparent
        grd.addColorStop(1.0, "rgba(255,  50, 255, 0)");   // violet qui s’estompe

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, size, size);
        dynTex.update();
        this._dynTex = dynTex;

        const glow = new GlowLayer("glow", this.scene);
        glow.intensity = 0.5;        // plus élevé = plus de halo
        glow.blurKernelSize = 64;    // ajuste la diffusion
        this._glow = glow;
    }

    private _attack() {
        if (!this.mesh) {
            return;
        }

        const playerPosition = this.mesh.getAbsolutePosition().add(this.mesh.getDirection(Axis.Z).scale(0)).add(new Vector3(0, 1, 0));
        const playerForward = this.mesh.getDirection(Axis.Z).normalize();
        const ray = new Ray(playerPosition, playerForward, 4);

        // 1) Position centrale du joueur (à la hauteur souhaitée)
        const eyeHeight = 1;
        const basePos = this.mesh.getAbsolutePosition().add(new Vector3(0, eyeHeight, 0));

        // 2) Direction avant
        const forward = this.mesh.getDirection(Axis.Z).normalize();

        // 3) Décaler le point de départ un peu devant le joueur
        const muzzleOffset = 0.5;  // ajustez selon la taille de votre personnage/arme
        const start = basePos.add(forward.scale(muzzleOffset));

    //const start  = this.mesh.getAbsolutePosition().add(new Vector3(0, 1, 0));
    const dir    = this.mesh.getDirection(Axis.Z).normalize();

    // 2) détection de la collision pour la longueur
    //const ray    = new Ray(start, dir, 10);
    const hit    = this.scene.pickWithRay(ray);
    const length = hit.hit && hit.pickedPoint
        ? Vector3.Distance(start, hit.pickedPoint)
        : ray.length;

    // 3) création du tube (shape volumétrique)
    const beam = MeshBuilder.CreateTube("beam", {
        path: [ start, start.add(dir.scale(length)) ],
        radius: 0.1,
        tessellation: 6
    }, this.scene);
    
    

    // Matériau émissif ajoutant ce dégradé
    const mat = new StandardMaterial("beamMat", this.scene);
    mat.emissiveTexture  = this._dynTex;
    mat.emissiveColor    = new Color3(1, 1, 1);
    mat.disableLighting  = true;
    mat.alpha            = 0.8;

    // Applique sur ton tube
    beam.material = mat;
    //const newGlow = this._glow.c

        // 6) Nettoyage rapide
        setTimeout(() => {
            beam.dispose();
            //rayHelper.dispose();
        }, 50);

        

        

        if (hit.hit && hit.pickedMesh) {
            // Fonction pour remonter dans la hiérarchie et trouver un parent avec isMonster=true
            function findMonsterParent(mesh: Nullable<AbstractMesh>): Nullable<AbstractMesh> {
                while (mesh) {
                    if (mesh.metadata && mesh.metadata.isMonster) {
                        return mesh;
                    }
                    mesh = mesh.parent as Mesh | null;
                }
                return null;
            }

            const monsterMesh = findMonsterParent(hit.pickedMesh);

            if (monsterMesh) {
                const targetMonster = monsterMesh.metadata.monsterInstance as Monster;
                console.log("Le joueur attaque le monstre : health: ", targetMonster.health);
                if(targetMonster.isAlive())targetMonster.takeDamage(this._damage);
            } else {
                console.log("Le rayon a touché :", hit.pickedMesh.name, "mais ce n'est pas un monstre.");
            }
        } else {
            console.log("Le rayon n'a rien touché.");
        }
    }




    public playMovementAnimation(){
        if(this._inMovement){
            if(this.idleAnimation.isPlaying) this.idleAnimation.stop();
            if(this.runningAnimation) this.runningAnimation.play();
        }   
        else{
            if(this.runningAnimation.isPlaying) this.runningAnimation.stop();
            if(!this.idleAnimation.isPlaying) this.idleAnimation.play()
        }        
    }

    private updateHealthRegen() {
    // Si déjà en cours, on ne lance pas un autre
    if (this._regenTimeoutId !== null) return;

    const tick = () => {
        if (this._health < 100) { 
            this._health += Player.REGEN_AMOUNT;
            if (this._health > 100) this._health = 100;
            this._updateHealthUI();
            this._regenTimeoutId = setTimeout(tick, Player.REGEN_TIMER);
        } else {
            this._regenTimeoutId = null; // Arrêt de la regen
        }
    };

    this._regenTimeoutId = setTimeout(tick, Player.REGEN_TIMER);
}


    takeDamage(amount: number) {
        this._health -= amount;
        this._updateHealthUI();
        console.log(`Player takes ${amount} damage. Remaining health: ${this._health}`);
        if (this._health <= 0) {
            this.die();
        }
        this.updateHealthRegen();
    }

    isAlive(): boolean {
        return this._health > 0;
    }

    die() {
        console.log("Player has died.");
        this.playDeathAnimation();
        this.scene.unregisterBeforeRender(this._renderLoop);
        this._app._goToLose().then(() => {
            this._app._scene.clearCachedVertexData();
            this._app._scene.cleanCachedTextureBuffer();
        });
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
