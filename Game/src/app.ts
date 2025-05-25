import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    ArcRotateCamera,
    Color3,
    Color4,
    Engine,
    FreeCamera,
    HemisphericLight,
    Layer,
    Matrix,
    Mesh,
    MeshBuilder,
    PointLight,
    Quaternion,
    Scene,
    ShadowGenerator,
    Sound,
    StandardMaterial,
    Vector3
} from "@babylonjs/core";
import {AdvancedDynamicTexture, Button, Control, Rectangle, TextBlock} from "@babylonjs/gui";
import {Environment} from "./environment";
import {Player} from "./characterController";
import {PlayerInput} from "./inputController";
import {Monster} from "./entities/monster";
import {AreaAsset} from "./area";
import {Memory, MemoryAsset} from "./memory";
import {SlimeMonster} from "./entities/slimeMonster";
import {QuestAsset} from "./quest";
import { GoblinBossMonster } from "./entities/goblinBossMonster";

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

export class App {
    _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _state: number;

    private _gamescene: Scene;
    private _cutScene: Scene;
    private _environment: Environment;

    private _player: Player;
    private _input: PlayerInput;
    private _mobs: Monster[];
    public assets: any; // Specify more precise typing for `assets`

    public lastTime = performance.now();
    public fpsDisplay:TextBlock;

    private _playerCamera: ArcRotateCamera; // Player camera
    private _sceneCamera: ArcRotateCamera;  // Scene camera
    private _currentCamera: ArcRotateCamera; // To track the active camera

    //Mouse properties
    private _pointerDownHandler;
    private _pointerMoveHandler;

    //GamePause parameters
    private _isOnPauseMenu:boolean = false;
    private _pauseMenuUI: AdvancedDynamicTexture;
    private _menuContainer: Rectangle;
    private _relockDelay = 600; 
    private _shouldPauseOnUnlock = false;

    private _backgroundMusic:Sound = null;

    private _memories:Memory[];
    private _memoriesAchieved:number = 0;


