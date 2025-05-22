export interface Dialogue{
    lines: string[];
    changeState:boolean;
    questsConditionsForNextState?:String[]|null;
}


export interface Dialogues{
    [state: number] : {dialogue : Dialogue}
}

export interface DialogueAssets{
    [characterName: string]: Dialogues
}



export const dialoguesAssets: DialogueAssets= {
    "Morphéus":{
        0:{
            dialogue:{
                lines: [
                    "Salut! Je suis un sorcier. Je peux t'aider à récupérer tes souvenirs en échange de mission.",
                    "Les zones des monstres apparaissent dès que tu acceptes une quête. Lis bien la description pour avoir des détails sur les lieux concernants les missions"
                ],
                changeState:true,
                questsConditionsForNextState:[
                    "Quest1",
                    "Quest2",
                    "Quest3"
                ]
            }
        },
        1:{
            dialogue:{
                lines:[
                    "Salut! Tu veux de nouvelles quêtes?"
                ],
                changeState:false,
                questsConditionsForNextState:[
                    "Quest1",
                    "Quest2",
                    "Quest3"
                ]
            }
        },
        2:{
            dialogue:{
                lines:[
                    "Hmmh, quelle efficacité! Tu as terminé toutes les quêtes que je t'ai donné.",
                    "Tiens, en voici des nouvelles, tu pourras toujours obtenir des pièces de tes souvenirs en complétant ces quêtes"
                ],
                changeState:true,
                questsConditionsForNextState:[
                    "Quest4",
                    "Quest5",
                    "Quest6"
                ]
            }
        },
        3:{
            dialogue:{
                lines:[
                    "Salut! Tu souhaites de nouvelles quêtes?"
                ],
                changeState:false,
                questsConditionsForNextState:[
                    "Quest4",
                    "Quest5",
                    "Quest6"
                ]
            }
        },
        4:{
            dialogue:{
                lines:[
                    "Ouah! Tu as déjà fini?! Et en plus tu as trouvé d'autres fragments?!",
                    "Tu ne cesses de m'étonner. Mais j'ai encore des missions à te donner. Il me reste encore quelques endroits où je pourrai trouver certains de tes souvenirs."
                ],
                changeState:true,
                questsConditionsForNextState:[
                    "Quest7",
                    "Quest8",
                    "Quest9",
                    //"Quest10"
                ]
            }
        },
        5:{
            dialogue:{
                lines:[
                    "Il te reste encore quelques quêtes à finir. Je m'occupe de retrouver les fragments qui te sont inaccessibles"
                ],
                changeState:false,
                questsConditionsForNextState:[
                    "Quest7",
                    "Quest8",
                    "Quest9",
                    //"Quest10"
                ]
            }
        },
        6:{
            dialogue:{
                lines:[
                    "Tu as terminé! Incroyable!",
                    "Il me reste une dernière quête à te confier, mais pour ca je tepasse ceci.",
                    "Ce sont des ailes. Elles te permettront de voler. Tu en auras besoin pour cette dernière mission et pour ce qui t'attends après.",
                    "Si tu souhaites passer en mode vol, il te suffit d'appuyer sur [F].",
                    "Pour monter en altitude, appuye sur [ESPACE] et pour descendre, sur [Shift].",
                    "Bonne chance pour ta dernière mission!"
                ],
                changeState:false,
                questsConditionsForNextState: null
            }
        }
    }    
}
