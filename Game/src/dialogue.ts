export interface Dialogue{
    lines: string[];
}


export interface Dialogues{
    [state: number] : Dialogue
}

export interface DialogueAssets{
    [characterName: string]: Dialogues
}

export const dialoguesAssets: DialogueAssets= 
    {
        "Merlin":{
            0:{
                lines: [
                    "Salut, je m'appelle Merlin, le légendaire magicien de DreamLand!",
                    "Je suis ici pout te donner des quêtes"
                ]
            }
        }
        
        
    }
