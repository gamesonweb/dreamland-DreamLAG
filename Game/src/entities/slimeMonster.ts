import { Scene, Vector3, Mesh, AnimationGroup, SceneLoader, StandardMaterial, MeshBuilder, Color3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Rectangle, TextBlock } from "@babylonjs/gui";
import { Monster } from "./monster";
import {
    createSlimeIdleAnimation,
    createSlimeDeathAnimation,
    createSlimeBounceAnimation,
    createSlimeAttackAnimation
} from "./slimeAnimations";

export class SlimeMonster extends Monster {
    static DEFAULT_SLIME_HEALTH = 100;
    static DEFAULT_SLIME_DAMAGE = 10;

    private healthBar:Rectangle;
    private healthText:TextBlock;
    public animationGroups: AnimationGroup[] = [];

    private healthBarMesh: Mesh;
    private healthADT: AdvancedDynamicTexture;
    constructor(scene: Scene, position: Vector3) {
        super(scene, position, SlimeMonster.DEFAULT_SLIME_HEALTH, SlimeMonster.DEFAULT_SLIME_DAMAGE);
        this.scene = scene;

        // Supprimer le mesh par défaut
        this.mesh.dispose();
        this.isReady = false;

        // Charger le modèle GLB du slime avec animations
        // Slime Enemy by Quaternius (https://poly.pizza/m/eSLKTsbl7F)
        SceneLoader.ImportMeshAsync("", "assets/monsters/", "SlimeEnemy.gltf", scene).then((result) => {
            const slimeMesh = result.meshes[0] as Mesh;
            slimeMesh.name = "SlimeBoss";
            slimeMesh.scaling = new Vector3(0.5, 0.5, 0.5);
            slimeMesh.scalingDeterminant = 1;
            slimeMesh.checkCollisions = true;
            slimeMesh.ellipsoid = new Vector3(1.5, 1.5, 1.5);
            slimeMesh.ellipsoidOffset = new Vector3(0, 1.5, 0);
            slimeMesh.metadata = {
                isMonster: true,
                monsterInstance: this
            };

            this.mesh = slimeMesh;
            this.animationGroups = result.animationGroups;

            this.mesh.checkCollisions = true;
            this.mesh.isVisible = true;

            this.mesh.setAbsolutePosition(position);
            this.isReady = true;
            this.playIdleAnimation();

            this.createSlimeHealthBar();
        });

        this.scene.registerBeforeRender(() => {
            if (this.isReady) {
                this.updateHealthBarPosition();
            }
        });
    }

    public createSlimeHealthBar() {
        // Créer un plan plus grand pour la barre de vie
        this.healthBarMesh = MeshBuilder.CreatePlane("healthBarMesh", { width: 3, height: 0.7 }, this.scene);
        this.healthBarMesh.parent = this.mesh;
        this.healthBarMesh.position = new Vector3(0, 3, 0); // Position au-dessus du slime

        // Matériau semi-transparent sombre pour faire ressortir la barre
        const mat = new StandardMaterial("healthBarMat", this.scene);
        mat.diffuseColor = new Color3(0.1, 0.1, 0.1);
        mat.alpha = 0.6; // semi-transparent
        mat.backFaceCulling = false;
        mat.transparencyMode = 2; // alpha blending
        this.healthBarMesh.material = mat;

        // Créer la texture GUI sur le plan
        this.healthADT = AdvancedDynamicTexture.CreateForMesh(this.healthBarMesh, 512, 128, false);

        // Container de la barre avec fond noir et contour blanc épais
        const healthBarContainer = new Rectangle();
        healthBarContainer.width = "300px";
        healthBarContainer.height = "100px";
        healthBarContainer.cornerRadius = 10;
        healthBarContainer.color = "white";       // contour blanc
        healthBarContainer.thickness = 4;          // contour épais
        healthBarContainer.background = "black";  // fond noir pour contraste
        this.healthADT.addControl(healthBarContainer);

        // Barre rouge qui varie en largeur
        const healthBar = new Rectangle();
        healthBar.width = "100%";
        healthBar.height = "40px";
        healthBar.cornerRadius = 8;
        healthBar.color = "red";
        healthBar.thickness = 0;
        healthBar.background = "red";
        healthBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        healthBarContainer.addControl(healthBar);
        this.healthBar = healthBar;

        // Texte blanc avec ombre noire pour meilleure lisibilité
        const healthText = new TextBlock();
        healthText.text = "100/100";
        healthText.color = "white";
        healthText.fontSize = 28;
        healthText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        healthText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        healthText.shadowColor = "black";
        healthText.shadowBlur = 2;
        healthText.shadowOffsetX = 1;
        healthText.shadowOffsetY = 1;
        healthBarContainer.addControl(healthText);
        this.healthText = healthText;

        this.healthBarMesh.position = this.mesh.position.add(new Vector3(0, 1, 0));
    }

