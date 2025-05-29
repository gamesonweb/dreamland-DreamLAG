// Don't care of this file

import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders";

import { Monster } from "./monster";
import { Player } from "../characterController";
import {App} from "../app";

const createDefaultEngine = (canvas: HTMLCanvasElement): BABYLON.Engine => {
    return new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false
    });
};

const startRenderLoop = (engine: BABYLON.Engine, sceneToRender: BABYLON.Scene): void => {
    engine.runRenderLoop(() => {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
};

export class Playground {
    private static _canvas: HTMLCanvasElement;
    static createScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        Playground._canvas = canvas;
        const scene = new BABYLON.Scene(engine);
        
        // Sol pour que le joueur puisse "toucher" le sol
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
        ground.isPickable = true;

        // Générateur d’ombres
        const shadowGenerator = new BABYLON.ShadowGenerator(1024, new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene));

        // Mock asset du joueur (à remplacer par des assets chargés dynamiquement)
        const playerMesh = BABYLON.MeshBuilder.CreateBox("playerMesh", { size: 2 }, scene);
        playerMesh.position.y = 1;

        const mockAssets = { mesh: playerMesh };

        // Input fictif
        const input = {
            horizontal: 0,
            vertical: 0,
            horizontalAxis: 0,
            verticalAxis: 1,
            jumpKeyDown: false,
            dashing: false
        };

        const player = new Player(new App(), mockAssets, scene, new BABYLON.Vector3(0, 0, 0), shadowGenerator, input);
        player.health = 100;
        player.activatePlayerCamera();

        // Création des monstres
        const monsters: Monster[] = [
            new Monster(scene, new BABYLON.Vector3(5, 0, 0), 50, 10,false),
            new Monster(scene, new BABYLON.Vector3(-5, 0, 0), 60, 12,false)
        ];

        // Update général
        scene.onBeforeRenderObservable.add(() => {
            monsters.forEach(monster => monster.update([player]));
        });

        return scene;
    }
}

// Bootstrap
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas not found!");

let engine: BABYLON.Engine | null = null;
let scene: BABYLON.Scene | null = null;
let sceneToRender: BABYLON.Scene | null = null;

const createScene = (): BABYLON.Scene => {
    return Playground.createScene(engine!, canvas);
};

const initFunction = async (): Promise<void> => {
    try {
        engine = createDefaultEngine(canvas);
    } catch (e) {
        console.error("Failed to create engine. Retrying...", e);
        engine = createDefaultEngine(canvas);
    }

    if (!engine) throw new Error("Engine should not be null.");

    scene = createScene();
    sceneToRender = scene;

    startRenderLoop(engine, sceneToRender);
};

initFunction().then(r => console.log("Initializing...", r));

window.addEventListener("resize", () => {
    engine?.resize();
});
