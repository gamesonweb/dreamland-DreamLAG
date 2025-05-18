    //import * as BABYLON from "@babylonjs/core/Legacy/legacy";
    import { createMoveAnimation, createAttackAnimation, createDeathAnimation } from "./animation";
    import { Player } from "../characterController";
    import {Color3, Mesh, MeshBuilder, Ray, Scene, SceneLoader, StandardMaterial, Vector3} from "@babylonjs/core";

    // Classe Monster qui représente un ennemi basique dans le jeu
    export class Monster {
        scene: Scene;
        health: number;
        damage: number;
        state: "idle" | "pursuing" | "attacking" | "dead"; // États possibles du monstre
        target: Player | null;
        lastAttackTime: number; // Dernier moment où le monstre a attaqué
        attackCooldown: number; // Temps entre deux attaques
        public mesh: Mesh; // Mesh du monstre
        detectionZone: Mesh; // Zone de détection autour du monstre
        isReady: boolean;

        private _deltaTime: number = 0;

        private _gravity: Vector3 = new Vector3();
        protected _grounded: boolean;
        protected _moveDirection:Vector3;

        private static readonly GRAVITY: number = -2.5;
        private static readonly MAX_GRAVITY_Y: number = -0.8;

        private meshNameToPick:String = null;

        private _beforeRenderFn?: () => void;

        constructor(scene: Scene, position: Vector3, health: number, damage: number, meshNameToPick?:String) {
            this.scene = scene;
            this.health = health;
            this.damage = damage;
            this.state = "idle";
            this.target = null;
            this.lastAttackTime = 0;
            this.attackCooldown = 2; // secondes

            // Création du corps du monstre
            this.mesh = MeshBuilder.CreateSphere("monster", { diameter: 3 }, scene);
            this.mesh.setAbsolutePosition(position);
            const material = new StandardMaterial("monsterMaterial", scene);
            material.diffuseColor = new Color3(1, 0, 0); // Rouge
            this.mesh.material = material;

            this.mesh.checkCollisions = false;
            this.mesh.ellipsoid       = new Vector3(1.5, 1.5, 1.5);  // rayon de la sphère
            this.mesh.ellipsoidOffset = new Vector3(0, 0.5, 0); // pour que l’ellipsoïde soit alignée à la base
            this.mesh.isPickable = true;
            this.mesh.metadata = {
                isMonster: true,
                monsterInstance: this
            }


            // Zone invisible utilisée pour détecter le joueur
            // this.detectionZone = MeshBuilder.CreateSphere("detectionZone", { diameter: 2 }, scene);
            // this.detectionZone.isVisible = false;
            // this.detectionZone.checkCollisions = false;

            this._moveDirection = Vector3.Zero();

            if(meshNameToPick) this.meshNameToPick = meshNameToPick

            this.isReady = true;
        }


        protected _floorRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
                let raycastFloorPos = new Vector3(this.mesh.getAbsolutePosition().x + offsetx, this.mesh.getAbsolutePosition().y-5, this.mesh.getAbsolutePosition().z + offsetz);
                let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);
        
                let predicate = function (mesh) {
                    return mesh.isPickable && mesh.isEnabled();
                    //else return false;
                    
                }

                let predicate2 = function(mesh){
                    if(mesh.name.includes("Area")) return mesh.isPickable && mesh.isEnabled();
                    else return false;
                }

                let pick = null;
                if(this.meshNameToPick) pick = this.scene.pickWithRay(ray, predicate2);
                else pick = this.scene.pickWithRay(ray, predicate);
        
                if (pick.hit) {
                    return pick.pickedPoint;
                } else {
                    return Vector3.Zero();
                }
            }
        
        

        private _isGrounded() {
            // const result = this._floorRaycast(0, 0, 0.7);
            // if(!result.equals(Vector3.Zero())){
            //     //this.mesh.position.y = result.y + 1;
            //     return true;
            // }
            // else{
            //     return false;
            // } 
            return false;
        }


        private _updateGroundDetection(){
            //this._moveDirection = Vector3.Zero();
            //this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
                if (!this._isGrounded()) {
                    // if (this._checkSlope() && this._gravity.y <= 0*/) {
                    //     this._gravity.y = 0;
                    //     this._jumpCount = 1;
                    //     this._grounded = true;
                    // } else{
                    //console.log("Grounded!");
                    
                        this._gravity = this._gravity.add(Vector3.Up().scale(this._deltaTime * Monster.GRAVITY));
                        this._grounded = false;
                    // }
                }
                else{
                    this._gravity.y = 0;
                    this._grounded = true;
                }
                
                //this._gravity.y = 0;
        
                if (this._gravity.y < Monster.MAX_GRAVITY_Y) {
                    this._gravity.y = Monster.MAX_GRAVITY_Y;
                }
                
                this._moveDirection = this._moveDirection.add(this._gravity);
                
                this.mesh.moveWithCollisions(this._gravity);
        
                // if (this._isGrounded()) {
                //     this._gravity.y = 0;
                //     this._grounded = true;
                //     this._jumpCount = 1;
                //     this._canDash = true;
                //     this.dashTime = 0;
                //     this._dashPressed = false;
                // }
        
        
        }

        // private _beforeRenderUpdate(): void {
        //     this._updateGroundDetection();
        // }


        // private _updateMonster(players : Player[]):void{
        //     if (this.state !== "dead"){
                    
                    

        //             this.update(players);
        //             this._updateGroundDetection();

        //         }
        // }


        public activateMonster(players: Player[]): void {
            this._beforeRenderFn = async () => {
                if (this.state !== "dead") {
                    // console.log("monstre position = " + this.mesh.position);
                    // console.log("monstre position absolue= " + this.mesh.getAbsolutePosition())
                    this._moveDirection=new Vector3(0,0,0);
                    this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
                    //this._updateGroundDetection();
                    this.update(players);
                    
                }
                else this.desactivateMonster();
            };

            this.scene.registerBeforeRender(this._beforeRenderFn);
        }

        public async desactivateMonster(): Promise<void> {
            if (this._beforeRenderFn) {
                this.scene.unregisterBeforeRender(this._beforeRenderFn);
                this._beforeRenderFn = undefined;
                if(this.state!=="dead")this.mesh.dispose();
            }
        }

        /**
         * Inflige des dégâts au monstre.
         */
        takeDamage(amount: number): void {
            this.health -= amount;
            console.log(`Monster takes ${amount} damage. Remaining health: ${this.health}`);
            if (this.health <= 0) this.die();
        }

        /**
         * Joue l'animation de mort et détruit le monstre.
         */
        die(): void {
            console.log("Monster is dying...");
            this.playDeathAnimation();
            this.state = "dead"; // On place l’état sur "dead"
        }

        /**
         * Vérifie si le monstre est toujours en vie.
         */
        isAlive(): boolean {
            return this.health > 0;
        }

        /**
         * Met à jour l'état du monstre (appelée à chaque frame).
         */
        public update(targets: Player[]) {
            if (!this.isReady) return;
            

            if (!this.isAlive()) {
                this.state = "dead";
                return;
            }

            // Réinitialise l'état et la cible
            this.state = "idle";
            this.target = null;


            // Recherche d'un joueur dans la portée
            for (const t of targets) {
                const distance = Vector3.Distance(this.mesh.getAbsolutePosition(), t.mesh.getAbsolutePosition());
                if (distance <= 50 && t.isAlive()) {
                    this.target = t;
                    break;
                }
            }

            if (this.target) {
                const dist = Vector3.Distance(this.mesh.getAbsolutePosition(), this.target.mesh.getAbsolutePosition());
                if (dist > 2) {
                    this.state = "pursuing";
                    this.moveTowardTarget();
                    if(this._grounded) this.playMoveAnimation();
                } else {
                    this.state = "attacking";
                    this.attack();
                }
            }
        }

        /**
         * Fait avancer le monstre vers la cible.
         */
        moveTowardTarget() {
            if (!this.target || !this.target.isAlive()) return;

            const targetPos = this.target.mesh.getAbsolutePosition();
            const slimePos = this.mesh.getAbsolutePosition();
            const direction = targetPos.subtract(slimePos).normalize();
            const moveSpeed = 0.1;

            this._moveDirection = direction.scale(moveSpeed);
            this.mesh.moveWithCollisions(this._moveDirection);

            // Rotation vers la cible
            const facingPos = targetPos.clone();
            facingPos.y = slimePos.y; // Pour éviter de s'incliner vers le haut ou le bas
            this.mesh.lookAt(facingPos);

            this.playMoveAnimation();
        }

        /**
         * Fait attaquer le monstre s’il peut.
         */
        attack() {
            const now = performance.now() / 1000; // en secondes
            if (now - this.lastAttackTime < this.attackCooldown) return;

            this.lastAttackTime = now;

            if (this.target && this.target.isAlive()) {
                this.target.takeDamage(this.damage);
                console.log("The monster is attacking the player.");
                this.playAttackAnimation();
            }
        }

        /**
         * Animation de déplacement.
         */
        playMoveAnimation() {
            const anim = createMoveAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 40, true);
        }

        /**
         * Animation d'attaque.
         */
        playAttackAnimation(): void {
            const anim = createAttackAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 20, false);
        }

        /**
         * Animation de mort, avec suppression du mesh à la fin.
         */
        playDeathAnimation(): void {
            const anim = createDeathAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, false);
            setTimeout(() => {
                this.mesh.dispose();
                //this.detectionZone.dispose();
                console.log("Monster is dead.");
            }, 1000); // délai pour laisser l’animation jouer
        }
    }
