# Spécifications Fonctionnelles - Claude Time Tracker

## 1. Vue d'ensemble du projet

### 1.1 Description générale
Claude Time Tracker est une application web monopage (SPA) de gestion du temps et de suivi de projets. Elle permet aux utilisateurs de suivre leur temps de présence, de gérer plusieurs projets simultanément et d'analyser leur productivité via des rapports détaillés.

### 1.2 Type d'application
- **Nature** : Application web monopage (SPA)
- **Portée** : Application locale mono-utilisateur
- **Plateforme cible** : Desktop uniquement (aucun support mobile)
- **Navigateur supporté** : Google Chrome (dernière version)
- **Stockage** : Local (IndexedDB du navigateur)

### 1.3 Philosophie de développement
- Zéro dépendance externe
- Pas de framework JavaScript
- Code vanilla (HTML5, CSS3, JavaScript ES6+)
- Pas de processus de build ou transpilation
- Fichiers statiques servis directement
- Méthodologie BEM pour le CSS
- Documentation JSDoc exhaustive

## 2. Stack technique

### 2.1 Technologies principales
- **HTML5** : Structure sémantique
- **JavaScript ES6+** : Logique applicative avec modules natifs
- **CSS3** : Styles avec méthodologie BEM stricte
- **IndexedDB** : Persistence des données côté client

### 2.2 Caractéristiques techniques
- ~9 500+ lignes de JavaScript réparties sur 27 fichiers
- ~2 200 lignes de CSS
- Plus de 100 tests unitaires
- Architecture MVC simplifiée
- Framework de test custom (pas de Jest/Mocha)

### 2.3 Outils de développement
- **Tests** : Framework de test custom (`tests/test-runner.js`)
- **Serveur local** : Python HTTP server ou Live Server pour le développement
- **Déploiement** : GitHub Pages via GitHub Actions
- **CI/CD** : GitHub Actions (`.github/workflows/deploy.yml`)

## 3. Architecture du projet

### 3.1 Structure des répertoires
```
/
├── index.html                  # Point d'entrée principal
├── app.js                      # Contrôleur principal (1,134 lignes)
├── style.css                   # Styles globaux BEM (2,197 lignes)
├── favicon.svg
├── js/                         # Modules JavaScript
│   ├── storage.js              # Service IndexedDB
│   ├── time-entry.js           # Modèle TimeEntry
│   ├── project.js              # Modèle Project
│   ├── project-session.js      # Modèle ProjectSession
│   ├── calculator.js           # Logique de calculs
│   ├── timer.js                # Service de timer
│   ├── ui.js                   # Contrôleur UI principal
│   ├── utils.js                # Fonctions utilitaires
│   ├── projects-ui.js          # UI section projets
│   ├── project-timer-ui.js     # UI timer de projet
│   ├── reports-ui.js           # UI rapports (980 lignes)
│   ├── weekly-report.js        # Calculs de rapports
│   ├── entries-management-ui.js # UI gestion des entrées
│   ├── sessions-management-ui.js # UI gestion des sessions
│   ├── popover.js              # Composants modaux
│   ├── day-timeline.js         # Visualisation timeline
│   └── data-export.js          # Export CSV/JSON
├── tests/                      # Suite de tests
│   ├── test-runner.html
│   ├── test-runner.js
│   ├── calculator.test.js
│   ├── storage.test.js
│   ├── utils.test.js
│   └── [autres fichiers de tests]
└── .github/workflows/          # CI/CD
    ├── deploy.yml
    └── claude.yml
```

### 3.2 Pattern architectural
**MVC simplifié** :
- **Model** : Classes `TimeEntry`, `Project`, `ProjectSession`
- **View** : Composants UI (`TimeTrackerUI`, `ProjectsUI`, `ReportsUI`, etc.)
- **Controller** : Classe `App` principale orchestrant tous les modules

### 3.3 Composants principaux

