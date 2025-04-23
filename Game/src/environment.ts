import { AbstractMesh, Mesh, MeshBuilder, ParseNullTerminatedString, Scene, SceneLoader, Vector3 } from "@babylonjs/core";


export class Environment {
    private _scene: Scene;
    private _islandMesh: AbstractMesh;
    public island: Mesh;

    constructor(scene: Scene) {
        this._scene = scene;
        this._islandMesh = null;
    }

    public async load() {
        var ground = MeshBuilder.CreateBox("ground", { size: 24 }, this._scene);
        ground.scaling = new Vector3(1,.02,1);
    }

    public async loadIsland() {


        SceneLoader.ImportMeshAsync("", "assets/models/Islands/Island1/", "FirstIsland.gltf", this._scene)//.then((result) => {

        //     const geoMeshes = result.meshes.filter(m =>
        //         m instanceof Mesh &&
        //         m.geometry !== null &&          // a geometry
        //         m.subMeshes !== undefined &&     // a subMeshes array
        //         m.subMeshes.length > 0           // non vide
        //     ) as Mesh[];

        //     geoMeshes.forEach(abstractMesh => {
        //         console.log("Subdivision Of Island");
        //         const mesh = abstractMesh as Mesh;

        //         mesh.refreshBoundingInfo();
        //         mesh.alwaysSelectAsActiveMesh = true;
        //         mesh.doNotSyncBoundingInfo = true;
        //         // const indices = mesh.getIndices()!;
        //         // const totalTris = indices.length / 3;                            
        //         // const trisPerSubMesh = 7000;  
        //         // const subCount = Math.ceil(totalTris / trisPerSubMesh);
        //         //console.log(subCount)

        //         mesh.subdivide(60);
        //         mesh.createOrUpdateSubmeshesOctree(100, 32);

        //         mesh.computeWorldMatrix(true);            // s’assure que les transforms sont appliqués :contentReference[oaicite:3]{index=3}
        //         mesh.refreshBoundingInfo();               // recalcul des boîtes englobantes :contentReference[oaicite:4]{index=4}

        //         // 7️⃣ (Optionnel) Forcer le mesh à toujours être rendu si besoin
        //         mesh.alwaysSelectAsActiveMesh = true;
        //         mesh.doNotSyncBoundingInfo = true;

        //         this._scene.getEngine().setDepthBuffer(true);
        //         this._scene.getEngine().setDepthFunctionToLess(); // ou try setDepthFunctionToLEqual();


        //     })
        // });
        // const importedMeshes = (await islandResult).meshes;

        // importedMeshes.forEach(mesh => {
        //     //const mesh2 = mesh as Mesh;
        //     if(mesh instanceof Mesh){
        //         mesh.createBVH();
        //     }
            
        // })
        // (await islandResult).meshes.forEach(mesh => {
        //     if(mesh instance of Mesh){
        //         var mesh2 = mesh as Mesh;
        //         mesh2.subdivide(10);
        //         mesh2.createOrUpdateSubmeshesOctree(10, 64)
        //     }
            

        // })
    }
}