import { Scene, Vector3, Mesh, AnimationGroup, SceneLoader, MeshBuilder } from "@babylonjs/core";
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

    public animationGroups: AnimationGroup[] = [];

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

            this.isReady = true;
            this.playIdleAnimation();
        });
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
    public override playMoveAnimation(): void {
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
            deathAnim.start(false);
        } else {
            const anim = createSlimeDeathAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, false);
        }

        deathAnim.onAnimationGroupEndObservable.addOnce(() => {
            this.mesh.dispose();
            this.detectionZone?.dispose();
            console.log("Slime Boss defeated.");
        });
        deathAnim.start(false);
    }

    /** Déplace le slime vers la cible s'il y en a une, et joue l'animation de déplacement */
    public override moveTowardTarget(): void {
        if (!this.target || !this.target.isAlive()) return;

        const targetPos = this.target.mesh.getAbsolutePosition();
        const slimePos = this.mesh.position;
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


    /** Fait attaquer la cible si possible, avec cooldown, et joue l'animation d'attaque */
    public override attack(): void {
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
