# 🗺️ **DreamLAG**

## 👥 Équipe de développement

* **Adrien Verstraelen**
* **Guilaye Diop**
* **Luc Duchamps**

---

## 🎮 Concept du jeu

*DreamLAG* est un jeu d’aventure 3D où le joueur incarne un personnage amnésique. Il doit reconstituer ses souvenirs, dispersés sous forme de pièces de puzzle, en explorant un univers onirique constitué d’îles flottantes. Le gameplay combine exploration, quêtes, combats, narration et résolution d’énigmes.

---

## 🧭 Objectif du joueur

L’objectif principal est de **retrouver et assembler les fragments de mémoire** du personnage en :

1. Explorant l’île principale pour collecter des pièces visibles ou cachées.
2. Accomplissant des quêtes données par un sorcier, PNJ clé, qui récompense avec des pièces de puzzle.
3. Débloquant la capacité de vol pour atteindre d’autres îles, dont la seconde, théâtre du combat final.
4. Vainquant le boss final après avoir rassemblé tous les souvenirs.

---

## 🌍 Univers du jeu

Le monde de *DreamLAG* se compose de :

* Une **île principale**, divisée en plusieurs zones d’intérêt (zones de quête, forêts, montagnes, points d’interaction).
* Une **seconde île**, accessible après le déblocage du vol, où se déroule le combat final.
* Des **îles flottantes intermédiaires** servant de points de repos entre les deux principales.

---

## 🧩 Système de quêtes et souvenirs

### Déroulement

Le sorcier propose des quêtes dans différentes zones. Le joueur doit souvent :

* Éliminer des monstres perturbant l’équilibre.
* Explorer et interagir avec l’environnement.

Chaque quête terminée offre une **pièce de puzzle**, fragment de mémoire du personnage.

### Types de quêtes

* **Quêtes simples** : exploration et élimination d’ennemis.
* **Quêtes complexes** : couvrant plusieurs zones, parfois avec un mini-boss.
* **Quête finale** : accès à la deuxième île et combat contre le boss final.

---

## 🕹️ Contrôles du joueur

| Action                  | Touche      |
| ----------------------- | ----------- |
| Avancer / Reculer       | W / S       |
| Aller à gauche / droite | A / D       |
| Sauter                  | Espace      |
| Voler                   | F           |
| Dash (course rapide)    | Maj gauche  |
| Attaquer                | Clic gauche |
| Interagir               | E           |
| Consulter souvenirs     | M           |

Les commandes s’adaptent selon l’état du jeu (dialogue, attaque, vol, etc.).

---

## ⚔️ Combats et ennemis

* Attaque au clic gauche avec gestion du cooldown.
* Ennemis variés par zone, avec un boss final nommé **GoblinBossMonster**.
* Les combats sont indispensables pour progresser dans les quêtes.

---

## 🧙‍♂️ PNJ : Le Sorcier

Le sorcier joue un rôle central :

* Fournir les quêtes.
* Débloquer des capacités (vol, accès boss final).
* Servir de guide narratif.

---

## 📋 Exemples de quêtes (via `QuestAsset`)

Chaque quête contient :

* Une ou plusieurs zones (`Area`)
* Une description narrative
* Une pièce de puzzle (nom et image)
* Un boss éventuel (ex : quête 10)

### Exemples :

* **Quest1** : Éliminer les monstres devant le village → Récompense : pièce7
* **Quest4** : Aider un fermier au sud de l'île → Récompense : pièce16
* **Quest10** : Nettoyer les îles menant à l’île finale et battre le boss → Récompense : pièce22

---

## 🔄 Système de récompense

* Chaque quête validée ajoute une **`MemoryPiece`** à l’inventaire.
* Les pièces s’affichent visuellement dans un puzzle global.

---

## 🧠 Fonctionnalités clés

* Exploration libre avec progression accessible.
* PNJ interactif (le sorcier) et gestion des quêtes.
* Combat simple avec cooldown.
* Système de progression via observables.
* Collecte et assemblage des souvenirs visuellement.
* Monde semi-ouvert avec îles flottantes.
* Régénération automatique de la santé (sans objets).
* Mode vol activable pour passer d’une île à l’autre.

---

## ✅ Améliorations potentielles pour futurs contributeurs

* Organiser les quêtes et zones selon une difficulté progressive.
* Ajouter un journal de quêtes avec sauvegarde pour un suivi optimal de la progression.
