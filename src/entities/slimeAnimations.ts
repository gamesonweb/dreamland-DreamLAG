import { Animation, Mesh, Vector3 } from "@babylonjs/core";

// Animation personnalisée de bond du slime
export function createSlimeBounceAnimation(mesh: Mesh): Animation {
    const bounceAnim = new Animation(
        "slimeBounce",
        "position.y",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [
        { frame: 0, value: mesh.position.y },
        { frame: 10, value: mesh.position.y + 0.5 },
        { frame: 20, value: mesh.position.y }
    ];

    bounceAnim.setKeys(keys);
    return bounceAnim;
}

// Animation d'attaque : rotation rapide
export function createSlimeAttackAnimation(mesh: Mesh): Animation {
    const rotateAnim = new Animation(
        "slimeAttack",
        "rotation.y",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const startRot = mesh.rotation.y;
    rotateAnim.setKeys([
        { frame: 0, value: startRot },
        { frame: 10, value: startRot + Math.PI },
        { frame: 20, value: startRot }
    ]);

    return rotateAnim;
}

// Animation de mort : aplatissement
export function createSlimeDeathAnimation(mesh: Mesh): Animation {
    const squashAnim = new Animation(
        "slimeDeath",
        "scaling.y",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    squashAnim.setKeys([
        { frame: 0, value: mesh.scaling.y },
        { frame: 10, value: mesh.scaling.y * 0.2 },
        { frame: 30, value: 0 }
    ]);

    return squashAnim;
}

export function createSlimeIdleAnimation(mesh: Mesh): Animation {
    const idleAnim = new Animation(
        "slimeIdle",
        "scaling.y",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
    );

    idleAnim.setKeys([
        { frame: 0, value: 1 },
        { frame: 15, value: 1.05 },
        { frame: 30, value: 1 }
    ]);

    return idleAnim;
}