#### 3.3.1 Classes de base
- **App** (`app.js`) : Contrôleur principal orchestrant tous les modules
- **StorageService** : Opérations CRUD sur IndexedDB avec API basée sur les Promises
- **TimeEntry** : Modèle pour les entrées de pointage (clock in/out/break)
- **Project** : Modèle pour les entités projet
- **ProjectSession** : Modèle pour les sessions de travail chronométrées
- **TimeCalculator** : Logique métier pour calculs et validations
- **ProjectTimer** : Service de timer avec callbacks sur tick
- **WeeklyReportCalculator** : Calculs de rapports par période

#### 3.3.2 Composants UI
- **TimeTrackerUI** : Interface de suivi de présence principale
- **ProjectsUI** : Interface de gestion des projets
- **ProjectTimerUI** : Affichage du timer et statistiques projet
- **ReportsUI** : Rapports hebdomadaires/mensuels avec tableaux interactifs
- **EntriesManagementUI** : Édition complète des entrées
- **SessionsManagementUI** : Gestion et édition des sessions
- **DayTimeline** : Timeline visuelle des activités quotidiennes
- **Popover** : Classe de base pour les dialogues modaux
- **AddProjectPopover** : Modal de création de projet
- **AddRetroactiveTimePopover** : Ajout manuel de temps
- **EditSessionPopover** : Édition de session avec validation

#### 3.3.3 Modules utilitaires
- **utils.js** : Fonctions helper (formatDuration, formatTime, formatDate, createElement, escapeHtml, sanitizeForCSV)
- **data-export.js** : Fonctionnalités d'export CSV/JSON

## 4. Modèle de données

### 4.1 Base de données
- **Système** : IndexedDB
- **Nom** : `TimeTrackerDB`
- **Version** : 1

### 4.2 Object Stores

#### 4.2.1 timeEntries - Entrées de pointage
Stocke les événements de pointage (arrivée, pause, reprise, départ).

**Structure** :
```javascript
{
  id: string,              // UUID unique
  type: string,            // 'clock-in' | 'break-start' | 'break-end' | 'clock-out'
  timestamp: string,       // ISO8601 (ex: "2025-11-26T09:00:00.000Z")
  date: string,            // Format 'YYYY-MM-DD' (ex: "2025-11-26")
  note: string             // Optionnel, note associée à l'entrée
}
```

**Index** :
- `date` : Recherche rapide par date
- `timestamp` : Tri chronologique

**Types d'entrées** :
- `clock-in` : Arrivée au travail
- `break-start` : Début de pause
- `break-end` : Fin de pause
- `clock-out` : Départ du travail

#### 4.2.2 projects - Projets
Stocke les définitions des projets.

**Structure** :
```javascript
{
  id: string,              // ID généré automatiquement
  name: string,            // Nom du projet (unique)
  timeSpent: number,       // Temps total en millisecondes
  active: boolean,         // Indique si le projet est actif
  createdAt: string,       // ISO8601, date de création
  updatedAt: string        // ISO8601, date de dernière modification
}
```

**Index** :
- `name` : Recherche par nom
- `active` : Filtrage des projets actifs

#### 4.2.3 projectSessions - Sessions de travail
Stocke les sessions de travail chronométrées sur les projets.

**Structure** :
```javascript
{
  id: string,              // ID généré automatiquement
  projectId: string,       // Clé étrangère vers projects
  startTime: string,       // ISO8601, début de session
  endTime: string | null,  // ISO8601, fin de session (null si en cours)
  duration: number,        // Durée en millisecondes
  date: string             // Format 'YYYY-MM-DD', date de la session
}
```

**Index** :
- `projectId` : Recherche des sessions par projet
- `date` : Recherche des sessions par date
- `startTime` : Tri chronologique

### 4.3 Relations entre les données
- **One-to-Many** : Project → ProjectSessions (un projet peut avoir plusieurs sessions)
- Les sessions sont liées aux projets via `projectId`
- Les `TimeEntry` sont indépendantes (suivent la présence globale)
- Les `ProjectSession` suivent le temps de travail effectif sur les projets

