import { Observable } from "@babylonjs/core";
import { Area } from "./area";
import { Player } from "./characterController";
import { MemoryPiece } from "./memory";
import { Monster } from "./entities/monster";
import { GoblinBossMonster } from "./entities/goblinBossMonster";

export class Quest {
    public title:string
    private _description:string = null;

    private _questAccepted:boolean=false;
    private _isCompleted:boolean=false;
    private _isRewardClaimed:boolean = false;

    private _reward:MemoryPiece=null;
    public onStateChange = new Observable<Quest>();

    private _involvedAreas:Area[]|null=[];
    private _involvedBossMonster:GoblinBossMonster|null;
    private _player:Player|null;

    constructor(title: string, reward: MemoryPiece, description?:string, areas?:Area[], involvedBossMonster?:GoblinBossMonster, player?:Player) {
        this.title = title;
        if(description) this._description=description;

        this._reward = reward;

        this._involvedAreas = areas;
        this._involvedBossMonster=involvedBossMonster;
        if(this._involvedBossMonster){
            this._involvedBossMonster.onDeathObservable.add(() => this.setQuestProgression());
        } 
        //this._involvedBossMonster.is
        this._player = player;

        this._linkToAreas();

        
    } // Pour l'instant, juste un titre

    private _linkToAreas(){
        for(const area of this._involvedAreas){
            area.setRelatedQuest(this);
        }
    }

    public acceptQuest(){
        this._questAccepted=true;
        this.onStateChange.notifyObservers(this);
        if(this._involvedAreas){
            for(const area of this._involvedAreas){
                area.activateArea();
            }
        }
        console.log(this._involvedBossMonster);
        if(this._involvedBossMonster) this._involvedBossMonster.activateMonster([this._player]);
    }
    

    public setQuestProgression(){
        const nbAreas = this._involvedAreas.length;
        let nbCompletedAreas = 0;
        for(const area of this._involvedAreas){
            if(area.isCompleted) nbCompletedAreas++;
        }
        if(nbCompletedAreas === nbAreas){
            if(this._involvedBossMonster){
                if(!this._involvedBossMonster.isAlive()){
                    this._isCompleted = true;
                    this.onStateChange.notifyObservers(this);
                }
            }   
            else{
                this._isCompleted = true;
                this.onStateChange.notifyObservers(this);
            } 
        }
        
    }

    public claimReward(player:Player) {
        player.claimReward(this._reward);
        this._isRewardClaimed = true;
        this.onStateChange.notifyObservers(this);
    }

    public get description(){
        return this._description;
    }

    
    public get isAccepted() {
        return this._questAccepted;
    }

    public get isCompleted() { 
        return this._isCompleted; 
    }

    public get isRewardClaimed() { 
        return this._isRewardClaimed;
    }

}

export class QuestAsset{
    public static questsDatas: {[questName:string]: {areasNames:String[], puzzleName:String, description?:String, pieceAwardName:string; boss?:boolean}} = 
    {
        "Quest1" : {
            areasNames:["Area1"],
            puzzleName:"Puzzle1",
            description:"Le sorcier te demande d'éliminer les monstres qui se trouvent dans la zone en face du village.",
            pieceAwardName:"piece7"
            
        },
        "Quest2" : {
            areasNames:["Area2"],
            puzzleName:"Puzzle1",
            description:"Le sorcier te demande d'éliminer les monstres qui se trouvent dans la zone juste en face de lui.",
            pieceAwardName:"piece4"
        },
        "Quest3": {
            areasNames:["Area3"],
            puzzleName:"Puzzle1",
            description:"Des monstres semblent perturber la population locale à côté du lac. Élimine-les !",
            pieceAwardName:"piece2"
        },
        "Quest4": {
            areasNames:["Area4"],
            puzzleName:"Puzzle1",
            description:"Un fermier semble être perturbé au sud de l'île. Le sorcier te demande de l'aider.",
            pieceAwardName:"piece16"
        },
        "Quest5":{
            areasNames:["Area5"],
            puzzleName:"Puzzle1",
            description:"Des monstres sont apparus au port de l'île. Le sorcier ne pouvant être présent compte sur toi pour te débarasser de ces cauchemars.",
            pieceAwardName:"piece24"
        },
        "Quest6":{
            areasNames:["Area6", "Area7"],
            puzzleName:"Puzzle1",
            description:"La petite forêt au sud du village semble être en ce moment perturbé. La source semble par ailleurs provenir aux abords de l'île à l'issue de la forêt.",
            pieceAwardName:"piece11"
        },
        "Quest7":{
            areasNames:["Area8", "Area9", "Area10"],
            puzzleName:"Puzzle1",
            description:"Les habitants de l'île ne peuvent plus accéder au sommet de la montagne au nord du village. Le chemin semble être infesté de cauchemars. Aide le sorcier à les éliminer.",
            pieceAwardName:"piece1"
        },
        "Quest8":{
            areasNames:["Area11", "Area12"],
            puzzleName:"Puzzle1",
            description:"Des cauchemars sont encore apparus dans les montagnes près du port et du village. Il faut cependant grimper depuis le port accéder aux zones consernées et passer par les îles volantes se trouvant au dessus de la forêt.",
            pieceAwardName:"piece20"
        },
        "Quest9":{
            areasNames:["Area13", "Area14"],
            puzzleName:"Puzzle1",
            description:"De nouveaux monstres perturbent le sud de l'île vers la crevasse et la bosse à proximité du port. Le sorcier te demande de les éliminer le temps qu'il te trouve d'autres de tes souvenirs.",
            pieceAwardName:"piece14"
        },
        "Quest10":{
            areasNames:["Area15", "Area16", "Area17", "Area18"],
            puzzleName:"Puzzle1",
            description:"Des monstres se trouvent sur les petites îles menant vers la deuxième île. Éliminez-les afin de pouvoir mener le combat final sur la dernière île!",
            pieceAwardName:"piece22",
            boss:true
        },
    }; 

    private static _quests:Quest[] = [];

    public static createQuests(areas:Area[], bossMonster?:GoblinBossMonster, player?:Player){
        Object.keys(QuestAsset.questsDatas).forEach(questName => {
            try{
                const questData = QuestAsset.questsDatas[questName];
                const areasNames = questData.areasNames;
                const relatedPuzzleName = questData.puzzleName;
                let questRelatedAreas = areas.filter(area => areasNames.includes(area.areaName));
                const award = new MemoryPiece(questData.pieceAwardName, "memo1", "assets/images/"+relatedPuzzleName+"/"+questData.pieceAwardName+".png");

                let questDescription = null
                if(questData.description) questDescription = questData.description;

                let boss = null;
                if(questData.boss && bossMonster){
                    boss = bossMonster;                   
                } 
                
                const quest = new Quest(questName, award, questDescription, questRelatedAreas, boss, player);
                this._quests.push(quest);
            }
            catch(err) {
                console.log("Warning : Some areas are missed");
            }    
            
        });
    }

    public static get quests(){
        return this._quests;
    }

    // fonction à appeler quand on souhaite réinitialiser l'état du jeu (par exemple une fois que le joueur a perdu)
    public static resetQuests(){
        QuestAsset._quests = [];
    }
}