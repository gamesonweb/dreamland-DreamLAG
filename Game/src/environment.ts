import { AbstractMesh, Color3, CubeTexture, InstancedMesh, Mesh, MeshBuilder, ParseNullTerminatedString, PhotoDome, ReflectionProbe, Scene, SceneLoader, ShadowGenerator, StandardMaterial, Texture, Vector2, Vector3 } from "@babylonjs/core";
import { QuestCharacter } from "./questCharacter";
import { Player } from "./characterController";
import { Area, AreaAsset, MonsterArea } from "./area";
import { MemoryPiece } from "./memory";
import { WaterMaterial } from "@babylonjs/materials";
import { GoblinBossMonster } from "./entities/goblinBossMonster";
import { QuestAsset } from "./quest";




export class Environment {
    private _scene: Scene;
    private _player:Player;

    private _islandMesh: AbstractMesh;
    public island: Mesh;
    public questCharacter: QuestCharacter;

    private _finalBoss:GoblinBossMonster;

    constructor(scene: Scene, player:Player) {
        this._scene = scene;

        this._player = player;

        this._islandMesh = null;
    }

    public async load() {
        var ground = MeshBuilder.CreateBox("ground", { size: 24 }, this._scene);
        ground.scaling = new Vector3(1,.02,1);
    }

    public async loadIsland(shadowGenerator?:ShadowGenerator) {


        await SceneLoader.ImportMeshAsync("", "assets/models/Islands/Island1/", "FirstIsland.gltf", this._scene).then(async (result) => {

            const photoDome = new PhotoDome(
                "dreamDome",
                "assets/images/skies/day1.png",  // votre PNG equirectangular
                { resolution: 32, size: 2000 },
                this._scene
              );

              this._scene.onBeforeRenderObservable.add(() => {
                photoDome.position = this._scene.cameras[0].position; // Assurer que la position du dôme suit celle de la caméra
            });

            // const domeMesh = photoDome.mesh; 
            // const probe = new ReflectionProbe("probe", 512, this._scene);
            // probe.renderList.push(domeMesh); // PhotoDome étend Mesh



            const geoMeshes = result.meshes.filter(m =>
                m instanceof Mesh &&
                m.geometry !== null //&&          // a geometry
            ) as Mesh[];

            let questCharacterHolder:Mesh = null;
            const masterTrees: { [key: string]: Mesh } = {}; // Objet pour stocker les maîtres par type
            //const treeInstances: { [key: string]: { root: InstancedMesh; leaves: InstancedMesh[] }[] } = {};
            const treeInstances: { [key: string]: InstancedMesh[] } = {};


            geoMeshes.forEach(async (mesh) => {
                mesh.checkCollisions = true;

                if(shadowGenerator) shadowGenerator.addShadowCaster(mesh);

                if(mesh.name === "QuestCharacter"){
                    questCharacterHolder = mesh;
                }

                if ((mesh.name.includes("Arbre")|| mesh.name.includes("House")) && mesh.getChildren().length > 0 && mesh.getChildren()[0].name === "Plane") {
                    const treeType = mesh.name.substring(0, 6);
        
                    if (!masterTrees[treeType]) {
                        masterTrees[treeType] = mesh;
                        treeInstances[treeType] = [];
                    } else if (masterTrees[treeType] !== mesh) {
                        const treeInstance = masterTrees[treeType].createInstance(mesh.name + "_instance");
                        treeInstance.position = mesh.position.clone();
                        treeInstance.rotation = mesh.rotation.clone();
                        treeInstance.scaling = mesh.scaling.clone();
                        treeInstance.isPickable = false;
                        treeInstances[treeType].push(treeInstance);
                        this._scene.selectionOctree.dynamicContent.push(treeInstance);
                        mesh.dispose();
                    }
                }      

                if(mesh.name.includes("Arbre")) mesh.isPickable = false;

                if(mesh.name.includes("Area")){
                    mesh.checkCollisions = false;
                    AreaAsset.addArea("Island1", this._scene, this._player, mesh);
                } 

                if(mesh.name.includes("Puzzle")){
                    const pieceName = mesh.name.substring(8, mesh.name.length);
                    new MemoryPiece(pieceName, "memo1", "assets/images/Puzzle1/"+pieceName+".png", mesh, this._scene, this._player);
                }

                if(mesh.name === "FinalBoss"){
                    const boss = new GoblinBossMonster(this._scene, mesh.getAbsolutePosition());
                    // boss.mesh.scaling = new Vector3(0.007,0.007,0.007);
                    console.log("bossMesh scaling = " + boss.mesh.scaling);
                    mesh.dispose();
                    boss.activateMonster([this._player]);
                    this._finalBoss = boss;
                }

                // if(mesh.name.includes("terrain")){
                //     mesh.subdivide(4);
                //     mesh.createOrUpdateSubmeshesOctree(16, 8);
                // }

                if(mesh.name === "WaterMesh"){
                    mesh.checkCollisions = false;
                    const waterMaterial = new WaterMaterial("waterMat", this._scene);
                    waterMaterial.bumpTexture = new Texture("assets/models/Islands/Island1/WaterTexture.png", this._scene);
                    waterMaterial.bumpHeight  = 0.5; // Intensité du relief

                    waterMaterial.windForce          = 1;               // Force du vent
                    waterMaterial.waveHeight         = 0.1;              // Hauteur des vagues
                    waterMaterial.waveLength         = 0.1;              // Longueur d’onde
                    waterMaterial.windDirection      = new Vector2(1, 1);  
                    waterMaterial.colorBlendFactor   = 0.3;              // Mélange couleur eau vs reflet
                    waterMaterial.waterColor         = new Color3(0.0, 0.3, 0.6);  

                    waterMaterial.alpha           = 0.7;
                    waterMaterial.colorBlendFactor = 0.2;

                    waterMaterial.addToRenderList(photoDome.mesh); // PhotoDome est un Mesh
                    
                    mesh.material = waterMaterial;

                    mesh.isPickable=false; //Pour le rayCast
                    


                }
                
            })   
            let questsIslands1 = [];
            
            if (!questCharacterHolder) {
                console.error("No QuestCharacter placeholder found!");
                return;
              }
            else{
                const wizardResult = await SceneLoader.ImportMeshAsync(
                    "", "assets/models/characters/", "Wizard.gltf", this._scene
                  );
                  const wizard = wizardResult.meshes[0] as Mesh;
                  
                  // Position & dispose placeholder
                  wizard.setAbsolutePosition(questCharacterHolder.getAbsolutePosition());
                  wizard.scaling = new Vector3(0.7,0.7,0.7) //questCharacterHolder.scaling.clone();
                  wizard.rotation = new Vector3(0, 3*Math.PI/2, 0); 
                  questCharacterHolder.dispose();

                  QuestAsset.createQuests(AreaAsset.getIslandAreas("Island1"));
                  questsIslands1 = QuestAsset.quests;
                  
                  // Now you can safely create and activate your QuestCharacter
                  this.questCharacter = new QuestCharacter(wizard, this._scene, this._player, questsIslands1);
                  this.questCharacter.activateCharacter();
            }


        })
    }

    public get finalBoss(){
        return this._finalBoss;
    }
}