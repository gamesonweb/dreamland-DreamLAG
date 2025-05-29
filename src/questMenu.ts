import { Observable, Scene } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { Player } from "./characterController";
import { Area } from "./area";
import { MemoryPiece } from "./memory";
import { Quest } from "./quest";



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

    //quest description window
    private _questDescriptionUI: GUI.Rectangle;
    private _questTitleText:GUI.TextBlock;
    private _questDescriptionText:GUI.TextBlock;
    private _questAwardText:GUI.TextBlock;
    private _currentQuestStatus:GUI.Button|GUI.TextBlock;


    private _quests: Quest[] = [];
    private _showedQuests: Quest[] = [];

    private _player:Player;

    private _isWindowRecentlyClosed: boolean = false;

    private _uiMap = new Map<Quest, {
        container: GUI.Button,
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

        this._createQuestsUIDescription();
        this._setUpUIQuests();
    }

    private _setUpUIQuests(){
        for(const quest of this._quests){
            this._createUiQuest(quest);

            quest.onStateChange.add(() => this._updateQuestUI(quest));
        }
    }

    

    //private _displayQuestDescription(Quest:)

    private _createUiQuest(quest:Quest){
        const questContainer = new GUI.Button();
        questContainer.width = "100%"
        questContainer.height = "100px"; // un peu plus grand pour inclure padding + bordure
        questContainer.thickness = 2;   // bordure de 2px
        questContainer.color = "white"; // couleur de la bordure
        questContainer.background = "#333"; // optionnel : fond gris foncé
        questContainer.cornerRadius = 5; // optionnel : coins arrondis
        questContainer.onPointerClickObservable.add(() => {
            this._showQuestDescriptionWindow(quest);
        })

        const questLabel = new GUI.TextBlock();
        questLabel.text = quest.title;
        questLabel.color = "white";
        questLabel.fontSize = 20;
        questLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        questLabel.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        const acceptButton = GUI.Button.CreateSimpleButton("acceptQuest", "Accepter");
        acceptButton.width = "100px";
        acceptButton.height = "40px";
        acceptButton.color = "white";
        acceptButton.background = "green";

        acceptButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        acceptButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        acceptButton.paddingBottom = "10px";
        acceptButton.paddingRight = "10px";

        acceptButton.onPointerClickObservable.add(() => {
            quest.acceptQuest();
        })


        questContainer.addControl(questLabel); 
        questContainer.isVisible=false;
        //questContainer.addControl(acceptButton);
        //this._questDescriptionUI.addControl(acceptButton);
        this._questListPanel.addControl(questContainer); // on ajoute le rectangle à la liste
        this._uiMap.set(quest, { container: questContainer, acceptBtn : acceptButton });
    }

    private _createQuestsUIDescription(){
        this._questDescriptionUI = new GUI.Rectangle();
        this._questDescriptionUI.width = "400px";
        this._questDescriptionUI.height = "200px";
        this._questDescriptionUI.cornerRadius = 10;
        this._questDescriptionUI.color = "white";
        this._questDescriptionUI.thickness = 2;
        this._questDescriptionUI.background = "black";
        this._questDescriptionUI.isVisible = false;

        // Positionnement en haut à droite de l'écran
        this._questDescriptionUI.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._questDescriptionUI.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._questDescriptionUI.top = "10px";  // Marge par rapport au haut
        this._questDescriptionUI.left = "-10px"; // Marge par rapport au bord droit (négatif pour reculer)

        this._questTitleText = new GUI.TextBlock();
        this._questTitleText.text = "Quest";
        this._questTitleText.color = "white";
        this._questTitleText.fontSize = 20;
        this._questTitleText.textWrapping = true;
        this._questTitleText.resizeToFit = true;
        this._questTitleText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._questTitleText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._questTitleText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._questTitleText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._questTitleText.paddingLeft = "10px"; 
        this._questTitleText.paddingTop = "10px";  
        this._questDescriptionUI.addControl(this._questTitleText);

        this._questDescriptionText = new GUI.TextBlock();
        this._questDescriptionText.text = "Un homme semble avoir apercu quelque chose près du port. Allez jeter un coup d'oeil";
        this._questDescriptionText.color = "white";
        this._questDescriptionText.fontSize = 15;
        this._questDescriptionText.textWrapping = true;
        this._questDescriptionText.resizeToFit = true;
        this._questDescriptionText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._questDescriptionText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._questDescriptionText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._questDescriptionText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._questDescriptionText.paddingLeft = "10px";
        this._questDescriptionText.paddingTop = "50px";
        this._questDescriptionUI.addControl(this._questDescriptionText);

        this._questAwardText = new GUI.TextBlock();
        this._questAwardText.text = "Récompense : pièce de puzzle";
        this._questAwardText.color = "white";
        this._questAwardText.fontSize = 15;
        this._questAwardText.textWrapping = true;
        this._questAwardText.resizeToFit = true;
        this._questAwardText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._questAwardText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._questAwardText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._questAwardText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._questAwardText.paddingLeft = "10px";
        this._questAwardText.paddingBottom= "10px";
        this._questDescriptionUI.addControl(this._questAwardText);

        // === Ajout du bouton "croix" ===
        const closeButton = GUI.Button.CreateSimpleButton("closeButton", "X");
        closeButton.width = "40px";
        closeButton.height = "40px";
        closeButton.color = "white";
        closeButton.background = "red";

        closeButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        closeButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        closeButton.top = "10px";
        closeButton.left = "-10px";

        closeButton.onPointerClickObservable.add(() => {
            this._closeQuestDescriptionWindow()
        });


        this._questDescriptionUI.addControl(closeButton);

        //this._questDescriptionText.text = "Un homme semble avoir apercu quelque chose près du port. Allez jeter un coup d'oeil"

        this._updateQuestDescriptionPosition();
        
        this._ui.addControl(this._questDescriptionUI);
    }

    private _updateQuestDescriptionPosition() {
        const questWindowWidth = 500;
        const questWindowHeight = 600;
        const spacing = 20;

        // const descriptionUIWidth = 400;
        // const descriptionUIHeight = 200;

        // Récupère la taille de l'écran via l'engine du canvas
        const engine = this._ui.getScene()?.getEngine();
        if (!engine) return;

        const screenWidth = engine.getRenderWidth();
        const screenHeight = engine.getRenderHeight();

        // Position de questWindow (centrée)
        const questWindowX = (screenWidth - questWindowWidth) / 2;
        const questWindowY = (screenHeight - questWindowHeight) / 2;

        // Position de la fenêtre de description à droite de questWindow
        const descriptionX = questWindowX + questWindowWidth + spacing;
        const descriptionY = questWindowY;

        this._questDescriptionUI.leftInPixels = descriptionX;
        this._questDescriptionUI.topInPixels = descriptionY;
        this._questDescriptionUI.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._questDescriptionUI.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    }


     /** Reconstruit l’UI d’une quête après changement d’état */
     private _updateQuestUI(quest: Quest) {
        const ui = this._uiMap.get(quest);
        
        if (!ui) return;

        // 1) On retire les anciens contrôles s'ils existent
        if (ui.acceptBtn) {
            //ui.container.removeControl(ui.acceptBtn);
            this._questDescriptionUI.removeControl(this._currentQuestStatus);
            ui.acceptBtn = undefined;
        }
        if (ui.statusText) {
            ui.container.removeControl(ui.statusText);
            this._questDescriptionUI.removeControl(this._currentQuestStatus);
            ui.statusText = undefined;
        }
        if (ui.rewardBtn) {
            //ui.container.removeControl(ui.rewardBtn);
            this._questDescriptionUI.removeControl(this._currentQuestStatus);
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
            status.horizontalAlignment=GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            status.verticalAlignment=GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            status.paddingBottom="10px";
            status.paddingRight="10px";
            // status.left                  = "160px"; 
            const statusCpy = status.clone() as GUI.TextBlock;
            ui.container.addControl(status);
            this._currentQuestStatus = statusCpy;
            this._questDescriptionUI.addControl(statusCpy);
            ui.statusText = status;
            return;
        }

        if (quest.isCompleted && !quest.isRewardClaimed) {
            // bouton Récupérer récompense
            const rewardBtn = GUI.Button.CreateSimpleButton("rewardBtn", "Récupérer récompense");
            rewardBtn.width = "150px";
            rewardBtn.height = "50px";
            rewardBtn.color = "white";
            rewardBtn.background = "blue";
            rewardBtn.fontSize = 16;
            rewardBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            rewardBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            rewardBtn.paddingBottom="10px";
            rewardBtn.paddingRight="10px";

            const completedStatus = new GUI.TextBlock();
            completedStatus.resizeToFit = true;
            completedStatus.text = "Terminé";
            completedStatus.color = "#90ee90";
            completedStatus.fontSize = 18;
            completedStatus.paddingLeft = "10px";
            completedStatus.horizontalAlignment=GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            completedStatus.verticalAlignment=GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            completedStatus.paddingBottom="10px";
            completedStatus.paddingRight="10px";

            rewardBtn.onPointerClickObservable.add(() => {
                quest.claimReward(this._player);
                // on peut directement supprimer la quête
                this._questListPanel.removeControl(ui.container);
                this._uiMap.delete(quest);
                this._closeQuestDescriptionWindow();
            });

            

            ui.container.addControl(completedStatus);
            this._currentQuestStatus = rewardBtn;
            this._questDescriptionUI.addControl(rewardBtn);
            ui.rewardBtn = rewardBtn;
            return;
        }

        // si récompense déjà prise, on supprime la quête (sécurité)
        this._questListPanel.removeControl(ui.container);
        this._uiMap.delete(quest);
    }

    public showQuestUI(questName:String){
        const quest=this._quests.find(quest => quest.title === questName);
        if(quest){
            this._uiMap.get(quest).container.isVisible = true;
        }
    }

    // public addToShowedQuests(quest:Quest){
    //     const tmp = this._quests;
    //     this._quests = this._quests.filter(currQuest => currQuest!==quest);
        
    //     if(tmp == this._quests) console.log("Error : the quest " + quest + "is not in list _quests");
    //     if(tmp){
    //         this._showedQuests.push(tmp);
    //     }
    // }

    // public addToShowedQuestsFromQuestsTitles(questNames:string[]){
    //     const quests = this._quests.filter(quest => questNames.includes(quest.title));
    //     if(quests){
    //         for(const quest of quests){
    //             this.addToShowedQuests(quest);
    //         }
    //     }
    //     else console.log("Erreur : no quests found with the given name in list _quests");
    // }

    // Ajouter une quête
    public addQuest(quest: Quest) {
        this._quests.push(quest);

        this._createUiQuest(quest);
        
    }

    private _showQuestDescriptionWindow(quest:Quest){
        // const acceptButton = GUI.Button.CreateSimpleButton("acceptQuest", "Accepter");
        // acceptButton.width = "100px";
        // acceptButton.height = "40px";
        // acceptButton.color = "white";
        // acceptButton.background = "green";

        // acceptButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        // acceptButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        // acceptButton.paddingBottom = "10px";
        // acceptButton.paddingRight = "10px";

        // acceptButton.onPointerClickObservable.add(() => {
        //     quest.acceptQuest();
        // })

        if(this._currentQuestStatus) this._questDescriptionUI.removeControl(this._currentQuestStatus)

        const ui = this._uiMap.get(quest);
        if(!quest.isCompleted && !quest.isAccepted){
            this._currentQuestStatus = ui.acceptBtn;
            this._questDescriptionUI.addControl(this._currentQuestStatus);
        } 
        else if(!quest.isCompleted) {
            const statusCpy = ui.statusText.clone() as GUI.TextBlock;
            this._currentQuestStatus = statusCpy;
            this._questDescriptionUI.addControl(this._currentQuestStatus);
        }
        else if(!quest.isRewardClaimed){
            this._currentQuestStatus = ui.rewardBtn;
            this._questDescriptionUI.addControl(this._currentQuestStatus);
        }
        
        // this._questDescriptionUI.addControl()

        // this._questDescriptionUI.addControl(acceptButton);

        this._questTitleText.text = quest.title;
        this._questDescriptionText.text = quest.description;
        this._questDescriptionUI.isVisible = true;
    }

    private _closeQuestDescriptionWindow(){
        this._questDescriptionUI.isVisible = false;
    }

    // Montrer ou cacher la fenêtre
    public showWindow() {
        //if(this._questWindow.isVisible) Player.controlsLocked = false;
        this._questWindow.isVisible = true;
    }

    public closeWindow(){
        this._questWindow.isVisible = false;
        this._questDescriptionUI.isVisible = false;
    }

    public isWindowRecentlyClosed(): boolean{
        return this._isWindowRecentlyClosed;
    }
}
