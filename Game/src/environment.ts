import { AbstractMesh, Mesh, MeshBuilder, ParseNullTerminatedString, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { QuestCharacter } from "./questCharacter";
import { Player } from "./characterController";
import { Area, AreaAsset, MonsterArea } from "./area";
import { Quest } from "./questMenu";
import { MemoryPiece } from "./memory";


export class Environment {
    private _scene: Scene;
    private _player:Player;

    private _islandMesh: AbstractMesh;
    public island: Mesh;
    public questCharacter: QuestCharacter;

    constructor(scene: Scene, player:Player) {
        this._scene = scene;

        this._player = player;

        this._islandMesh = null;
    }

    public async load() {
        var ground = MeshBuilder.CreateBox("ground", { size: 24 }, this._scene);
        ground.scaling = new Vector3(1,.02,1);
    }

    public async loadIsland() {


        SceneLoader.ImportMeshAsync("", "assets/models/Islands/Island1/", "FirstIsland.gltf", this._scene).then((result) => {

            const geoMeshes = result.meshes.filter(m =>
                m instanceof Mesh &&
                m.geometry !== null &&          // a geometry
                m.subMeshes !== undefined &&     // a subMeshes array
                m.subMeshes.length > 0           // non vide
            ) as Mesh[];

            let questCharacterMesh:Mesh = null;

            geoMeshes.forEach((mesh) => {
                if(mesh.name === "QuestCharacter"){
                    console.log("character Found!!");
                    questCharacterMesh = mesh;
                    // this.questCharacter = new QuestCharacter(mesh, this._scene, player);
                    // this.questCharacter.activateCharacter();
                }

                if(mesh.name.includes("Area")){
                    AreaAsset.addArea("Island1", new MonsterArea(this._scene, this._player, mesh, mesh.name, {0:1}));
                } 
            })   
            let questsIslands1 = [];
            let i=0;
            for(const area of AreaAsset.getIslandAreas("Island1")){
                const pieceNumber = i+5
                questsIslands1.push(new Quest("Quest" + i, new MemoryPiece("piece"+pieceNumber, "memo1", "assets/images/Puzzle1"), [area]));
                i++;
            }

            this.questCharacter = new QuestCharacter(questCharacterMesh, this._scene, this._player, questsIslands1);
            this.questCharacter.activateCharacter();

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
            

        })
    }
}