### 4.4 Règles de gestion des données
- Les timestamps sont toujours en ISO8601
- Les durées sont en millisecondes
- Les dates sont au format 'YYYY-MM-DD'
- Un seul timer de projet peut être actif à la fois
- Les sessions peuvent chevaucher des pauses mais pas d'autres sessions
- Les entrées doivent suivre une séquence logique (clock-in → break-start → break-end → clock-out)

## 5. Fonctionnalités détaillées

### 5.1 Phase 1 - MVP (Suivi du temps de présence)

#### 5.1.1 Système de pointage
- **Clock In** : Enregistrement de l'heure d'arrivée
- **Clock Out** : Enregistrement de l'heure de départ
- **Gestion des pauses** :
  - Support de multiples pauses (pas seulement le déjeuner)
  - Boutons Break Start / Break End
  - Calcul automatique du temps de pause total

#### 5.1.2 Calcul du temps de présence
- **Temps de présence en temps réel** : Mise à jour automatique chaque seconde
- **Objectif journalier** : 8 heures par défaut
- **Barre de progression** : Visualisation du pourcentage de l'objectif atteint
- **Indicateur de statut du jour** :
  - Jour actif (pointé)
  - Jour terminé
  - Objectif atteint

#### 5.1.3 Historique des entrées
- **Affichage** : Liste chronologique des entrées de la journée
- **Actions disponibles** :
  - Édition d'une entrée (modification de l'heure et de la note)
  - Suppression d'une entrée
  - Ajout d'une note
- **Interface** : Zone repliable dans la barre de présence quotidienne

### 5.2 Phase 2 - Suivi de projets

#### 5.2.1 Gestion des projets
- **Création de projet** :
  - Nom unique requis
  - Validation en temps réel
  - Modal dédié
- **Édition de projet** :
  - Modification du nom
  - Validation d'unicité
- **Suppression de projet** :
  - Confirmation requise
  - Suppression en cascade des sessions associées
- **Liste des projets** :
  - Affichage en tableau
  - Tri par nom ou temps passé
  - Indication visuelle du projet actif

#### 5.2.2 Timer de projet
- **Démarrage** : Bouton Start sur un projet
- **Arrêt** : Bouton Stop
- **Changement de projet** :
  - Arrêt automatique du timer en cours
  - Démarrage du nouveau timer
- **Affichage** :
  - Timer compact en haut de page
  - Nom du projet en cours
  - Durée écoulée (format HH:MM:SS)
  - Mise à jour en temps réel (chaque seconde)

#### 5.2.3 Statistiques quotidiennes de projets
- **Affichage par projet** :
  - Temps total passé dans la journée
  - Pourcentage du temps total travaillé
  - Nombre de sessions
- **Cartes de statistiques** :
  - Une carte par projet actif
  - Mise en évidence du projet en cours
  - Animation et indicateurs visuels
- **Calculs** :
  - Temps total de tous les projets
  - Distribution en pourcentage
  - Comparaison avec le temps de présence

### 5.3 Phase 3 - Rapports et analyses

#### 5.3.1 Rapports périodiques
- **Types de périodes** :
  - Hebdomadaire (lundi au dimanche)
  - Mensuel (1er au dernier jour du mois)
- **Navigation** :
  - Boutons Précédent/Suivant
  - Sélection de la période actuelle
  - Indication visuelle de la période affichée

#### 5.3.2 Statistiques de période
- **Résumé global** :
  - Nombre de jours travaillés
  - Temps de présence total
  - Temps de projet total
  - Écart entre présence et projets (temps non affecté)
- **Détail par jour** :
  - Date et jour de la semaine
  - Temps de présence
  - Temps de projet
  - Écart
  - Indicateur d'objectif atteint
- **Tableaux interactifs** :
  - Clic sur un jour pour voir le détail
  - Codes couleur pour les statuts
  - Totaux et moyennes

#### 5.3.3 Visualisation de la timeline journalière
- **Day Timeline** :
  - Représentation graphique de la journée (0h à 24h)
  - Blocs colorés pour :
    - Temps de travail (vert)
    - Temps de pause (orange)
    - Temps hors travail (gris)
  - Tooltip au survol avec détails
  - Échelle temporelle

