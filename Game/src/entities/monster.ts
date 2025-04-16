import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { createMoveAnimation, createAttackAnimation, createDeathAnimation } from "./animation";
import { Player } from "../characterController";

// Classe Monster qui représente un ennemi basique dans le jeu
export class Monster {
    scene: BABYLON.Scene;
    health: number;
    damage: number;
    state: "idle" | "pursuing" | "attacking" | "dead"; // États possibles du monstre
    target: Player | null;
    lastAttackTime: number; // Dernier moment où le monstre a attaqué
    attackCooldown: number; // Temps entre deux attaques
    mesh: BABYLON.Mesh; // Mesh du monstre
    detectionZone: BABYLON.Mesh; // Zone de détection autour du monstre

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, health: number, damage: number) {
        this.scene = scene;
        this.health = health;
        this.damage = damage;
        this.state = "idle";
        this.target = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 2; // secondes

        // Création du corps du monstre
        this.mesh = BABYLON.MeshBuilder.CreateSphere("monster", { diameter: 3 }, scene);
        this.mesh.position = position.clone();
        const material = new BABYLON.StandardMaterial("monsterMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Rouge
        this.mesh.material = material;

        // Zone invisible utilisée pour détecter le joueur
        this.detectionZone = BABYLON.MeshBuilder.CreateSphere("detectionZone", { diameter: 20 }, scene);
        this.detectionZone.isVisible = false;
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
    update(targets: Player[]): void {
        if (!this.isAlive()) {
            this.state = "dead";
            return;
        }

        // Réinitialise l'état et la cible
        this.state = "idle";
        this.target = null;

        // Recherche d'un joueur dans la portée
        for (const t of targets) {
            const distance = BABYLON.Vector3.Distance(this.mesh.position, t.mesh.position);
            if (distance <= 15 && t.isAlive()) {
                this.target = t;
                break;
            }
        }

        if (this.target) {
            const dist = BABYLON.Vector3.Distance(this.mesh.position, this.target.mesh.position);
            if (dist > 1) {
                this.state = "pursuing";
                this.moveTowardTarget();
                this.playMoveAnimation();
            } else {
                this.state = "attacking";
                this.attack();
            }
        }
    }

    /**
     * Fait avancer le monstre vers la cible.
     */
    moveTowardTarget(): void {
        if (!this.target) return;
        const direction = this.target.mesh.position.subtract(this.mesh.position).normalize();
        const moveSpeed = 0.1;
        this.mesh.moveWithCollisions(direction.scale(moveSpeed));
    }

    /**
     * Fait attaquer le monstre s’il peut.
     */
    attack(): void {
        const now = performance.now() / 1000; // en secondes
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;

        if (this.target && this.target.isAlive()) {
            this.target.takeDamage(this.damage);
            this.playAttackAnimation();
        }
    }

    /**
     * Animation de déplacement.
     */
    playMoveAnimation(): void {
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
            this.detectionZone.dispose();
            console.log("Monster is dead.");
        }, 1000); // délai pour laisser l’animation jouer
    }
}
