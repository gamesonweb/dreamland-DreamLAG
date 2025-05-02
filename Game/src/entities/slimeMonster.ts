import {Scene, Vector3, Mesh, AnimationGroup, SceneLoader, Ray, MeshBuilder} from "@babylonjs/core";
import { Monster } from "./monster";
import {
    createSlimeIdleAnimation,
    createSlimeDeathAnimation,
    createSlimeBounceAnimation,
    createSlimeAttackAnimation
} from "./slimeAnimations";

export class SlimeMonster extends Monster {
    static DEFAULT_SLIME_HEALTH = 100;
    static DEFAULT_SLIME_DAMAGE = 15;

    public animationGroups: AnimationGroup[] = [];

    constructor(scene: Scene, position: Vector3) {
        super(scene, position, SlimeMonster.DEFAULT_SLIME_HEALTH, SlimeMonster.DEFAULT_SLIME_DAMAGE);
        this.scene = scene;

        // Supprimer le mesh par défaut (la sphère rouge)
        this.mesh.dispose();

        // Charger le modèle GLB du slime
        SceneLoader.ImportMeshAsync("", "assets/monsters/", "slime.glb", scene).then((result) => {
            const slimeMesh = result.meshes[0] as Mesh;
            slimeMesh.name = "SlimeBoss";
            slimeMesh.scaling = new Vector3(0.5, 0.5, 0.5);
            slimeMesh.scalingDeterminant = 0.04;

            // Raycast pour poser le slime sur le sol
            // if (this._isGrounded) {
            //     slimeMesh.position = this._floorRaycast(0,0,1);
            // } else {
            //     slimeMesh.position = position.clone();
            // }

            // slimeMesh.checkCollisions = true;
            // slimeMesh.ellipsoid = new Vector3(1.5, 1.5, 1.5);
            // slimeMesh.ellipsoidOffset = new Vector3(0, 1.5, 0);
            slimeMesh.metadata = {
                isMonster: true,
                monsterInstance: this
            };

            this.mesh = slimeMesh;
            //this.mesh.position = position.clone();
            this.animationGroups = result.animationGroups;

            // Crée une détection propre à la position réelle
            // this.detectionZone = MeshBuilder.CreateSphere("detectionZone", { diameter: 2 }, scene);
            // this.detectionZone.isVisible = false;
            // this.detectionZone.position = this.mesh.getAbsolutePosition().clone();

            this.playIdleAnimation();
        });
    }


    public playIdleAnimation(): void {
        const idleAnim = this.animationGroups.find(a => a.name.toLowerCase().includes("idle"));

        if (idleAnim) {
            idleAnim.start(true);
        } else {
            const anim = createSlimeIdleAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, true);
        }
    }

    public override playMoveAnimation(): void {
        const moveAnim = this.animationGroups.find(a => a.name.toLowerCase().includes("walk") || a.name.toLowerCase().includes("jump"));

        if (moveAnim) {
            moveAnim.start(true);
        } else {
            const anim = createSlimeBounceAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 20, false);
        }
    }

    public override playAttackAnimation(): void {
        const attackAnim = this.animationGroups.find(a => a.name.toLowerCase().includes("attack"));

        if (attackAnim) {
            attackAnim.start(false);
        } else {
            const anim = createSlimeAttackAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], this.mesh.position.y + 20, this.mesh.position.y + 20, false);
        }
    }

    public override playDeathAnimation(): void {
        const deathAnim = this.animationGroups.find(a => a.name.toLowerCase().includes("death"));

        if (deathAnim) {
            deathAnim.start(false);
        } else {
            const anim = createSlimeDeathAnimation(this.mesh);
            this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, false);
        }

        setTimeout(() => {
            this.mesh.dispose();
            this.detectionZone.dispose();
            console.log("Slime Boss defeated.");
        }, 1000);
    }
}
