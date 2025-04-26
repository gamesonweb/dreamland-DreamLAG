import { Scene } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { Player } from "./characterController";

export class Quest {
    constructor(public title: string) {} // Pour l'instant, juste un titre
}

export class QuestMenu {
    private _ui: GUI.AdvancedDynamicTexture;
    private _questWindow: GUI.Rectangle;
    private _closeButton: GUI.Button;
    private _questListPanel: GUI.StackPanel;

    private _quests: Quest[] = [];


    constructor() {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");


        // Fenêtre principale
        this._questWindow = new GUI.Rectangle();
        this._questWindow.width = "300px";
        this._questWindow.height = "400px";
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
            this.toggleQuestWindow();  // ou this._menu.isVisible = false;
        });

        // Panel qui contiendra les quêtes
        this._questListPanel = new GUI.StackPanel();
        this._questListPanel.width = "100%";
        this._questListPanel.isVertical = true;
        this._questListPanel.paddingTop = "10px";

        scrollViewer.addControl(this._questListPanel);
    }

    // Ajouter une quête
    public addQuest(quest: Quest) {
        this._quests.push(quest);

        const questLabel = new GUI.TextBlock();
        questLabel.text = quest.title;
        questLabel.height = "30px";
        questLabel.color = "white";
        questLabel.fontSize = 20;
        questLabel.paddingTop = "5px";
        questLabel.paddingBottom = "5px";
        questLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

        this._questListPanel.addControl(questLabel);
    }

    // Montrer ou cacher la fenêtre
    public toggleQuestWindow() {
        if(this._questWindow.isVisible) Player.controlsLocked = false;
        this._questWindow.isVisible = !this._questWindow.isVisible;
    }
}
