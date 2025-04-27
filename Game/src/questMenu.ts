import { Scene } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { Player } from "./characterController";
import { Area } from "./area";

export class Quest {
    public title:string
    private _questAccepted=false;
    private _isCompleted=false;

    private _involvedAreas:Area[]|null=[];

    constructor(title: string, areas?:Area[]) {
        this.title = title;

        this._involvedAreas = areas;

    } // Pour l'instant, juste un titre

    public acceptQuest(){
        this._questAccepted=true;
        if(this._involvedAreas){
            for(const area of this._involvedAreas){
                area.activateArea();
            }
        }
    }

    // public _updateAchievement(){

    // }
}

export interface Menu{
    showWindow();
    closeWindow();
    isWindowRecentlyClosed();
}

export class QuestMenu implements Menu{
    private _ui: GUI.AdvancedDynamicTexture;
    private _questWindow: GUI.Rectangle;
    private _closeButton: GUI.Button;
    private _questListPanel: GUI.StackPanel;

    private _quests: Quest[] = [];

    private _isWindowRecentlyClosed: boolean = false;


    constructor(quests: Quest[]) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this._quests = quests;

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
        }
    }

    private _createUiQuest(quest:Quest){
        const questContainer = new GUI.Rectangle();
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