#### 5.3.4 Vue détaillée d'un jour
- **Modal de détails** :
  - Liste complète des entrées de pointage
  - Liste complète des sessions de projet
  - Timeline visuelle intégrée
  - Statistiques du jour
  - Actions d'édition disponibles

### 5.4 Phase 4 - Gestion des données

#### 5.4.1 Export de données
- **Formats disponibles** :
  - CSV (compatible Excel)
  - JSON (sauvegarde complète)
- **Types d'export** :
  - Export des entrées de temps
  - Export des sessions de projet
  - Export des rapports (semaine ou mois)
- **Contenu CSV** :
  - En-têtes de colonnes
  - Données formatées et échappées
  - Compatible avec les caractères spéciaux

#### 5.4.2 Gestion complète des entrées
- **Interface dédiée** :
  - Overlay plein écran
  - Liste de toutes les entrées
  - Filtres par date
  - Recherche
- **Actions disponibles** :
  - Édition d'entrée (timestamp, type, note)
  - Suppression d'entrée
  - Ajout rétroactif de temps
- **Validations** :
  - Séquence logique des types
  - Pas de chevauchements
  - Format des timestamps

#### 5.4.3 Gestion des sessions
- **Interface d'édition** :
  - Liste des sessions par projet
  - Filtres et tri
- **Actions** :
  - Édition des heures de début/fin
  - Suppression de session
  - Validation des chevauchements
- **Calculs automatiques** :
  - Recalcul de la durée
  - Mise à jour du temps total du projet
  - Vérification de cohérence

#### 5.4.4 Ajout de temps rétroactif
- **Fonctionnalité** :
  - Ajout manuel de temps passé sur un projet
  - Sélection de la date
  - Sélection du projet
  - Définition de la durée
- **Utilisation** :
  - Correction d'oublis
  - Ajout de temps passé hors ligne
  - Import de données historiques

## 6. Interface utilisateur

### 6.1 Structure de la page unique

#### 6.1.1 Header
- Titre de l'application
- Logo/branding
- Navigation (si applicable)

#### 6.1.2 Barre de présence quotidienne (sticky)
- **Position** : Fixe en haut de page
- **Contenu** :
  - Indicateur de statut du jour (complété, actif, non commencé)
  - Affichage du temps de présence (HH:MM:SS)
  - Barre de progression vers l'objectif de 8h
  - Boutons d'action (Clock In, Break Start/End, Clock Out)
  - Historique des entrées (zone repliable)

#### 6.1.3 Zone de timer de projet
- **Affichage compact horizontal**
- **Contenu** :
  - Nom du projet en cours
  - Timer en cours (HH:MM:SS)
  - Bouton Stop
- **État** : Visible uniquement si un timer est actif

#### 6.1.4 Section Projets
- **Tableau des projets** :
  - Colonnes : Nom, Temps total, Actions
  - Actions par ligne : Start, Edit, Delete
  - Tri par nom ou temps
- **Bouton d'ajout** : "Add Project"
- **Statistiques quotidiennes** :
  - Cartes de statistiques par projet
  - Temps et pourcentage
  - Projet actif mis en évidence

#### 6.1.5 Timeline de la journée
- **Visualisation graphique** :
  - Barre horizontale représentant 24h
  - Segments colorés (travail, pause, hors-travail)
  - Tooltips interactifs
- **Position** : Sous la section projets

#### 6.1.6 Section Rapports
- **Sélecteur de période** :
  - Toggle Semaine/Mois
  - Navigation Précédent/Suivant
  - Indication de la période actuelle
- **Résumé de période** :
  - Jours travaillés
  - Temps de présence total
  - Temps de projet total
  - Écart
- **Tableau détaillé** :
  - Une ligne par jour
  - Colonnes : Date, Présence, Projets, Écart, Statut
  - Ligne de totaux
  - Lignes cliquables pour détails

