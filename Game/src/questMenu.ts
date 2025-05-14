import { Observable, Scene } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { Player } from "./characterController";
import { Area } from "./area";
import { MemoryPiece } from "./memory";

export class Quest {
    public title:string
    private _questAccepted:boolean=false;
    private _isCompleted:boolean=false;
    private _isRewardClaimed:boolean = false;
    private _reward:MemoryPiece=null;
    public onStateChange = new Observable<Quest>();

    private _involvedAreas:Area[]|null=[];

    constructor(title: string, reward: MemoryPiece, areas?:Area[]) {
        this.title = title;

        this._reward = reward;

        this._involvedAreas = areas;

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
    }
    

    public setQuestProgression(){
        console.log("NOTIFICATION");
        const nbAreas = this._involvedAreas.length;
        let nbCompletedAreas = 0;
        for(const area of this._involvedAreas){
            if(area.isCompleted) nbCompletedAreas++;
        }
        if(nbCompletedAreas === nbAreas){
            this._isCompleted = true;
            this.onStateChange.notifyObservers(this);
        }
        
    }

    public claimReward(player:Player) {
        player.claimReward(this._reward);
        this._isRewardClaimed = true;
        this.onStateChange.notifyObservers(this);
    }

    public get isAccepted() {
        return this._questAccepted;
    }

    public get isCompleted() { 
        return this._isCompleted; 
    }

    public get isRewardClaimed() { 
        return /* à renseigner */ false;
    }

}

export class QuestAsset{
    public static questsDatas: {[questName:string]: {areasNames:String[], puzzleName:String, pieceAwardName:string}} = 
    {
        "Quest1" : {
            areasNames:["Area1"],
            puzzleName:"Puzzle1",
            pieceAwardName:"piece7"
        },
        "Quest2" : {
            areasNames:["Area2"],
            puzzleName:"Puzzle1",
            pieceAwardName:"piece4"
        },
        "Quest3": {
            areasNames:["Area3"],
            puzzleName:"Puzzle1",
            pieceAwardName:"piece2"
        },
        "Quest4": {
            areasNames:["Area4"],
            puzzleName:"Puzzle1",
            pieceAwardName:"piece16"
        },
        "Quest5":{
            areasNames:["Area5"],
            puzzleName:"Puzzle1",
            pieceAwardName:"piece24"
        },
        "Quest6":{
            areasNames:["Area6"],
            puzzleName:"Puzzle1",
            pieceAwardName:"piece11"
        },
        "Quest7":{
            areasNames:["Area7", "Area8", "Area9"],
            puzzleName:"Puzzle1",
            pieceAwardName:"piece1"
        }
    }; 

    private static _quests:Quest[] = [];

