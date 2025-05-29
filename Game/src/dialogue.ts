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
                    "Bienvenue à toi, jeune homme venu de l'autre monde.",
                    "Je suis Morphéus, un ancien sorcier légendaire.",
                    "Il semble que tu aies perdu la mémoire, ce qui explique ta présence ici, dans le monde des rêves.",
                    "Tes souvenirs ne sont pas complètement perdus, mais ils se sont fragmentés en plusieurs pièces de puzzle.",
                    "Tu devras parcourir notre monde pour les récupérer et retrouver la mémoire.",
                    "Je peux toutefois t’aider à en retrouver certaines, à condition que tu m’aides à éliminer les monstres qui rôdent aux alentours.",
                    "Pour cela, accepte l’une de mes quêtes et rends-toi à l’endroit indiqué dans sa description.",
                    "Une fois sur place, tu devrais apercevoir la ou les zones où ces monstres se cachent.",
                    "Pour les éliminer, il te suffit de lancer un puissant rayon lumineux avec un clic droit.",
                    "Mais attention : si tu meurs dans ce monde, tu meurs pour de bon.",
                    "Bonne chance à toi… que tes souvenirs te reviennent."
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
                    "Il te reste encore quelques missions à terminer pour que je puisse te donner de nouvelles pièces."
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
                    "Hmmh, quelle efficacité ! Tu as terminé toutes les quêtes que je t’ai données.",
                    "Je souhaite te tester à nouveau. Accepte les nouvelles quêtes si tu veux récupérer d'autres pièces."
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
                    "Il te reste encore quelques missions à effectuer. Accepte-les pour récupérer d'autres fragments de tes souvenirs."
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
                    "Tu as déjà terminé ?! Je souhaite que tu acceptes ces dernières missions.",
                    "Tu pourras recevoir d’autres pièces comme d’habitude, mais je dois t’expliquer pourquoi je t’ai demandé d’accepter mes requêtes jusqu’à présent.",
                    "Tu comprendras le sens de ta venue dans ce monde, ainsi que mes motivations pour te pousser à te battre contre ces monstres."
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
                    "Termine les quêtes restantes et je t'expliquerai "
                ],
                changeState:false,
                questsConditionsForNextState:[
                    "Quest7",
                    "Quest8",
                    "Quest9",
                ]
            }
        },
        6:{
            dialogue:{
                lines:[
                    "Tu as terminé ! Incroyable !",
                    "Je pense que tu es maintenant prêt à accepter ma dernière mission.",
                    "Mais d'abord, pour comprendre cette mission, je dois t'expliquer pourquoi tu t'es retrouvé dans ce monde.",
                    "Ce monde matérialise les souvenirs, les émotions, ainsi que les rêves des personnes qui vivent dans l'autre monde.",
                    "Ta venue ici n'est pas anodine, car tu as perdu la mémoire, et par conséquent, tes souvenirs se sont fragmentés.",
                    "Maintenant que tu as partiellement retrouvé la mémoire, il faut que je t'explique l'origine des monstres que tu as aperçus.",
                    "Ce sont des cauchemars qui viennent de la dernière pièce de puzzle manquante.",
                    "En effet, tu as vécu, semblerait-il, un vrai traumatisme, et tes douleurs, cauchemars et mauvais souvenirs se sont matérialisés dans notre monde.",
                    "Ils risquent de détruire complètement notre monde. C'est pourquoi il faut les éliminer avant que cela ne se produise.",
                    "Mais éliminer les monstres comme tu l'as fait ne résoudra pas la cause d'origine qui se trouve sur la deuxième île.",
                    "En effet, la source de ton traumatisme se trouve là-bas, et seul le propriétaire du traumatisme peut le vaincre.",
                    "Tu es donc le seul qui peut empêcher notre monde de disparaître. Ce sera ta dernière mission.",
                    "Tu trouveras d'ailleurs là-bas la pièce à l'origine de ton traumatisme.",
                    "Une fois que tu auras combattu ton traumatisme, reviens me voir, je te donnerai la dernière pièce.",
                    "Bonne chance, jeune homme !"
                ],
                changeState:true,
                questsConditionsForNextState: ["Quest10"]
            }
        },
        7:{
            dialogue:{
                lines:[
                    "Rends-toi sur la deuxième île, et combats la source des cauchemars."
                ],
                changeState:false,
                questsConditionsForNextState: ["Quest10"]
            }
        },
        8:{
            dialogue:{
                lines:[
                    "Je te suis infiniment reconnaissant.",
                    "Notre monde est sauvé grâce à toi. Tu as réussi à surpasser ton traumatisme.",
                    "Tu peux récupérer dorénavant la dernière pièce.",
                    "Malheureusement, ton séjour s'achèvera ici, et c'est ici que nous devrons nous quitter.",
                    "Je te souhaite le meilleur dans l'autre monde."
                ],
                changeState:false,
                questsConditionsForNextState: ["Quest10"]
            }
        }
    }    
}
