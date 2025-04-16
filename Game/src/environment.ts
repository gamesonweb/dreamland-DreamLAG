import { Mesh, MeshBuilder, ParseNullTerminatedString, Scene, SceneLoader, Vector3 } from "@babylonjs/core";

export class Environment {
    private _scene: Scene;
    public island: Mesh;

    constructor(scene: Scene) {
        this._scene = scene;
    }

    public async load() {
        var ground = MeshBuilder.CreateBox("ground", { size: 24 }, this._scene);
        ground.scaling = new Vector3(1,.02,1);
    }

    public async loadIsland() {
        var islandResult = SceneLoader.ImportMeshAsync("", "assets/models/Islands/Island1/", "FirstIsland.gltf", this._scene);
    }
}