    public static createQuests(areas:Area[]){
        Object.keys(QuestAsset.questsDatas).forEach(questName => {
            try{
                const questData = QuestAsset.questsDatas[questName];
                const areasNames = questData.areasNames;
                const relatedPuzzleName = questData.puzzleName;
                let questRelatedAreas = areas.filter(area => areasNames.includes(area.areaName));
                const award = new MemoryPiece(questData.pieceAwardName, "memo1", "assets/images/"+relatedPuzzleName+"/"+questData.pieceAwardName+".png");
                const quest = new Quest(questName, award, questRelatedAreas);
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
}

export interface CharacterMenu{
    showWindow();
    closeWindow();
    isWindowRecentlyClosed();
}

export class QuestMenu implements CharacterMenu{
    private _ui: GUI.AdvancedDynamicTexture;
    private _questWindow: GUI.Rectangle;
    private _closeButton: GUI.Button;
    private _questListPanel: GUI.StackPanel;

    private _quests: Quest[] = [];

    private _player:Player;

    private _isWindowRecentlyClosed: boolean = false;

    private _uiMap = new Map<Quest, {
        container: GUI.Rectangle,
        acceptBtn?: GUI.Button,
        statusText?: GUI.TextBlock,
        rewardBtn?: GUI.Button
    }>();


    constructor(quests: Quest[], player:Player) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this._quests = quests;

        this._player = player;

        // Fenêtre principale
        this._questWindow = new GUI.Rectangle();
        this._questWindow.width = "500px";
        this._questWindow.height = "600px";
        this._questWindow.cornerRadius = 10;
        this._questWindow.color = "white";
        this._questWindow.thickness = 2;
        this._questWindow.background = "black";
        this._questWindow.isVisible = false; // Caché au début
        this._ui.addControl(this._questWindow);

        // ScrollViewer (pour scroller si beaucoup de quêtes)
        const scrollViewer = new GUI.ScrollViewer();
        scrollViewer.width = "100%";
        scrollViewer.height = "100%";
        scrollViewer.barColor = "white";
        scrollViewer.thumbLength = 0.2; // taille du "pouce" de scroll
        scrollViewer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._questWindow.addControl(scrollViewer);

         // === Ajout du bouton "croix" ===
         this._closeButton = GUI.Button.CreateSimpleButton("closeButton", "X");
         this._closeButton.width = "40px";
         this._closeButton.height = "40px";
         this._closeButton.color = "white";
         this._closeButton.background = "red";

        this._closeButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._closeButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._closeButton.top = "10px";
        this._closeButton.left = "-10px";

        this._questWindow.addControl(this._closeButton);

        this._closeButton.onPointerUpObservable.add(() => {
            this.closeWindow();  // ou this._menu.isVisible = false;
            this._isWindowRecentlyClosed = true;
            setTimeout(() => {
                this._isWindowRecentlyClosed = false;
            },200)
        });

        // Panel qui contiendra les quêtes
        this._questListPanel = new GUI.StackPanel();
        this._questListPanel.width = "100%";
        this._questListPanel.isVertical = true;
        this._questListPanel.paddingTop = "10px";

        scrollViewer.addControl(this._questListPanel);

        this._setUpUIQuests();
    }

    private _setUpUIQuests(){
        for(const quest of this._quests){
            this._createUiQuest(quest);

            quest.onStateChange.add(() => this._updateQuestUI(quest));
        }
    }

    private _createUiQuest(quest:Quest){
        const questContainer = new GUI.Rectangle();
        questContainer.width = "100%"
        questContainer.height = "100px"; // un peu plus grand pour inclure padding + bordure
        questContainer.thickness = 2;   // bordure de 2px
        questContainer.color = "white"; // couleur de la bordure
        questContainer.background = "#333"; // optionnel : fond gris foncé
        questContainer.cornerRadius = 5; // optionnel : coins arrondis

        const questLabel = new GUI.TextBlock();
        questLabel.text = quest.title;
        questLabel.color = "white";
        questLabel.fontSize = 20;
        questLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        questLabel.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        const acceptButton = GUI.Button.CreateSimpleButton("acceptQuest", "Accepter");
        acceptButton.width = "150px";
        acceptButton.height = "50px";
        acceptButton.color = "white";
        acceptButton.background = "green";

        acceptButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        acceptButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        acceptButton.onPointerClickObservable.add(() => {
            quest.acceptQuest();
        })

        questContainer.addControl(questLabel); 
        questContainer.addControl(acceptButton);
        this._questListPanel.addControl(questContainer); // on ajoute le rectangle à la liste
        this._uiMap.set(quest, { container: questContainer, acceptBtn : acceptButton });
    }

     /** Reconstruit l’UI d’une quête après changement d’état */
     private _updateQuestUI(quest: Quest) {
        const ui = this._uiMap.get(quest);
        
        if (!ui) return;

        // 1) On retire les anciens contrôles s'ils existent
        if (ui.acceptBtn) {
            ui.container.removeControl(ui.acceptBtn);
            ui.acceptBtn = undefined;
        }
        if (ui.statusText) {
            ui.container.removeControl(ui.statusText);
            ui.statusText = undefined;
        }
        if (ui.rewardBtn) {
            ui.container.removeControl(ui.rewardBtn);
            ui.rewardBtn = undefined;
        }

        if (quest.isAccepted && !quest.isCompleted) {
            // statut "En cours"
            const status = new GUI.TextBlock();
            status.resizeToFit = true;
            status.text = "En cours";
            status.color = "yellow";
            status.fontSize = 18;
            status.paddingLeft = "10px";
            status.horizontalAlignment=GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            status.verticalAlignment=GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            // status.left                  = "160px"; // largeur du bouton (150px) + 10px de marge
            ui.container.addControl(status);
            ui.statusText = status;
            return;
        }

        if (quest.isCompleted && !quest.isRewardClaimed) {
            // bouton Récupérer récompense
            const rewardBtn = GUI.Button.CreateSimpleButton("rewardBtn", "Récupérer récompense");
            rewardBtn.width = "200px";
            rewardBtn.height = "50px";
            rewardBtn.color = "white";
            rewardBtn.background = "blue";
            rewardBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            rewardBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            rewardBtn.onPointerClickObservable.add(() => {
                quest.claimReward(this._player);
                // on peut directement supprimer la quête
                this._questListPanel.removeControl(ui.container);
                this._uiMap.delete(quest);
            });
            ui.container.addControl(rewardBtn);
            ui.rewardBtn = rewardBtn;
            return;
        }

        // si récompense déjà prise, on supprime la quête (sécurité)
        this._questListPanel.removeControl(ui.container);
        this._uiMap.delete(quest);
    }

    // Ajouter une quête
    public addQuest(quest: Quest) {
        this._quests.push(quest);

        this._createUiQuest(quest);
        
    }

    // Montrer ou cacher la fenêtre
    public showWindow() {
        //if(this._questWindow.isVisible) Player.controlsLocked = false;
        this._questWindow.isVisible = true;
    }

    public closeWindow(){
        this._questWindow.isVisible = false;
    }

    public isWindowRecentlyClosed(): boolean{
        return this._isWindowRecentlyClosed;
    }
}
