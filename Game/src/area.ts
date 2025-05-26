import { Color3, Mesh, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { Monster } from "./entities/monster";
import { Player } from "./characterController";
import {SlimeMonster} from "./entities/slimeMonster";
import { Quest } from "./quest";

export class Area{
    protected _scene:Scene;
    protected _player:Player;

    public areaName:string;
    protected _areaMesh: Mesh;

    protected _areaCompleted = false;
    private _relatedQuest:Quest|null;

    protected _min:Vector3;
    protected _max:Vector3;

    protected static readonly AREA_MINIMUM_ACTIVATED_ALTITUDE = 10;
    protected static readonly MINIMAL_DISTANCE_RENDER = 500;

    

    constructor(scene:Scene, player:Player, mesh: Mesh, areaName:string, quest?:Quest){
        this._scene=scene;

        this._player = player;

        // Création d'un matériau
        const material = new StandardMaterial("material", scene);
        material.diffuseColor = new Color3(0,0,0); // rouge
        material.alpha = 0.1;

        this.areaName = areaName;
        this._areaMesh = mesh;
        this._areaMesh.material = material;
        this._areaMesh.isVisible = false;


        const bbox = this._areaMesh.getBoundingInfo().boundingBox;
        this._min = bbox.minimumWorld;
        this._max = bbox.maximumWorld;

        this._relatedQuest = quest;
    }

    protected _setAreaCompleted(){
        this.disactivateArea();
        this._areaCompleted = true;
        console.log("TERMINATED, quest : " + this._relatedQuest);
        if(this._relatedQuest) this._relatedQuest.setQuestProgression();
    }

    public setRelatedQuest(quest:Quest){
        this._relatedQuest = quest;
    }

    public activateArea(): void{
        this._areaMesh.isVisible = true;
    }

    public disactivateArea(): void{
        this._areaMesh.isVisible = false;
    }

    public get isCompleted(){
        return this._areaCompleted;
    }
}

//J'ai envisagé la possibilité qu'il peut y avoir plusieurs types de zones : pour les monstres / objets / autre...
export class MonsterArea extends Area{

    private _nbOfMonstersPerRound: {[round:number]: number} = {};
    private _stateRound = 0;
    private _lastRound:number;
    private _isAreaActive = false;

    private _currentMonsters: Monster[] = [];
    private _playerInArea:boolean = false;

    private _beforeRenderCallback: () => void;

    private _isSpawning:boolean = false;  //flag pour éviter que update soit appelé successivement pendant le spawn
    private _isResetting:boolean = false; //flag pour éviter que update soit appelé successivement pendant le reset


    constructor(scene:Scene, player:Player, mesh:Mesh, areaName:string, monstersInfo: {[round:number]: number}){
        super(scene, player, mesh, areaName);
        this._nbOfMonstersPerRound = monstersInfo;

        this._lastRound =  Math.max(...Object.keys(this._nbOfMonstersPerRound).map(Number));

    }

    private _isPlayerNear(){
        return Vector3.Distance(this._player.mesh.getAbsolutePosition(), this._areaMesh.getAbsolutePosition()) < Area.MINIMAL_DISTANCE_RENDER;
    }

    private _isPLayerOnArea(){
        const playerPos = this._player.mesh.getAbsolutePosition();
        const px = playerPos.x;
        const pz= playerPos.z;
        
        const areaPos = this._areaMesh.getAbsolutePosition();   

        return (
            px >= this._min.x && px <= this._max.x &&
            pz >= this._min.z && pz <= this._max.z
          );
    }

    private async _spawnMonsters(){
        for(let i=0; i<this._nbOfMonstersPerRound[this._stateRound]; i++){
            const x = Math.random() * (this._max.x - this._min.x) + this._min.x;
            const z = Math.random() * (this._max.z - this._min.z) + this._min.z;
            const y = this._max.y+2;   // hauteur du sommet du cube
            const monster=new Monster(this._scene, new Vector3(x,y,z),100,10, true, "Area")
            this._currentMonsters.push(monster);
            await monster.activateMonster([this._player]);
        }
        //this._scene.createOrUpdateSelectionOctree(64,2);
    }

    private _updateMonsters(){
        const newCurrentMonsters = [];
        for(const monster of this._currentMonsters){
            if(monster.state!="dead"){
                //this._currentMonsters = this._currentMonsters.filter(monster2 => monster2 != monster);
                newCurrentMonsters.push(monster);
            }
            
        }
        this._currentMonsters=newCurrentMonsters;
    }

    // Ajoute cette fonction dans ta classe :
    private _wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async _nextRoundSpawn() {
        console.log("OK => round = " + this._stateRound);
        
        await this._wait(1000);
        await this._spawnMonsters();     // spawn round this._stateRound
        this._stateRound++; 
        this._isSpawning=false;
    }

    private async _updateArea(){
        if(this._isPLayerOnArea()){
            if(this._isAreaActive) this._updateMonsters();
            console.log("nouveau round : " + this._currentMonsters);
            console.log(this._stateRound + " vs " + this._lastRound);
            if(!this._playerInArea){
                await this._spawnMonsters();
                this._playerInArea = true;
                this._isAreaActive = true;
                this._stateRound++;
            }
            else if(this._currentMonsters.length === 0 && this._stateRound <= this._lastRound){
                this._playerInArea = true;
                this._isSpawning=true;
                await this._nextRoundSpawn();
                
                
            }
            else if(this._currentMonsters.length === 0 && this._stateRound > this._lastRound){
                this._setAreaCompleted();
                this._stopUpdate();
            }
            else {
                this._playerInArea = true;
            }
            
        }
        else if(this._playerInArea) await this.resetArea();
    }

    private _stopUpdate() {
        if (this._beforeRenderCallback) {
          this._scene.unregisterBeforeRender(this._beforeRenderCallback);
          // Si vous voulez pouvoir la ré-utiliser plus tard, vous pouvez la nuller
          this._beforeRenderCallback = undefined;
        }
    }

    public activateArea(): void {
        super.activateArea();
        
        this._beforeRenderCallback = async () => {
            if (this._isPlayerNear() && !this._isSpawning && !this._isResetting) {
              await this._updateArea();
            }
          };
          // 2) l’enregistrer
          this._scene.registerBeforeRender(this._beforeRenderCallback);
    }

    public async resetArea(){
        this._isResetting=true;
        console.log("Reset de l'Area");
        for(const monster of this._currentMonsters){
            await monster.desactivateMonster();
        }
        this._currentMonsters = [];
        this._stateRound=0;
        this._playerInArea = false;
        this._isAreaActive = false;
        this._isResetting=false;
    }

}


export class AreaAsset{
    
    public static areas: {[island:string]: Area[]} = {}; 
    public static areasData: {[island:string]: {
        [areaName:string]: {monstersInfo:{[round:number]:number}}
    }} = {
        "Island1": {
            "Area1":{
                monstersInfo:{
                    0:2,
                    1:2
                }
            },
            "Area2":{
                monstersInfo:{
                    0:3,
                    1:3
                }
            },
            "Area3":{
                monstersInfo:{
                    0:5,
                    1:7,
                }
            },
            "Area4":{
                monstersInfo:{
                    0:3,
                    1:3,
                    2:4
                }
            },
            "Area5":{
                monstersInfo:{
                    0:4,
                    1:7,
                    2:9
                }
            },
            "Area6":{
                monstersInfo:{
                    0:4,
                    1:5
                }
            },
            "Area7":{
                monstersInfo:{
                    0:4,
                    1:5
                }
            },
            "Area8":{
                monstersInfo:{
                    0:3,
                    1:4
                }
            },
            "Area9":{
                monstersInfo:{
                    0:3,
                    1:4,
                }
            },
            "Area10":{
                monstersInfo:{
                    0:3,
                    1:4,
                    2:3,
                    3:4
                }
            },
            "Area11":{
                monstersInfo:{
                    0:3,
                    1:3,
                    2:4
                }
            },
            "Area12":{
                monstersInfo:{
                    0:2,
                    1:3,
                    2:3,
                    3:4
                }
            },
            "Area13":{
                monstersInfo:{
                    0:4,
                    1:4,
                    2:5,
                    3:4
                }
            },
            "Area14":{
                monstersInfo:{
                    0:4,
                    1:5,
                    2:4
                }
            },
            "Area15":{
                monstersInfo:{
                    0:2,
                    1:3,
                }
            },
            "Area16":{
                monstersInfo:{
                    0:2,
                    1:3,
                }
            },
            "Area17":{
                monstersInfo:{
                    0:2,
                    1:3,
                    2:3
                }
            },
            "Area18":{
                monstersInfo:{
                    0:2,
                    1:3,
                    2:3,
                    3:4
                }
            },
        }
    }

    public static addArea(island:string, scene:Scene, player:Player, mesh:Mesh){
        if(!this.areas[island]){
            this.areas[island] = [];
        }
        let areaMonstersInfo:{[round:number]:number}={0:1};
        if(AreaAsset.areasData[island][mesh.name]) areaMonstersInfo = AreaAsset.areasData[island][mesh.name].monstersInfo;
        
        const area = new MonsterArea(scene, player, mesh, mesh.name, areaMonstersInfo);
        this.areas[island].push(area);
    }

    // public static getArea(island: string, areaName: string): Area | undefined {
    //     return this.areas[island]?.[areaName];
    // }

    public static getIslandAreas(island:string): Area[]{
        return this.areas[island];
    }
}