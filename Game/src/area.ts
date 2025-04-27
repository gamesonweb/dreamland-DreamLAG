import { Mesh, Scene, Vector3 } from "@babylonjs/core";
import { Monster } from "./entities/monster";
import { Player } from "./characterController";

export class Area{
    protected _scene:Scene;
    protected _player:Player;

    public areaName:string;
    protected _areaMesh: Mesh;

    protected _areaCompleted = false;

    protected _min:Vector3;
    protected _max:Vector3;

    protected static readonly AREA_MINIMUM_ACTIVATED_ALTITUDE = 10;
    protected static readonly MINIMAL_DISTANCE_RENDER = 50;

    constructor(scene:Scene, player:Player, mesh: Mesh, areaName:string){
        this._scene=scene;

        this._player = player;

        this.areaName = areaName;
        this._areaMesh = mesh;
        this._areaMesh.isVisible = false;


        const bbox = this._areaMesh.getBoundingInfo().boundingBox;
        this._min = bbox.minimumWorld;
        this._max = bbox.maximumWorld;
    }

    public activateArea(): void{
        this._areaMesh.isVisible = true;
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
            const y = this._max.y;   // hauteur du sommet du cube
            const monster=new Monster(this._scene, new Vector3(x,y,z), 100, 10)
            this._currentMonsters.push(monster);
            monster.activateMonster([this._player]);
        }
    }

    private _updateMonsters(){
        for(const monster of this._currentMonsters){
            if(monster.state=="dead"){
                this._currentMonsters = this._currentMonsters.filter(monster2 => monster2 != monster);
            }
        }
    }

    // Ajoute cette fonction dans ta classe :
    private _wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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

                await this._wait(5000);

                await this._spawnMonsters();
                this._stateRound++;
                
            }
            else if(this._currentMonsters.length === 0 && this._stateRound > this._lastRound){
                this._areaCompleted = true;
            }
            else {
                this._playerInArea = true;
            }
            
        }
        else this.resetArea();
    }

    private _renderBeforeUpdate(){
        this._scene.registerBeforeRender(async() => {
            if(this._isPlayerNear()){
                await this._updateArea();
            }
        })
    }

    public activateArea(): void {
        super.activateArea();
        this._renderBeforeUpdate();
    }

    public resetArea(){
        for(const monster of this._currentMonsters){
            monster.mesh.dispose();
        }
        this._currentMonsters = [];
        this._stateRound=0;
        this._playerInArea = false;
        this._isAreaActive = false;
    }

}


export class AreaAsset{
    
    public static areas: {[island:string]: Area[]} = {}; 

    public static addArea(island:string, area:Area){
        if(!this.areas[island]){
            this.areas[island] = [];
        }
        this.areas[island].push(area);
    }

    // public static getArea(island: string, areaName: string): Area | undefined {
    //     return this.areas[island]?.[areaName];
    // }

    public static getIslandAreas(island:string): Area[]{
        return this.areas[island];
    }
}