import { ArcRotateCamera, Mesh, Quaternion, Ray, 
    Scene, ShadowGenerator, TransformNode,
     UniversalCamera, Vector3 } from "@babylonjs/core";

export class Player extends TransformNode {
    public camera: UniversalCamera;
    public scene: Scene;
    private _input;
  
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;
  
    private _moveDirection: Vector3;
    private _h: number;
    private _v: number;
    private _inputAmt: number;
    private _gravity: Vector3 = new Vector3();
    private _grounded: boolean;
    private _lastGroundPos: Vector3;
    private _jumpCount: number;
    private _dashPressed: boolean = false;
    private _canDash: boolean = true;
  
    // Player properties
    public mesh: Mesh; // Outer collisionbox of the player
  
    private static readonly ORIGINAL_TILT:  Vector3 = new Vector3(0.5934119456780721, 0, 0);
    private static readonly PLAYER_SPEED: number = 0.45;
    private static readonly GRAVITY: number = -2.5;
    private static readonly JUMP_FORCE: number = 0.80;
    private static readonly DASH_FACTOR: number = 1.5;
    private static readonly DASH_TIME: number = 10;
    public dashTime: number = 0;
  
    private _deltaTime: number = 0;
  
    constructor(assets, scene: Scene, shadowGenerator: ShadowGenerator, input?) {
        super("player", scene);
        this.scene = scene;
        this._setupPlayerCamera();
  
        this.mesh = assets.mesh;
        this.mesh.parent = this;
  
        shadowGenerator.addShadowCaster(assets.mesh); // le joueur va projeter des ombres
  
        this._input = input; // inputs que vous recevez (p.ex. inputController.ts)
  
        // Ajout des inputs pour la caméra (souris par exemple)
        this._setupCameraInputs();
    }
  
    private _setupPlayerCamera(): UniversalCamera {
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
        this.camera = new UniversalCamera("cam", new Vector3(0, 0, -30), this.scene);
        this.camera.lockedTarget = this._camRoot.position;
        this.camera.fov = 0.47350045992678597;
        this.camera.parent = this._yTilt;
  
        this.scene.activeCamera = this.camera;
        return this.camera;
    }
  
    // Fonction pour attacher des inputs personnalisés pour la rotation de la caméra
    private _setupCameraInputs(): void {
        // On peut par exemple utiliser les événements de pointer move sur le canvas
        const canvas = this.scene.getEngine().getRenderingCanvas();
        if (!canvas) {
            return;
        }
  
        let previousX: number;
        let previousY: number;
        let dragging = false;
  
        canvas.addEventListener("pointerdown", (evt) => {
            dragging = true;
            previousX = evt.clientX;
            previousY = evt.clientY;
            // On peut aussi activer le pointer lock si besoin
            canvas.requestPointerLock();
        });
  
        canvas.addEventListener("pointerup", () => {
            dragging = false;
            document.exitPointerLock();
        });
  
        canvas.addEventListener("pointermove", (evt) => {
            if (!dragging) return;
            let deltaX = evt.clientX - previousX;
            let deltaY = evt.clientY - previousY;
            previousX = evt.clientX;
            previousY = evt.clientY;
  
            // Sensibilité ajustable (les valeurs peuvent être affinées)
            const sensitivity = 0.005;
  
            // Modifier la rotation Y de _camRoot pour le panoramique horizontal
            this._camRoot.rotation.y -= deltaX * sensitivity;
  
            // Modifier la rotation X de _yTilt pour le tilt vertical, en le limitant
            let newTiltX = this._yTilt.rotation.x - deltaY * sensitivity;
            // On peut limiter le tilt pour ne pas inverser la vue (par exemple entre -pi/2 et pi/2)
            newTiltX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, newTiltX));
            this._yTilt.rotation.x = newTiltX;
        });
    }
  
    private _updateCamera(): void {
        let centerPlayer = this.mesh.position.y + 2;
        this._camRoot.position = Vector3.Lerp(this._camRoot.position, new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z), 0.4);
    }
  
    private _updateFromControls() {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
  
        this._moveDirection = Vector3.Zero();
        this._h = this._input.horizontal; // mouvement horizontal (x)
        this._v = this._input.vertical;   // mouvement vertical (z)
  
        // Mouvements relatifs à la caméra (basés sur _camRoot.forward et _camRoot.right)
        let fwd = this._camRoot.forward;
        let right = this._camRoot.right;
        let correctedVertical = fwd.scale(this._v);
        let correctedHorizontal = right.scale(this._h);
  
        let move = correctedHorizontal.add(correctedVertical);
  
        // On enlève la composante y pour le mouvement horizontal, et on normalise
        move.y = 0;
        this._moveDirection = move.normalize();
  
        let inputMag = Math.abs(this._h) + Math.abs(this._v);
        this._inputAmt = inputMag > 1 ? 1 : inputMag;
  
        this._moveDirection = this._moveDirection.scale(this._inputAmt * Player.PLAYER_SPEED);
  
        // Rotation du joueur selon l’orientation de la caméra et les inputs (déjà présent dans votre code)
        let input = new Vector3(this._input.horizontalAxis, 0, this._input.verticalAxis);
        if (input.length() !== 0) {
            let angle = Math.atan2(this._input.horizontalAxis, this._input.verticalAxis);
            angle += this._camRoot.rotation.y;
            let targ = Quaternion.FromEulerAngles(0, angle, 0);
            this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion, targ, 10 * this._deltaTime);
        }
  
        // Gestion du dash (inchangée)
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
            // Appliquer le dash sur le mouvement
            this._moveDirection = this._moveDirection.scale(dashFactor);
        }
    }
  
    private _beforeRenderUpdate(): void {
        this._updateFromControls();
        this._updateGroundDetection();
    }
  
    public activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {
            this._beforeRenderUpdate();
            this._updateCamera();
        });
        return this.camera;
    }
  
    private _floorRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
        let raycastFloorPos = new Vector3(this.mesh.position.x + offsetx, this.mesh.position.y + 0.5, this.mesh.position.z + offsetz);
        let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);
  
        let predicate = function (mesh) {
            if(mesh.name === "InvisibleGround") return false;
            return mesh.isPickable && mesh.isEnabled();//return false
            // else return false;
        }
        let pick = this.scene.pickWithRay(ray, predicate);
  
        if (pick.hit) {
            return pick.pickedPoint;
        } else {
            return Vector3.Zero();
        }
    }
  
    private _isGrounded() {
        return !this._floorRaycast(0, 0, 1).equals(Vector3.Zero());
    }
  
    private _updateGroundDetection() {
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
  
        if (this._input.jumpKeyDown && this._jumpCount > 0) {
            this._gravity.y = Player.JUMP_FORCE;
            this._jumpCount--;
        }

        if (this._gravity.y < -Player.JUMP_FORCE) {
            this._gravity.y = -Player.JUMP_FORCE;
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
  
    private _checkSlope() {
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        };
  
        // Raycasts dans quatre directions autour du joueur
        let offsets = [
            new Vector3(0, 0.5, 0.25),
            new Vector3(0, 0.5, -0.25),
            new Vector3(0.25, 0.5, 0),
            new Vector3(-0.25, 0.5, 0)
        ];
  
        for (let offset of offsets) {
            let ray = new Ray(this.mesh.position.add(offset), Vector3.Up().scale(-1), 1.5);
            let pick = this.scene.pickWithRay(ray, predicate);
            if (pick.hit && !pick.getNormal().equals(Vector3.Up()) && pick.pickedMesh.name.includes("stair")) {
                return true;
            }
        }
        return false;
    }
}