#### 6.1.7 Modals et Popovers
- **Add Project** : Création de projet
- **Edit Project** : Modification de projet
- **Add Retroactive Time** : Ajout de temps manuel
- **Edit Session** : Modification de session
- **Day Details** : Vue détaillée d'un jour avec timeline
- **Entries Management** : Gestion complète des entrées (plein écran)
- **Sessions Management** : Gestion des sessions

### 6.2 Méthodologie CSS

#### 6.2.1 Convention BEM stricte
- **Block** : Composant autonome (ex: `.daily-presence-bar`)
- **Element** : Partie du block (ex: `.daily-presence-bar__status`)
- **Modifier** : Variation (ex: `.daily-presence-bar__status--completed`)

#### 6.2.2 Variables CSS
- Utilisation de custom properties pour :
  - Couleurs (palette de couleurs)
  - Espacements
  - Tailles de police
  - Transitions

#### 6.2.3 Principes
- Pas de media queries (desktop uniquement)
- Grilles et flexbox pour les layouts
- Transitions pour les interactions
- Cohérence visuelle stricte

### 6.3 Principes d'expérience utilisateur
- **Feedback immédiat** : Toutes les actions ont un retour visuel
- **Prévention d'erreurs** : Validations en temps réel
- **Confirmations** : Pour les actions destructives
- **États clairs** : Indicateurs visuels pour tous les états
- **Responsive feedback** : Mise à jour en temps réel des données
- **Tooltips** : Aide contextuelle au survol

## 7. Règles de gestion et validations

### 7.1 Règles de pointage
1. **Séquence obligatoire** : clock-in → [break-start → break-end]* → clock-out
2. **Unicité** : Un seul clock-in et un seul clock-out par jour
3. **Paires de pauses** : Chaque break-start doit avoir un break-end correspondant
4. **Chronologie** : Les timestamps doivent être dans l'ordre chronologique
5. **Date cohérente** : Toutes les entrées d'une journée doivent avoir la même date

### 7.2 Règles de projets
1. **Nom unique** : Deux projets ne peuvent pas avoir le même nom
2. **Nom requis** : Un projet doit avoir un nom non vide
3. **Timer unique** : Un seul projet peut avoir un timer actif à la fois
4. **Sessions fermées** : Arrêt automatique du timer en cours avant d'en démarrer un nouveau
5. **Suppression en cascade** : La suppression d'un projet supprime toutes ses sessions

### 7.3 Règles de sessions
1. **Projet existant** : Une session doit être liée à un projet existant
2. **Dates valides** : startTime doit être avant endTime
3. **Pas de chevauchement** : Les sessions d'un même projet ne peuvent pas se chevaucher
4. **Durée cohérente** : duration = endTime - startTime
5. **Date de session** : Dérivée de startTime (date au format YYYY-MM-DD)

### 7.4 Calculs et formules

#### 7.4.1 Temps de présence
```
Temps de présence = Σ(break-end - break-start) +
                    (clock-out ou now - clock-in) -
                    Temps de pause total
```

#### 7.4.2 Temps de pause
```
Temps de pause = Σ(break-end - break-start)
```

#### 7.4.3 Progression vers objectif
```
Pourcentage = (Temps de présence / Objectif) × 100
Objectif par défaut = 8 heures = 28 800 000 ms
```

#### 7.4.4 Temps de projet
```
Temps de projet = Σ(durée de toutes les sessions du projet)
```

#### 7.4.5 Pourcentage par projet
```
Pourcentage projet = (Temps projet / Temps total tous projets) × 100
```

## 8. Sécurité et confidentialité

### 8.1 Stockage local
- **Aucun serveur** : Toutes les données restent sur le device de l'utilisateur
- **Aucune transmission** : Aucune donnée n'est envoyée à un serveur externe
- **IndexedDB** : Stockage sécurisé dans le navigateur
- **Isolation** : Les données sont isolées par origine (same-origin policy)

### 8.2 Authentification
- **Aucune authentification** : Application mono-utilisateur locale
- **Pas de compte** : Pas de système de login/signup
- **Pas de gestion d'utilisateurs** : Un seul utilisateur implicite