    private updateHealthBarPosition() {
        if (!this.mesh || !this.healthBarMesh) return;

        this.healthBarMesh.position = this.mesh.position.add(new Vector3(0, 1.2, 0));

        const camera = this.scene.activeCamera;
        if (camera) {
            this.healthBarMesh.lookAt(camera.position);
            this.healthBarMesh.rotation.x = 0;
            this.healthBarMesh.rotation.z = 0;
        }
    }


    public updateSlimeHealth() {
        const health = Math.max(0, Math.min(this.health, 100));
        this.healthText.text = `${health}/100`;
        this.healthBar.width = `${health}%`;

        if (health < 30) {
            this.healthBar.background = "orangeRed";
            this.healthBar.color = "orangeRed";
        } else {
            this.healthBar.background = "red";
            this.healthBar.color = "red";
        }
    }


    /** Joue l'animation d'attente ("idle") du slime */
    public playIdleAnimation(): void {
        this._stopAllAnimations();
        const idleAnim = this.animationGroups.find(a => a.name.toLowerCase() === "idle");

        if (idleAnim) {
            idleAnim.start(true);
        } else {
            const anim = createSlimeIdleAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, true);
        }
    }

    /** Joue l'animation de déplacement ("walk") */
    public override playMoveAnimation(){
        this._stopAllAnimations();
        const moveAnim = this.animationGroups.find(a => a.name.toLowerCase() === "Walk");
        const jumpAnim = this.animationGroups.find(a => a.name.toLowerCase() === "Jump");

        if (moveAnim) {
            moveAnim.start(true);
            if (jumpAnim) {
                jumpAnim.start(true);
            }
        } else {
            const anim = createSlimeBounceAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 20, true);
        }
    }

    /** Joue l'animation d'attaque (priorité à "Bite_Front", sinon "Bite_InPlace") */
    public override playAttackAnimation(): void {
        this._stopAllAnimations();
        const meleeAttackAnim = this.animationGroups.find(a => a.name.toLowerCase() === "Bite_Front");
        const rangedAttackAnim = this.animationGroups.find(a => a.name.toLowerCase() === "Bite_InPlace");

        const attackAnim = meleeAttackAnim ?? rangedAttackAnim;

        if (attackAnim) {
            attackAnim.start(false);
        } else {
            const anim = createSlimeAttackAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, false);
        }
    }

    /** Joue l'animation de réaction lorsqu'on prend un coup ("HitRecieve") */
    public playHitReaction(): void {
        this._stopAllAnimations();
        const hitAnim = this.animationGroups.find(a => a.name.toLowerCase() === "HitRecieve");

        if (hitAnim) {
            hitAnim.start(false);
        } else {
            console.warn("No hit animation found for slime.");
        }
    }

    /** Joue l'animation de mort ("Death") puis supprime le mesh */
    public override playDeathAnimation(): void {
        this._stopAllAnimations();
        const deathAnim = this.animationGroups.find(a => a.name.toLowerCase() === "Death");

        if (deathAnim) {
            deathAnim.onAnimationGroupEndObservable.addOnce(() => {
                this.mesh.dispose();
                this.detectionZone?.dispose();
                console.log("Slime Monster defeated.");
            });
            deathAnim.start(false);
        } else {
            const anim = createSlimeDeathAnimation(this.mesh);
            const directAnim = this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, false);
            directAnim.onAnimationEndObservable.addOnce(() => {
                this.mesh.dispose();
                this.detectionZone?.dispose();
                console.log("Slime Monster defeated.");
            });
        }

    }

    public override takeDamage(amount: number) {
        this.health -= amount;
        this.updateSlimeHealth();
        console.log(`Slime takes ${amount} damage. Remaining health: ${this.health}`);
        if (this.health <= 0) {
            this.die();
        }
    }

    /** Fait attaquer la cible si possible, avec cooldown, et joue l'animation d'attaque */
    public override async attack(): Promise<void> {
        const now = performance.now() / 1000;
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;

        if (this.target && this.target.isAlive()) {
            this.target.takeDamage(this.damage);
            console.log("The slime is attacking the player.");
            this.playAttackAnimation();
        }
    }

    /** Arrête toutes les animations actives du slime */
    private _stopAllAnimations(): void {
        this.animationGroups.forEach(anim => anim.stop());
    }

}