    constructor() {
        // Create the canvas HTML element and attach it to the webpage
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        // Initialize Babylon.js engine and scene
        this._engine = new Engine(this._canvas, true, { audioEngine: true }, true);
        this._scene = new Scene(this._engine);

        // Hide/show the Inspector with Shift+Ctrl+Alt+I
        window.addEventListener("keydown", (ev) => {
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && (ev.key === "I" || ev.key === "i")&&!this._player.areControlsLocked) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });
        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // Start the game
        this._main();
    }

    public async _goToLose(): Promise<void> {
        this._engine.displayLoadingUI();
        
        this._backgroundMusic.stop();

        QuestAsset.resetQuests();

        document.exitPointerLock();
        if(this._pointerDownHandler) this._canvas.removeEventListener("pointerdown", this._pointerDownHandler);
        if(this._pointerMoveHandler) this._canvas.removeEventListener("pointermove", this._pointerMoveHandler);
        
        //--SCENE SETUP--
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //--GUI--
        const backgroundLayer = new Layer("background", "assets/images/LoseImage.png", scene);
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const loseText = new TextBlock();
        loseText.fontSize = 80;
        loseText.text = "You lost!";
        loseText.color = "white";
        loseText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        loseText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        loseText.paddingTop = "150px";
        guiMenu.addControl(loseText);

        
        const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
        mainBtn.width = 0.2;
        mainBtn.height = "40px";
        mainBtn.color = "white";
        guiMenu.addControl(mainBtn);
        //this handles interactions with the start button attached to the scene
        mainBtn.onPointerUpObservable.add(() => {
            this._goToStart();
        });

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI(); //when the scene is ready, hide loading
        //lastly set the current state to the lose state and set the scene to the lose scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.LOSE;
    }


    public async _goToWin(): Promise<void> {
        this._engine.displayLoadingUI();
        
        this._backgroundMusic.stop();

        QuestAsset.resetQuests();

        document.exitPointerLock();
        if(this._pointerDownHandler) this._canvas.removeEventListener("pointerdown", this._pointerDownHandler);
        if(this._pointerMoveHandler) this._canvas.removeEventListener("pointermove", this._pointerMoveHandler);
        
        //--SCENE SETUP--
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //--GUI--
        const backgroundLayer = new Layer("background", "assets/images/VictoryImage.png", scene);
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const winText = new TextBlock();
        winText.fontSize = 80;
        winText.text = "You won!";
        winText.color = "white";
        winText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        winText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        winText.paddingTop = "150px";
        guiMenu.addControl(winText);

        
        const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
        mainBtn.width = 0.2;
        mainBtn.height = "40px";
        mainBtn.color = "white";
        guiMenu.addControl(mainBtn);
        //this handles interactions with the start button attached to the scene
        mainBtn.onPointerUpObservable.add(() => {
            this._goToStart();
        });

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI(); //when the scene is ready, hide loading
        //lastly set the current state to the lose state and set the scene to the lose scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.LOSE;
    }


    private async _goToCutScene(): Promise<void> {
        this._engine.displayLoadingUI();
        //--SETUP SCENE--
        //dont detect any inputs from this ui while the game is loading
        this._scene.detachControl();
        this._cutScene = new Scene(this._engine);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this._cutScene);
        camera.setTarget(Vector3.Zero());
        this._cutScene.clearColor = new Color4(0, 0, 0, 1);

        //--GUI--
        const cutScene = AdvancedDynamicTexture.CreateFullscreenUI("cutscene");

        //--PROGRESS DIALOGUE--
        const next = Button.CreateSimpleButton("next", "NEXT");
        next.color = "white";
        next.thickness = 0;
        next.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        next.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        next.width = "64px";
        next.height = "64px";
        next.top = "-3%";
        next.left = "-12%";
        cutScene.addControl(next);

        next.onPointerUpObservable.add(() => {
            this._goToGame();
        });

        //--WHEN SCENE IS FINISHED LOADING--
        await this._cutScene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.dispose();
        this._state = State.CUTSCENE;
        this._scene = this._cutScene;

        var finishedLoading = false;
        await this._setUpGame().then((res) => {
            finishedLoading = true;
        });
    }

    private async _loadCharacterAssets(scene: Scene): Promise<void> {
        async function loadCharacter() {
            //collision mesh
            const outer = MeshBuilder.CreateBox("outer", { width: 2, depth: 1, height: 3 }, scene);
            outer.isVisible = false;
            outer.isPickable = false;
            outer.checkCollisions = true;

            //move origin of box collider to the bottom of the mesh (to match imported player mesh)
            outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));

            //for collisions
            outer.ellipsoid = new Vector3(1, 1.5, 1);
            outer.ellipsoidOffset = new Vector3(0, 1.5, 0);

            outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player

            var box = MeshBuilder.CreateBox("Small1", { width: 0.5, depth: 0.5, height: 0.25, faceColors: [new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1)] }, scene);
            box.position.y = 1.5;
            box.position.z = 1;

            var body = Mesh.CreateCylinder("body", 3, 2, 2, 0, 0, scene);
            var bodyMtl = new StandardMaterial("red", scene);
            bodyMtl.diffuseColor = new Color3(0.8, 0.5, 0.5);
            body.material = bodyMtl;
            body.isPickable = false;
            body.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0)); // simulates the imported mesh's origin

            //parent the meshes
            box.parent = body;
            body.parent = outer;

            return {
                mesh: outer as Mesh
            };
        }

        return loadCharacter().then((assets) => {
            this.assets = assets;
        });
    }

    private async _loadEntities(scene: Scene, shadowGenerator?: ShadowGenerator): Promise<void> {
        this._player = new Player(this, this.assets, scene, new Vector3(0, 0, 0), shadowGenerator, this._input);

        // const slime1 = new SlimeMonster(scene, new Vector3(10, 30, 0));
        // const slime2 = new Monster(scene, new Vector3(-10, 30, 0),10,10,true);
        //this._mobs = [slime1, slime2];

        // this._mobs.forEach(mob => {
        //     mob.activateMonster([this._player]);
        // })
    }

    private async _setUpGame() {
        let scene = new Scene(this._engine);
        this._gamescene = scene;

        await MemoryAsset.init();
        AreaAsset.areas = {};
        this._memories = MemoryAsset.memories;

        //--CREATE ENVIRONMENT--
        const light0 = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);
        const light = new PointLight("sparklight", new Vector3(0, 100, 0), scene);
        light.diffuse = new Color3(0.086, 0.109, 0.153);
        light.intensity = 70;
        light.radius = 1;

        // INPUT
        this._input = new PlayerInput(scene);

        const shadowGenerator:ShadowGenerator=new ShadowGenerator(1024, light);
        shadowGenerator.darkness = 0.1;

        //await this._loadCharacterAssets(scene); //character
        await this._loadEntities(scene, shadowGenerator);

        const environment = new Environment(scene, this._player);
        this._environment = environment; //class variable for App

        //const memoryMenu = new MemoryMenu(this._scene, this._player);
        await this._environment.loadIsland(); //environment
        //this._finalBoss = this._environment.finalBoss;
        const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const victoryText = new TextBlock();
        victoryText.fontSize = 80;
        victoryText.text = "Victory!";
        victoryText.color = "white";
        victoryText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        victoryText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        victoryText.paddingTop = "150px";
        victoryText.isVisible = false;
        gui.addControl(victoryText);
        this._memories.forEach(memory => {
            memory.onAchievementObservable.add(() => {
                this._memoriesAchieved++;
                if(this._memoriesAchieved == this._memories.length){
                    victoryText.isVisible=true;
            
                    setTimeout(() => {
                        this._goToWin();
                    },5000);
                }
            }) 
        });

        await this._createPauseMenu();

        await new Promise<void>((resolve) => {
            this._backgroundMusic = new Sound(
                "AmbientTheme",
                "assets/music/Island1Music.mp3",
                scene,
                () => {
                    resolve();
                },
                {
                    loop: true,
                    autoplay: false,
                    volume: 0
                }
            );
        });

        if (!this._backgroundMusic.isPlaying) {
                    console.log("Music play");
                    //this._backgroundMusic.setVolume(1);
                   this._backgroundMusic.play();   
        }
        console.log("backgroundMusic.isPlaying = "+ this._backgroundMusic.isPlaying);

        // if(this._backgroundMusic) {
        //     this._backgroundMusic.play();
        //     console.log("background music played");
        // }    
    }

    private async _goToStart() {
        this._engine.displayLoadingUI();
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());
        const backgroundLayer = new Layer("background", "assets/images/HomeImage.png", scene);

        // GUI setup
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        const startBtn = Button.CreateSimpleButton("start", "PLAY");
        startBtn.width = 0.2;
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.background = "rgba(0, 0, 0, 0.5)";
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(startBtn);

        startBtn.onPointerDownObservable.add(() => {
            this._goToCutScene();
            scene.detachControl(); // Observables disabled
        });

        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;
    }

    private async _goToGame() {
        // SETUP SCENE
        this._scene.detachControl();
        let scene = this._gamescene;
        scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098);

        
        this._player.createPlayerUI(scene);

        let fps = 0;
        // Initialize the game
        await this._initializeGameAsync(scene);
        

        await scene.whenReadyAsync();
        //scene.getMeshByName("outer").position = new Vector3(0, 3, 0);
        //this._positionMobsRelativeToPlayer();

        //scene.createOrUpdateSelectionOctree(64,2);
        this._scene.dispose();
        this._state = State.GAME;
        this._scene = scene;
        this._engine.hideLoadingUI();
        this._scene.attachControl();
    }

    private _positionMobsRelativeToPlayer(): void {
        if (!this._player || this._mobs.length === 0) return;

        const baseY = 2;

        // Position joueur
        const playerPos = this._player.mesh.position;

        // Rayon autour du joueur pour placer les mobs
        const radius = 15;

        const count = this._mobs.length;

        for (let i = 0; i < count; i++) {
            // Angle réparti sur 360 degrés selon le nombre de mobs
            const angle = (2 * Math.PI / count) * i;

            const x = playerPos.x + radius * Math.cos(angle);
            const z = playerPos.z + radius * Math.sin(angle);
            this._mobs[i].mesh.position.set(x, baseY, z);
        }
    }


    private async _initializeGameAsync(scene: Scene): Promise<void> {
        this._setupCameras(scene);
    }

    private _setupCameras(scene: Scene) {
        
        var camera = this._player.activatePlayerCamera();
        this._canvas = this._scene.getEngine().getRenderingCanvas();
        if (this._canvas) {

            this._pointerDownHandler = (event) => {
                if (!this._player.areControlsLocked && !this._isOnPauseMenu) {
                    event.preventDefault();
                    event.stopPropagation();
                    const p = this._canvas.requestPointerLock();
                    if (p instanceof Promise) {
                        p.catch(() => {
                        });
                    } 
                    
                }
            };

            this._pointerMoveHandler = (evt) => {
                if (document.pointerLockElement === this._canvas && !this._isOnPauseMenu) {
                    const sensitivity = 0.002;
                    camera.alpha -= evt.movementX * sensitivity;
                    camera.beta -= evt.movementY * sensitivity;
                    camera.beta = Math.max(0.1, Math.min(Math.PI - 0.1, camera.beta));
                }
            };

            this._canvas.addEventListener("pointerdown", this._pointerDownHandler);

            this._canvas.addEventListener("pointermove", this._pointerMoveHandler);

            this._canvas.addEventListener("blur", () => {
                console.log("Le canvas a perdu le focus.");
            });

            window.addEventListener("keydown", ev => {
                if (ev.key === "Escape") {
                    setTimeout(() => {
                        this._isOnPauseMenu = true;
                        this._menuContainer.isVisible = true;
                    }, this._relockDelay/2);
                }
              });  

        }

        scene.activeCamera = camera;

    }

    //Crée l'affichage du menu de pause dans le jeu.
    private async _createPauseMenu(): Promise<void> {
        this._pauseMenuUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const menuContainer = new Rectangle();
        menuContainer.width = "100%";
        menuContainer.height = "100%";
        menuContainer.background = "black";
        menuContainer.alpha = 0.5;
        menuContainer.isVisible = false; // caché par défaut
        this._pauseMenuUI.addControl(menuContainer);

        const resumeButton = Button.CreateSimpleButton("resume", "Resume");
        resumeButton.width = "150px";
        resumeButton.height = "50px";
        resumeButton.color = "white";
        resumeButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        resumeButton.verticalAlignment   = Control.VERTICAL_ALIGNMENT_CENTER;
        resumeButton.top = "-30px";      // 30px au-dessus du centre
        resumeButton.onPointerUpObservable.add(() => {
            setTimeout(() => {
                menuContainer.isVisible = false;
                this._shouldPauseOnUnlock = false;
                this._isOnPauseMenu = false;
                const p = this._canvas.requestPointerLock();
                    if (p instanceof Promise) {
                        p.catch(() => {
                            //on ignore cette erreur pour pointerLock
                        });
                    } 
                
            }, this._relockDelay )
        });


        const leaveButton = Button.CreateSimpleButton("leave", "Leave");
        leaveButton.width = "150px";
        leaveButton.height = "50px";
        leaveButton.color = "white";
        leaveButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        leaveButton.verticalAlignment   = Control.VERTICAL_ALIGNMENT_CENTER;
        leaveButton.top = "30px";        // 30px en-dessous du centre
        leaveButton.onPointerClickObservable.add(() => {
            menuContainer.isVisible = false;
            this._isOnPauseMenu = false;
            this._goToLose().then(() => {
                this._scene.clearCachedVertexData();
                this._scene.cleanCachedTextureBuffer();
            })
        })

        this._menuContainer = menuContainer
        this._menuContainer.addControl(resumeButton);
        this._menuContainer.addControl(leaveButton);

    }



    private async _main(): Promise<void> {
        await this._goToStart();

        // Register a render loop to repeatedly render the scene
        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START:
                    this._scene.render();
                    break;
                case State.CUTSCENE:
                    this._scene.render();
                    break;
                case State.GAME:
                    this._scene.render();
                    // const currentTime = performance.now();
                    // const deltaTime = currentTime - this.lastTime;
                    // const fps = Math.round(1000 / deltaTime);
                    // this.lastTime = currentTime;

                    // this.fpsDisplay.text = `FPS: ${fps}`;
                    break;
                case State.LOSE:
                    this._scene.render();
                    break;
                default: break;
            }
        });
    }
}
new App();