### 8.3 Protection des données
- **XSS** : Échappement HTML systématique (escapeHtml dans utils.js)
- **Injection** : Sanitization pour les exports CSV (sanitizeForCSV)
- **Validation** : Validation stricte des entrées utilisateur
- **Types stricts** : Vérification des types de données

## 9. Tests

### 9.1 Framework de test
- **Custom test runner** : Framework de test maison (`tests/test-runner.js`)
- **Classe Assert** : Bibliothèque d'assertions complète
- **Exécution** : Via navigateur (`tests/test-runner.html`)
- **Isolation** : Chaque test est isolé

### 9.2 Couverture de tests
Plus de 100 tests unitaires couvrant :
- **calculator.test.js** : Logique de calcul des temps
- **storage.test.js** : Opérations IndexedDB
- **utils.test.js** : Fonctions utilitaires
- **time-entry.test.js** : Modèle TimeEntry
- **project-session.test.js** : Modèle ProjectSession
- **weekly-report.test.js** : Calculs de rapports
- **data-export.test.js** : Export de données

### 9.3 Types de tests
- **Tests unitaires** : Fonctions et méthodes isolées
- **Tests de modèle** : Validation des classes de données
- **Tests de calcul** : Vérification des formules
- **Tests de stockage** : Opérations CRUD
- **Tests d'export** : Génération de CSV/JSON

### 9.4 Assertions disponibles
- `assertEqual(actual, expected, message)`
- `assertNotEqual(actual, expected, message)`
- `assertTrue(value, message)`
- `assertFalse(value, message)`
- `assertThrows(fn, message)`
- `assertDeepEqual(actual, expected, message)`

## 10. Déploiement et CI/CD

### 10.1 Environnement de développement
- **Serveur local** : Python SimpleHTTPServer ou VS Code Live Server
- **URL locale** : `http://localhost:8000` (ou autre port)
- **Hot reload** : Via Live Server (optionnel)
- **Tests** : Accès via `http://localhost:8000/tests/test-runner.html`

### 10.2 Build et déploiement
- **Pas de build** : Les fichiers sont servis tels quels
- **Optimisation** : Aucune minification ou bundling
- **Assets** : Tous les fichiers sont copiés directement

### 10.3 GitHub Pages
- **Plateforme** : GitHub Pages
- **URL** : `https://<username>.github.io/claude-task-tracker/`
- **Configuration** : `.nojekyll` pour désactiver Jekyll
- **Branche de déploiement** : gh-pages (générée automatiquement)

### 10.4 GitHub Actions
**Workflow de déploiement** (`.github/workflows/deploy.yml`) :
1. Déclenchement : Push sur main/master ou déclenchement manuel
2. Checkout du code
3. Configuration de GitHub Pages
4. Upload des fichiers depuis la racine
5. Déploiement sur GitHub Pages

**Workflow CI** (`.github/workflows/claude.yml`) :
- Vérifications de qualité
- Exécution des tests (si configuré)

### 10.5 Process de release
1. Développement et tests en local
2. Commit des changements
3. Push sur la branche main/master
4. Déclenchement automatique du workflow GitHub Actions
5. Déploiement automatique sur GitHub Pages
6. Vérification de la production

## 11. Extensibilité et évolutions futures

### 11.1 Évolutions possibles
- **Multi-utilisateur** : Ajout d'authentification et de stockage cloud
- **Mobile** : Version responsive ou application mobile
- **Sync cloud** : Synchronisation entre devices
- **Notifications** : Rappels et alertes
- **Rapports avancés** : Graphiques, statistiques avancées
- **Export avancé** : PDF, Excel avec formules
- **Intégrations** : APIs tierces (calendrier, Jira, etc.)
- **Objectifs personnalisables** : Objectifs par jour, projet, etc.
- **Catégories de projets** : Groupement et hiérarchie
- **Tags** : Étiquetage des projets et sessions

### 11.2 Architecture extensible
- **Modularité** : Code organisé en modules ES6
- **Séparation des préoccupations** : MVC respecté
- **Interfaces claires** : APIs bien définies entre modules
- **Extensibilité du stockage** : StorageService abstrait l'accès aux données
- **Composants UI réutilisables** : Popovers, cartes, etc.

