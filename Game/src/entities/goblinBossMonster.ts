import { Scene, Vector3, Mesh, StandardMaterial, Color3, Animation, Bone } from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Monster } from "./monster";
import { Player } from "../characterController";
import { createAttackAnimation, createDeathAnimation, createMoveAnimation, createRightArmAttackAnimation } from "./animation";

export class GoblinBossMonster extends Monster {
    static DEFAULT_BOSS_HEALTH = 200;
    static DEFAULT_BOSS_DAMAGE = 25;

    private bossZoneCenter: Vector3;
    private bossZoneRadius: number = 30;
    override attackCooldown = 2;

    constructor(scene: Scene, position: Vector3) {
        super(scene, position, GoblinBossMonster.DEFAULT_BOSS_HEALTH, GoblinBossMonster.DEFAULT_BOSS_DAMAGE);
        this.scene = scene;
        this.bossZoneCenter = position.clone();

        // Supprime le mesh de base
        this.mesh.dispose();

        // Charge le modèle GLB
        SceneLoader.ImportMeshAsync("", "./assets/models/monsters/", "goblin_boss.glb", scene).then((result) => {
            const goblinMesh = result.meshes[0] as Mesh;
            goblinMesh.name = "GoblinBoss";
            goblinMesh.position = this.bossZoneCenter.clone();
            goblinMesh.scaling = new Vector3(2, 2, 2);

            goblinMesh.checkCollisions = true;
            goblinMesh.ellipsoid = new Vector3(1, 1.5, 1);
            goblinMesh.ellipsoidOffset = new Vector3(0, 1.5, 0);
            goblinMesh.metadata = {
                isMonster: true,
                monsterInstance: this
            };

            const mat = new StandardMaterial("GoblinBossMat", scene);
            mat.diffuseColor = new Color3(0.3, 0.8, 0.3);
            goblinMesh.material = mat;

            this.mesh = goblinMesh;
        });
    }

    // Fonction pour obtenir la massue et le bras droit dans le modèle du Goblin Boss
    private getWeaponAndRightArm(): { weapon: Mesh | null, rightArmBone: Bone | null } {
        let weapon = null;
        let rightArmBone = null;

        // Chercher la massue dans les meshes
        this.mesh.getChildMeshes().forEach(child => {
            if (child.name.toLowerCase().includes("mace") || child.name.toLowerCase().includes("massue")) {
                weapon = child;
            }
        });

        // Chercher le bone du bras droit
        const skeleton = this.mesh.skeleton;
        if (skeleton) {
            rightArmBone = skeleton.bones.find(b => b.name.toLowerCase().includes("rightarm") || b.name.toLowerCase().includes("r_arm"));
        }

        return { weapon, rightArmBone };
    }

    // Override du comportement d'update spécifique au boss
    // public override async update(players: Player[]): Promise<void> {
    //     if (!this.isAlive()) {
    //         this.state = "dead";
    //         return;
    //     }

    //     const now = performance.now() / 1000;
    //     this._moveDirection = Vector3.Zero();
    //     this.target = null;

    //     // Trouver une cible dans la zone du boss
    //     for (const player of players) {
    //         const dist = Vector3.Distance(this.bossZoneCenter, player.mesh.position);
    //         if (dist <= this.bossZoneRadius && player.isAlive()) {
    //             this.target = player;
    //             break;
    //         }
    //     }

    //     if (this.target) {
    //         const distToTarget = Vector3.Distance(this.mesh.position, this.target.mesh.position);

    //         if (distToTarget > 3) {
    //             this.state = "pursuing";
    //             this.moveTowardTarget();
    //             if (this._grounded) this.playMoveAnimation();
    //         } else {
    //             this.state = "attacking";
    //             this.attack();
    //         }
    //     } else {
    //         this.state = "idle";
    //     }
    // }

    // public override moveTowardTarget(): void {
    //     if (!this.target) return;
    //     const direction = this.target.mesh.position.subtract(this.mesh.position).normalize();
    //     const moveSpeed = 0.12; // légèrement plus rapide qu’un monstre basique
    //     this._moveDirection = direction.scale(moveSpeed);
    // }

    public override attack(){
        const now = performance.now() / 1000;
        if (now - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = now;

        if (this.target && this.target.isAlive()) {
            this.target.takeDamage(this.damage);
            this.playAttackAnimation();
            console.log("Goblin Boss attacks!");
        }
    }

    public override playAttackAnimation(): void {
        const { weapon, rightArmBone } = this.getWeaponAndRightArm();

        // Si la massue est trouvée
        if (weapon) {
            // Animer la massue (rotation autour de l'axe Y pour simuler un coup de massue)
            const anim = new Animation("maceSwing", "rotation.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            anim.setKeys([
                { frame: 0, value: 0 },
                { frame: 10, value: Math.PI / 2 },  // Rotation de 90° pour simuler un swing
                { frame: 20, value: Math.PI },
            ]);
            this.scene.beginDirectAnimation(weapon, [anim], 0, 20, false);
        } else if (rightArmBone) {
            // Si la massue n'existe pas, animer le bras droit
            const anim = createRightArmAttackAnimation(rightArmBone);
            this.scene.beginDirectAnimation(rightArmBone, [anim], 0, 10, false);
        } else {
            console.warn("Aucun bras droit ou massue trouvée pour l'animation.");
        }
    }

    public override playMoveAnimation(){
        const anim = createMoveAnimation(this.mesh);
        this.scene.beginDirectAnimation(this.mesh, [anim], 0, 40, true); // Bouge le gobelin pendant qu'il se déplace
    }

    public override playDeathAnimation(): void {
        const anim = createDeathAnimation(this.mesh);
        this.scene.beginDirectAnimation(this.mesh, [anim], 0, 30, false);
        setTimeout(() => {
            this.mesh.dispose();
            this.detectionZone.dispose();
            console.log("Goblin Boss defeated.");
        }, 1000);
    }
}
