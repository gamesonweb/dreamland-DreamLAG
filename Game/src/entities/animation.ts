import * as BABYLON from "@babylonjs/core/Legacy/legacy";
/**
 * Fonction utilitaire pour créer une animation Babylon.js.
 */
export const createAnimation = (
    name: string,
    property: string,
    frameRate: number,
    animationType: number,
    loopMode: number,
    keyFrames: BABYLON.IAnimationKey[]
): BABYLON.Animation => {
    const animation = new BABYLON.Animation(name, property, frameRate, animationType, loopMode);
    animation.setKeys(keyFrames);
    return animation;
};

export const createMoveAnimation = (mesh: BABYLON.Mesh): BABYLON.Animation => {
    const keyFrames = [
        { frame: 0, value: mesh.position.y },
        { frame: 20, value: mesh.position.y + 0.5 },
        { frame: 40, value: mesh.position.y }
    ];
    return createAnimation("moveAnim", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE, keyFrames);
};

export const createAttackAnimation = (mesh: BABYLON.Mesh): BABYLON.Animation => {
    const keyFrames = [
        { frame: 0, value: mesh.rotation.y },
        { frame: 10, value: mesh.rotation.y + Math.PI / 4 },
        { frame: 20, value: mesh.rotation.y }
    ];
    return createAnimation("attackAnim", "rotation.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE, keyFrames);
};

export const createDeathAnimation = (mesh: BABYLON.Mesh): BABYLON.Animation => {
    const keyFrames = [
        { frame: 0, value: mesh.scaling.x },
        { frame: 30, value: 0 }
    ];
    return createAnimation("deathAnim", "scaling.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, keyFrames);
};