### 11.3 Points d'extension
- **Nouveaux types d'entrées** : Extension de l'enum type dans TimeEntry
- **Nouveaux calculs** : Ajout de méthodes dans TimeCalculator
- **Nouveaux rapports** : Nouveaux calculateurs de rapports
- **Nouveaux exports** : Extension de data-export.js
- **Nouveaux composants UI** : Extension de Popover ou création de nouveaux composants

## 12. Contraintes et limitations

### 12.1 Contraintes techniques
- **Navigateur unique** : Chrome uniquement (dernière version)
- **Desktop uniquement** : Aucun support mobile ou tablette
- **Stockage local** : Limité par les quotas IndexedDB du navigateur (~50 MB minimum)
- **Pas de sync** : Données liées au navigateur et à l'appareil
- **Offline only** : Aucune fonctionnalité en ligne

### 12.2 Limitations fonctionnelles
- **Mono-utilisateur** : Pas de gestion multi-utilisateurs
- **Pas de collaboration** : Impossible de partager des données entre utilisateurs
- **Pas de backup automatique** : L'utilisateur doit exporter manuellement
- **Historique limité** : Limité par le stockage du navigateur
- **Pas de rapports complexes** : Rapports basiques uniquement

### 12.3 Limitations de performance
- **Calculs côté client** : Performance dépendante du device
- **Grande quantité de données** : Peut ralentir avec des années de données
- **Pas de pagination** : Toutes les données sont chargées en mémoire
- **Pas de lazy loading** : Composants chargés immédiatement

### 12.4 Compatibilité
- **Chrome** : Dernière version recommandée
- **Pas de polyfills** : Utilise des fonctionnalités ES6+ natives
- **IndexedDB requis** : Ne fonctionne pas sans IndexedDB
- **JavaScript activé** : Application entièrement client-side

## 13. Documentation et maintenance

### 13.1 Documentation du code
- **JSDoc** : Commentaires JSDoc exhaustifs sur toutes les classes et méthodes
- **Commentaires inline** : Explication des logiques complexes
- **README** : Documentation utilisateur et développeur
- **Ce document** : Spécifications fonctionnelles complètes

### 13.2 Convention de code
- **ES6+** : Utilisation des fonctionnalités modernes JavaScript
- **Classes** : Programmation orientée objet
- **Modules** : Organisation modulaire
- **BEM** : Méthodologie stricte pour CSS
- **Camel case** : Convention de nommage JavaScript
- **Kebab case** : Convention de nommage CSS

### 13.3 Gestion des versions
- **Git** : Contrôle de version
- **GitHub** : Hébergement du code
- **Branches** : Développement sur branches feature
- **Pull Requests** : Revue de code avant merge
- **Releases** : Tags Git pour les versions

### 13.4 Support et maintenance
- **Issues GitHub** : Suivi des bugs et demandes de fonctionnalités
- **Pull Requests** : Contributions externes
- **Documentation** : Maintenue à jour avec le code
- **Tests** : Exécutés avant chaque release

## 14. Glossaire

- **Clock In** : Pointage d'arrivée au travail
- **Clock Out** : Pointage de départ du travail
- **Break** : Pause (déjeuner, café, etc.)
- **Presence Time** : Temps de présence total (arrivée à départ moins pauses)
- **Project Time** : Temps passé sur des projets spécifiques
- **Session** : Période de travail chronométrée sur un projet
- **Timer** : Chronomètre actif pour un projet
- **Entry** : Entrée de pointage (clock-in, break, clock-out)
- **Day Timeline** : Visualisation graphique de la journée de travail
- **Retroactive Time** : Temps ajouté manuellement après coup
- **BEM** : Block Element Modifier (méthodologie CSS)
- **IndexedDB** : Base de données NoSQL du navigateur
- **SPA** : Single Page Application (application monopage)

---

**Version** : 1.0
**Date** : 2025-11-26
**Auteur** : Généré par analyse du codebase Claude Time Tracker
