import { Scene } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { Player } from "./characterController";
import { Memory, MemoryAsset, MemoryPiece } from "./memory";



export class MemoryMenu{
    private _advancedTexture:GUI.AdvancedDynamicTexture;
    private _buttonMenu: GUI.Rectangle;
    private _menuWindow: GUI.Rectangle;
    private _memoryListPanel: GUI.StackPanel;

    public scene;
    public player:Player;
    
    private _memories:Memory[]=[];

    constructor(scene:Scene, player:Player){
        this.scene = scene;
        this.player = player;

        this._setUpMemoryMenuBouton();
        this._setUpMenuWindow();
    }

    private _setUpMemoryMenuBouton(){
        this._advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
        // On crée un conteneur
        this._buttonMenu = new GUI.Rectangle();
        this._buttonMenu.width = "85px"; // un peu plus large pour le texte
        this._buttonMenu.height = "80px";
        this._buttonMenu.thickness = 0;
        this._buttonMenu.background = "transparent";
    
        this._buttonMenu.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._buttonMenu.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this._buttonMenu.left = "20px";
    
        const image = new GUI.Image("butImage", "assets/images/puzzle.png");
        image.width = "50px";
        image.height = "50px";
        image.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._buttonMenu.addControl(image);
    
        const textButton = new GUI.TextBlock("memoText", "Souvenirs (M)");
        textButton.fontSize = 13;
        textButton.color = "white";
        textButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        textButton.height = "40px";
        this._buttonMenu.addControl(textButton);

        this._buttonMenu.isPointerBlocker = true;

    
        this._advancedTexture.addControl(this._buttonMenu);
    
        // Clique sur l'ensemble du container
        this._buttonMenu.onPointerUpObservable.add(() => {
            this.toggleMenu();
        });
    }

    private _setUpMenuWindow() {
        // 1) Fenêtre principale
        this._menuWindow = new GUI.Rectangle();
        this._menuWindow.width= "800px";
        this._menuWindow.height = "500px";
        this._menuWindow.thickness = 5;
        this._menuWindow.background = "black";
        this._menuWindow.isVisible = false;
        this._menuWindow.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._menuWindow.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this._advancedTexture.addControl(this._menuWindow);
    
        // 2) ScrollViewer
        const scrollViewer = new GUI.ScrollViewer();
        scrollViewer.width = "100%";
        scrollViewer.height = "100%";
        scrollViewer.barColor = "white";
        scrollViewer.thumbLength = 0.2;
        scrollViewer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._menuWindow.addControl(scrollViewer);
    
        // 3) StackPanel dans ScrollViewer
        const stackPanel = new GUI.StackPanel();
        stackPanel.width = "100%";
        stackPanel.isVertical = true;
        stackPanel.paddingTop = "10px";
        scrollViewer.addControl(stackPanel);
    
        // 4) Ajouter les boutons dans des lignes de 2 boutons
        for (let i = 0; i < MemoryAsset.memories.length; i += 2) {
            const rowGrid = new GUI.Grid();
            rowGrid.width = "100%";
            rowGrid.heightInPixels = 250;
            rowGrid.addColumnDefinition(0.5);
            rowGrid.addColumnDefinition(0.5);
    
            // Premier bouton
            const mem = MemoryAsset.memories[i];
            mem.init();
            const piece1 = new MemoryPiece("piece1", "memo" + (i+1), "assets/images/Puzzle1/piece1.png");
            const piece2 = new MemoryPiece("piece2", "memo" + (i+1), "assets/images/Puzzle1/piece2.png");
            const piece3 = new MemoryPiece("piece3", "memo" + (i+1), "assets/images/Puzzle1/piece3.png");
            const button1 = this._createMemoryButton(mem);
            button1.onPointerClickObservable.add(() => {
                mem.showWindow();
            })
            rowGrid.addControl(button1, 0, 0);
    
            // Deuxième bouton (s'il existe)
            if (i + 1 < MemoryAsset.memories.length) {
                const mem2 = new Memory("memo" + (i + 1), "assets/images/Puzzle1");
                const button2 = this._createMemoryButton(mem2);
                button2.onPointerClickObservable.add(() => {
                    mem2.showWindow();
                })
                rowGrid.addControl(button2, 0, 1);
            }
    
            stackPanel.addControl(rowGrid);
        }


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
        
        this._menuWindow.addControl(closeButton);
        
        closeButton.onPointerClickObservable.add(() => {
            this.toggleMenu();
        })
    }
    
    private _createMemoryButton(memo: Memory): GUI.Button {
        const button = GUI.Button.CreateSimpleButton("memBtn", "Memory " + memo.name);
        button.width = "90%";
        button.height = "200px";
        button.thickness = 3;
        button.color = "white";
        button.background = "gray";
    
        return button;
    }

    public toggleMenu(){
        if(this._menuWindow.isVisible){
            this._menuWindow.isVisible = false;
            this.player.unlockControls()
        }
        else{
            this._menuWindow.isVisible = true;
            this.player.lockControls()
        }
    }
    
}