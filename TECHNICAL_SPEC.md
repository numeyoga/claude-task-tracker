# Claude Time Tracker - Spécifications Techniques

## 📋 Description du Projet

**Claude Time Tracker** est une application web de suivi du temps de travail développée en technologies web natives. L'application permet à un utilisateur unique de :
- Pointer ses heures d'arrivée et de départ
- Suivre le temps passé par projet chaque jour
- Consulter un bilan hebdomadaire de son activité
- Vérifier qu'il a bien effectué ses 8 heures de présence quotidienne

### Caractéristiques principales
- Application single-page (SPA)
- Aucune dépendance externe (pas de framework)
- Stockage local via IndexedDB
- Interface moderne et responsive
- Déploiement sur GitHub Pages / GitLab Pages
- Système de tests intégré sans dépendance externe

---

## 🎯 Fonctionnalités

### Phase 1 - MVP (Système de pointage)
- [ ] Pointer l'heure d'arrivée le matin
- [ ] Pointer le début de la pause repas
- [ ] Pointer la fin de la pause repas
- [ ] Pointer l'heure de départ le soir
- [ ] Afficher le temps de présence du jour (objectif: 8h)
- [ ] Visualiser les pointages du jour en cours
- [ ] Historique des pointages des jours précédents

### Phase 2 - Suivi par projet
- [ ] Créer/modifier/supprimer des projets
- [ ] Démarrer un chronomètre pour un projet
- [ ] Arrêter le chronomètre
- [ ] Basculer d'un projet à un autre
- [ ] Afficher le temps passé par projet pour la journée
- [ ] Visualiser la répartition du temps en pourcentage

### Phase 3 - Rapports et statistiques
- [ ] Bilan hebdomadaire (temps par projet)
- [ ] Graphiques de répartition du temps
- [ ] Total des heures travaillées sur la semaine
- [ ] Détection des jours incomplets (<8h)
- [ ] Export des données (CSV/JSON)
- [ ] Filtrer par période (semaine, mois)

### Phase 4 - Fonctionnalités avancées
- [ ] Objectifs de temps par projet
- [ ] Notifications de rappel de pointage
- [ ] Catégories de projets
- [ ] Notes sur les sessions de travail
- [ ] Thème sombre/clair
- [ ] Import/Export de données

---

## 🛠️ Stack Technique

### Technologies
- **HTML5** - Version la plus récente
- **Vanilla JavaScript** (ES6+) - Pas de framework
- **Vanilla CSS3** - Pas de préprocesseur
- **IndexedDB** - Stockage des données côté client

### Navigateur cible
- **Chrome Desktop** - Dernière version stable
- Pas de support multi-navigateur requis
- Pas de support mobile requis

### Méthodologie CSS
- **BEM (Block Element Modifier)** - Obligatoire pour toutes les classes CSS

---

## 📁 Structure du Projet

```
claude-task-tracker/
├── index.html              # Point d'entrée de l'application
├── style.css              # Styles globaux et composants
├── app.js                 # Point d'entrée JavaScript
├── js/                    # Modules JavaScript
│   ├── storage.js         # Gestion IndexedDB
│   ├── time-entry.js      # Modèle TimeEntry (pointages)
│   ├── project.js         # Modèle Project
│   ├── timer.js           # Gestion du chronomètre
│   ├── calculator.js      # Calculs de temps et statistiques
│   ├── ui.js              # Gestion de l'interface
│   └── utils.js           # Fonctions utilitaires
├── tests/                 # Tests unitaires
│   ├── test-runner.html   # Page d'exécution des tests
│   ├── test-runner.js     # Framework de tests minimaliste
│   ├── storage.test.js    # Tests du storage
│   ├── calculator.test.js # Tests des calculs
│   └── utils.test.js      # Tests des utilitaires
├── css/                   # Fichiers CSS modulaires (optionnel)
│   ├── base.css           # Reset et styles de base
│   ├── variables.css      # Variables CSS
│   └── components.css     # Styles des composants
├── assets/                # Ressources statiques
│   ├── images/
│   └── icons/
├── README.md              # Documentation utilisateur
├── TECHNICAL_SPEC.md      # Ce document
└── LICENSE
```

---

## 🎨 Conventions de Code

### Nommage BEM pour CSS

#### Structure
```
.block { }
.block__element { }
.block--modifier { }
.block__element--modifier { }
```

#### Exemples pour le time tracker
```css
/* ✅ Correct */
.clock-in { }
.clock-in__button { }
.clock-in__time { }
.clock-in--disabled { }
.clock-in__button--active { }

.project-card { }
.project-card__title { }
.project-card__timer { }
.project-card--running { }

.weekly-report { }
.weekly-report__header { }
.weekly-report__chart { }
.weekly-report__row { }

/* ❌ Incorrect */
.clockIn { }
.clock-in-button { }
.active-project { }
```

#### Règles BEM strictes
1. Un bloc représente un composant indépendant (`.clock-in`, `.project-card`, `.weekly-report`)
2. Un élément est une partie du bloc (`.clock-in__button`, `.project-card__timer`)
3. Un modificateur change l'apparence ou le comportement (`.button--primary`, `.project-card--running`)
4. Pas de double underscore sauf pour séparer bloc et élément
5. Pas d'imbrication de blocs dans les noms de classe

### Variables CSS

#### Nommage
```css
/* Format: --category-property-variant */
:root {
    /* Couleurs */
    --color-primary: #2563eb;
    --color-primary-dark: #1e40af;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-danger: #ef4444;
    --color-text: #1e293b;
    --color-text-secondary: #64748b;
    --color-background: #f8fafc;
    --color-surface: #ffffff;
    --color-border: #e2e8f0;

    /* Espacements */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;

    /* Typographie */
    --font-family: sans-serif;
    --font-size-base: 16px;
    --font-size-sm: 0.875rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.5rem;
    --font-size-2xl: 2rem;

    /* Ombres */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

    /* Rayons */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
}
```

### JavaScript

#### Nommage
```javascript
// Classes: PascalCase
class TimeEntry { }
class ProjectTimer { }
class StorageService { }

// Fonctions et variables: camelCase
function clockIn() { }
function calculateWorkTime() { }
const currentProject = null;
let isTimerRunning = false;

// Constantes: UPPER_SNAKE_CASE
const DB_NAME = 'TimeTrackerDB';
const DB_VERSION = 1;
const WORK_DAY_HOURS = 8;
const MILLISECONDS_PER_HOUR = 3600000;

// Fichiers: kebab-case
// time-entry.js, project-timer.js, storage-service.js
```

#### Organisation du code
```javascript
/**
 * Description de la classe/fonction
 * @param {Type} param - Description du paramètre
 * @returns {Type} Description du retour
 */
class ComponentName {
    constructor() {
        // Propriétés privées en premier (avec #)
        this.#privateProperty = null;

        // Propriétés publiques
        this.publicProperty = null;

        // Initialisation
        this.init();
    }

    // ======================
    // Méthodes publiques
    // ======================

    publicMethod() { }

    // ======================
    // Méthodes privées
    // ======================

    #privateMethod() { }
}
```

#### Modules ES6
```javascript
// Utiliser 'use strict' en haut de chaque fichier
'use strict';

// Exports nommés préférés aux exports par défaut
export class TimeEntry { }
export function calculateDuration() { }

// Import
import { TimeEntry, calculateDuration } from './time-entry.js';
```

---

## 🏗️ Architecture

### Pattern MVC Simplifié

#### Model
- Représente les données (TimeEntry, Project)
- Logique métier (calculs de durée, validation)
- Gestion du stockage (IndexedDB)

#### View
- Manipulation du DOM
- Rendu des composants
- Gestion des événements UI

#### Controller
- Coordination entre Model et View
- Gestion de l'état de l'application
- Logique de contrôle du timer

### Exemple d'organisation
```javascript
// Model: time-entry.js
export class TimeEntry {
    constructor(type, timestamp = new Date()) {
        this.id = crypto.randomUUID();
        this.type = type; // 'clock-in', 'lunch-start', 'lunch-end', 'clock-out'
        this.timestamp = timestamp;
        this.date = this.#getDateString(timestamp);
    }

    #getDateString(date) {
        return date.toISOString().split('T')[0];
    }
}

// Model: project.js
export class Project {
    constructor(name, color = '#2563eb') {
        this.id = crypto.randomUUID();
        this.name = name;
        this.color = color;
        this.createdAt = new Date();
    }
}

// Service: calculator.js
export class TimeCalculator {
    /**
     * Calcule le temps de présence à partir des pointages
     * @param {TimeEntry[]} entries - Liste des pointages du jour
     * @returns {number} Durée en millisecondes
     */
    calculatePresenceTime(entries) {
        // Logique de calcul
    }

    /**
     * Vérifie si l'objectif de 8h est atteint
     * @param {number} duration - Durée en millisecondes
     * @returns {boolean}
     */
    isWorkDayComplete(duration) {
        return duration >= WORK_DAY_HOURS * MILLISECONDS_PER_HOUR;
    }
}

// View: ui.js
export class TimeTrackerUI {
    renderClockInButton(isDisabled) {
        // Création des éléments DOM
    }

    updatePresenceTime(duration) {
        // Mise à jour visuelle
    }
}

// Controller: app.js
class App {
    constructor() {
        this.storage = new StorageService();
        this.calculator = new TimeCalculator();
        this.ui = new TimeTrackerUI();
        this.init();
    }

    async init() {
        await this.storage.init();
        await this.loadTodayEntries();
        this.setupEventListeners();
    }

    async handleClockIn() {
        const entry = new TimeEntry('clock-in');
        await this.storage.saveEntry(entry);
        this.updateUI();
    }
}
```

---

## 💾 Gestion des Données - IndexedDB

### Structure de la base de données

```javascript
const DB_NAME = 'TimeTrackerDB';
const DB_VERSION = 1;

// Object Stores
const STORES = {
    TIME_ENTRIES: 'timeEntries',
    PROJECTS: 'projects',
    PROJECT_SESSIONS: 'projectSessions'
};

// Schema TimeEntry (Pointages)
{
    id: 'uuid-string',              // Clé primaire
    type: 'clock-in|lunch-start|lunch-end|clock-out', // Type de pointage
    timestamp: Date,                // Date et heure exacte
    date: 'YYYY-MM-DD',            // Date au format string (pour filtrage)
    note: 'string'                  // Note optionnelle
}

// Index pour timeEntries
- id (keyPath, unique)
- date (pour récupérer les entrées d'un jour)
- timestamp (pour trier chronologiquement)

// Schema Project
{
    id: 'uuid-string',              // Clé primaire
    name: 'string',                 // Nom du projet
    color: '#hex',                  // Couleur d'affichage
    active: boolean,                // Projet actif ou archivé
    createdAt: Date,
    updatedAt: Date
}

// Index pour projects
- id (keyPath, unique)
- name
- active

// Schema ProjectSession (Temps par projet)
{
    id: 'uuid-string',              // Clé primaire
    projectId: 'uuid-string',       // Référence au projet
    startTime: Date,                // Début de la session
    endTime: Date,                  // Fin de la session (null si en cours)
    duration: number,               // Durée en millisecondes (calculé)
    date: 'YYYY-MM-DD',            // Date de la session
    note: 'string'                  // Note optionnelle
}

// Index pour projectSessions
- id (keyPath, unique)
- projectId (pour filtrer par projet)
- date (pour filtrer par jour)
- startTime (pour trier)
```

### Bonnes pratiques IndexedDB

1. **Toujours gérer les erreurs**
```javascript
try {
    const result = await this.db.add(entry);
} catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    throw error;
}
```

2. **Utiliser des transactions appropriées**
```javascript
// Lecture seule
const tx = db.transaction(STORES.TIME_ENTRIES, 'readonly');

// Lecture/écriture
const tx = db.transaction(STORES.TIME_ENTRIES, 'readwrite');

// Multiple stores
const tx = db.transaction([STORES.PROJECTS, STORES.PROJECT_SESSIONS], 'readwrite');
```

3. **Utiliser les index pour les requêtes**
```javascript
// Récupérer tous les pointages d'un jour
const index = store.index('date');
const entries = await index.getAll('2025-11-13');

// Récupérer toutes les sessions d'un projet
const index = store.index('projectId');
const sessions = await index.getAll(projectId);
```

4. **Fermer les curseurs et transactions**
```javascript
const tx = db.transaction(STORES.TIME_ENTRIES, 'readonly');
const store = tx.objectStore(STORES.TIME_ENTRIES);
const result = await store.get(id);
await tx.complete;
```

---

## 🧪 Tests - Framework Minimaliste

### Philosophie
Créer un système de tests simple sans dépendance externe, basé sur des assertions JavaScript natives.

### Structure du framework de tests

```javascript
// tests/test-runner.js
'use strict';

/**
 * Framework de tests minimaliste
 */
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * Enregistre un test
     * @param {string} description - Description du test
     * @param {Function} testFn - Fonction de test
     */
    test(description, testFn) {
        this.tests.push({ description, testFn });
    }

    /**
     * Exécute tous les tests
     */
    async run() {
        console.log('🧪 Exécution des tests...\n');

        for (const test of this.tests) {
            this.results.total++;

            try {
                await test.testFn();
                this.results.passed++;
                console.log(`✅ ${test.description}`);
            } catch (error) {
                this.results.failed++;
                console.error(`❌ ${test.description}`);
                console.error(`   ${error.message}`);
            }
        }

        this.printSummary();
    }

    /**
     * Affiche le résumé des tests
     */
    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log(`Tests: ${this.results.passed}/${this.results.total} réussis`);

        if (this.results.failed > 0) {
            console.log(`❌ ${this.results.failed} test(s) échoué(s)`);
        } else {
            console.log('✅ Tous les tests sont passés !');
        }
    }
}

/**
 * Assertions
 */
class Assert {
    static equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(
                message || `Expected ${expected}, but got ${actual}`
            );
        }
    }

    static notEqual(actual, expected, message = '') {
        if (actual === expected) {
            throw new Error(
                message || `Expected not to be ${expected}`
            );
        }
    }

    static deepEqual(actual, expected, message = '') {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);

        if (actualStr !== expectedStr) {
            throw new Error(
                message || `Expected ${expectedStr}, but got ${actualStr}`
            );
        }
    }

    static isTrue(value, message = '') {
        if (value !== true) {
            throw new Error(
                message || `Expected true, but got ${value}`
            );
        }
    }

    static isFalse(value, message = '') {
        if (value !== false) {
            throw new Error(
                message || `Expected false, but got ${value}`
            );
        }
    }

    static throws(fn, expectedError, message = '') {
        try {
            fn();
            throw new Error(message || 'Expected function to throw');
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new Error(
                    message || `Expected ${expectedError.name}, but got ${error.name}`
                );
            }
        }
    }

    static async rejects(promise, expectedError, message = '') {
        try {
            await promise;
            throw new Error(message || 'Expected promise to reject');
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new Error(
                    message || `Expected ${expectedError.name}, but got ${error.name}`
                );
            }
        }
    }

    static isNull(value, message = '') {
        if (value !== null) {
            throw new Error(
                message || `Expected null, but got ${value}`
            );
        }
    }

    static isNotNull(value, message = '') {
        if (value === null) {
            throw new Error(
                message || 'Expected value not to be null'
            );
        }
    }

    static isUndefined(value, message = '') {
        if (value !== undefined) {
            throw new Error(
                message || `Expected undefined, but got ${value}`
            );
        }
    }

    static isDefined(value, message = '') {
        if (value === undefined) {
            throw new Error(
                message || 'Expected value to be defined'
            );
        }
    }

    static instanceOf(obj, constructor, message = '') {
        if (!(obj instanceof constructor)) {
            throw new Error(
                message || `Expected instance of ${constructor.name}`
            );
        }
    }
}

// Exports
export { TestRunner, Assert };
```

### Exemple de tests

```javascript
// tests/calculator.test.js
import { TestRunner, Assert } from './test-runner.js';
import { TimeCalculator } from '../js/calculator.js';
import { TimeEntry } from '../js/time-entry.js';

const runner = new TestRunner();
const calculator = new TimeCalculator();

// Test: Calcul du temps de présence
runner.test('Calcule correctement le temps de présence pour une journée complète', () => {
    const entries = [
        new TimeEntry('clock-in', new Date('2025-11-13T09:00:00')),
        new TimeEntry('lunch-start', new Date('2025-11-13T12:00:00')),
        new TimeEntry('lunch-end', new Date('2025-11-13T13:00:00')),
        new TimeEntry('clock-out', new Date('2025-11-13T18:00:00'))
    ];

    const duration = calculator.calculatePresenceTime(entries);
    const hours = duration / (1000 * 60 * 60);

    Assert.equal(hours, 8, 'La durée devrait être de 8 heures');
});

// Test: Détection d'une journée incomplète
runner.test('Détecte une journée incomplète', () => {
    const duration = 7 * 60 * 60 * 1000; // 7 heures
    const isComplete = calculator.isWorkDayComplete(duration);

    Assert.isFalse(isComplete, 'Une journée de 7h ne devrait pas être complète');
});

// Test: Validation avec des pointages manquants
runner.test('Lance une erreur si des pointages sont manquants', () => {
    const entries = [
        new TimeEntry('clock-in', new Date('2025-11-13T09:00:00'))
        // Manque les autres pointages
    ];

    Assert.throws(
        () => calculator.calculatePresenceTime(entries),
        Error,
        'Devrait lancer une erreur si les pointages sont incomplets'
    );
});

// Exécuter les tests
runner.run();
```

### Page HTML pour exécuter les tests

```html
<!-- tests/test-runner.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tests - Claude Time Tracker</title>
    <style>
        body {
            font-family: monospace;
            padding: 2rem;
            background: #1e293b;
            color: #f8fafc;
        }
        h1 {
            color: #10b981;
        }
    </style>
</head>
<body>
    <h1>🧪 Tests - Claude Time Tracker</h1>
    <p>Ouvrir la console pour voir les résultats des tests</p>

    <!-- Charger tous les fichiers de tests -->
    <script type="module" src="./calculator.test.js"></script>
    <script type="module" src="./utils.test.js"></script>
    <script type="module" src="./storage.test.js"></script>
</body>
</html>
```

### Bonnes pratiques de tests

1. **Un test = une assertion**
```javascript
// ✅ Bon
runner.test('Retourne le bon format de date', () => {
    const result = formatDate(new Date('2025-11-13'));
    Assert.equal(result, '2025-11-13');
});

// ❌ Mauvais
runner.test('Test multiple', () => {
    Assert.equal(formatDate(date1), '2025-11-13');
    Assert.equal(formatTime(time1), '09:00');
    Assert.isTrue(validate(data));
});
```

2. **Nommer les tests clairement**
```javascript
// ✅ Bon
runner.test('Calcule correctement les heures supplémentaires au-delà de 8h', () => { });

// ❌ Mauvais
runner.test('Test calcul', () => { });
```

3. **Tester les cas limites**
```javascript
runner.test('Gère correctement un tableau vide', () => { });
runner.test('Gère correctement null', () => { });
runner.test('Lance une erreur avec des paramètres invalides', () => { });
```

---

## 🎯 Bonnes Pratiques Générales

### Performance

1. **Minimiser les reflows/repaints**
```javascript
// ✅ Bon: modifier le DOM une seule fois
const fragment = document.createDocumentFragment();
projects.forEach(project => {
    const element = createProjectCard(project);
    fragment.appendChild(element);
});
container.appendChild(fragment);
```

2. **Utiliser la délégation d'événements**
```javascript
// ✅ Bon: un seul listener sur le parent
projectList.addEventListener('click', (e) => {
    if (e.target.matches('.project-card__start-button')) {
        handleStartTimer(e.target);
    }
});
```

3. **Debounce/Throttle pour les événements fréquents**
```javascript
// Pour le timer qui se met à jour chaque seconde
const throttledUpdate = throttle(updateTimerDisplay, 1000);
```

### Sécurité

1. **Échapper le contenu utilisateur**
```javascript
// ✅ Bon: utiliser textContent
projectNameElement.textContent = userInput;

// ❌ Mauvais: risque XSS
projectNameElement.innerHTML = userInput;
```

2. **Valider les entrées**
```javascript
function clockIn(timestamp) {
    if (!(timestamp instanceof Date)) {
        throw new Error('Timestamp invalide');
    }

    if (timestamp > new Date()) {
        throw new Error('Le timestamp ne peut pas être dans le futur');
    }

    // Continuer...
}
```

### Maintenabilité

1. **Commenter le "pourquoi", pas le "quoi"**
```javascript
// ✅ Bon
// On ajoute 1ms pour éviter que deux pointages aient exactement le même timestamp
const adjustedTime = timestamp.getTime() + 1;

// ❌ Mauvais
// Ajouter 1 à timestamp
const adjustedTime = timestamp.getTime() + 1;
```

2. **Fonctions courtes et ciblées**
```javascript
// Chaque fonction fait une seule chose
function validateTimeEntry(entry) { }
function saveTimeEntry(entry) { }
function renderTimeEntry(entry) { }
```

3. **Éviter la duplication**
```javascript
// ✅ Bon: fonction utilitaire réutilisable
function formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

// Utilisation
const workTime = formatDuration(workDuration);
const lunchTime = formatDuration(lunchDuration);
```

### Gestion du temps

1. **Toujours utiliser des timestamps en millisecondes**
```javascript
// ✅ Bon
const duration = endTime.getTime() - startTime.getTime();

// ❌ Mauvais: manipulation de dates/heures en string
const duration = parseTime(endTime) - parseTime(startTime);
```

2. **Stocker les dates en ISO 8601**
```javascript
// ✅ Bon
const dateString = date.toISOString(); // "2025-11-13T09:00:00.000Z"

// ❌ Mauvais: format personnalisé
const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
```

3. **Gérer les fuseaux horaires**
```javascript
// Toujours utiliser l'heure locale de l'utilisateur
const localDate = new Date();

// Pour l'affichage
const timeString = localDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
});
```

---

## 🧪 Tests et Validation

### Tests unitaires

Avant chaque commit :
- [ ] Exécuter la page `tests/test-runner.html`
- [ ] Tous les tests doivent passer (vert)
- [ ] Ajouter des tests pour les nouvelles fonctionnalités

### Validation manuelle

- [ ] Aucune erreur dans la console Chrome
- [ ] Le code fonctionne après un refresh complet (Ctrl+Shift+R)
- [ ] Les données persistent après fermeture/ouverture du navigateur
- [ ] Le CSS respecte la méthodologie BEM
- [ ] Le code JavaScript suit les conventions de nommage
- [ ] Les fonctions sont documentées avec JSDoc

### DevTools Chrome

Utiliser les outils de développement :
- **Console** : Aucune erreur ou warning
- **Application > IndexedDB** : Vérifier la structure des données
- **Network** : Vérifier que tous les fichiers se chargent
- **Performance** : Identifier les goulots d'étranglement

---

## 📝 Commentaires et Documentation

### JSDoc pour les fonctions publiques

```javascript
/**
 * Calcule la durée totale de travail pour une journée
 * @param {TimeEntry[]} entries - Liste des pointages du jour
 * @returns {number} Durée en millisecondes
 * @throws {Error} Si les pointages sont invalides ou incomplets
 * @example
 * const entries = [clockIn, lunchStart, lunchEnd, clockOut];
 * const duration = calculateWorkTime(entries);
 * console.log(`Temps de travail: ${duration / 3600000}h`);
 */
function calculateWorkTime(entries) {
    // Implémentation
}
```

### Commentaires de section

```javascript
class TimeTracker {
    constructor() {
        // ======================
        // Propriétés
        // ======================
        this.entries = [];
        this.currentProject = null;

        // ======================
        // Initialisation
        // ======================
        this.init();
    }

    // ======================
    // Méthodes publiques - Pointage
    // ======================

    clockIn() { }
    lunchStart() { }
    lunchEnd() { }
    clockOut() { }

    // ======================
    // Méthodes publiques - Projets
    // ======================

    startProject() { }
    stopProject() { }

    // ======================
    // Méthodes publiques - Calculs
    // ======================

    getPresenceTime() { }
    getProjectTime() { }

    // ======================
    // Méthodes privées
    // ======================

    #validateEntry() { }
}
```

---

## 🚀 Déploiement

### GitHub Pages

1. Les fichiers sont servis depuis la racine ou `/docs`
2. Pas de build nécessaire (code natif)
3. HTTPS automatique
4. CDN global

### Prérequis
- `index.html` à la racine
- Chemins relatifs pour tous les assets
- Pas de server-side rendering

---

## 📚 Ressources

### Documentation officielle
- [MDN Web Docs](https://developer.mozilla.org/)
- [BEM Methodology](https://en.bem.info/methodology/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [ES6+ Features](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Date and Time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

### Outils de développement
- Chrome DevTools
- VS Code avec extensions recommandées :
  - ESLint
  - Prettier
  - Live Server

---

## 🔄 Workflow de Développement

1. **Planification**
   - Définir la fonctionnalité
   - Décomposer en tâches

2. **Développement**
   - Créer/modifier les fichiers nécessaires
   - Suivre les conventions de code
   - Écrire les tests unitaires

3. **Tests**
   - Exécuter les tests (`tests/test-runner.html`)
   - Vérifier dans Chrome DevTools

4. **Validation**
   - Vérifier la console (pas d'erreurs)
   - Tester la persistance des données
   - Valider le respect des conventions

5. **Commit**
   - Message clair et descriptif
   - Grouper les changements logiquement

6. **Push**
   - Vers la branche feature
   - Créer une PR si nécessaire

---

## ⚠️ Contraintes et Limitations

### Ce qu'on NE fait PAS
- ❌ Pas de framework (React, Vue, Angular)
- ❌ Pas de bibliothèque externe (jQuery, Lodash, Jest, Mocha)
- ❌ Pas de préprocesseur CSS (Sass, Less)
- ❌ Pas de transpilation (Babel, TypeScript)
- ❌ Pas de bundler (Webpack, Vite)
- ❌ Pas de support multi-navigateur
- ❌ Pas de support mobile
- ❌ Pas d'accessibilité obligatoire

### Ce qu'on FAIT
- ✅ HTML5 pur
- ✅ JavaScript Vanilla (ES6+ natif Chrome)
- ✅ CSS3 pur avec BEM
- ✅ IndexedDB pour le stockage
- ✅ Tests unitaires maison
- ✅ Code simple et lisible
- ✅ Architecture modulaire
- ✅ Bonnes pratiques de performance

---

## 📊 Modèle de données détaillé

### Calcul du temps de présence

```javascript
// Exemple de journée type
const entries = [
    { type: 'clock-in', timestamp: '2025-11-13T09:00:00' },
    { type: 'lunch-start', timestamp: '2025-11-13T12:30:00' },
    { type: 'lunch-end', timestamp: '2025-11-13T13:30:00' },
    { type: 'clock-out', timestamp: '2025-11-13T18:00:00' }
];

// Calcul:
// Matin: 12:30 - 09:00 = 3h30
// Après-midi: 18:00 - 13:30 = 4h30
// Total: 3h30 + 4h30 = 8h00 ✅
```

### États possibles

```javascript
// État du jour
const DayStatus = {
    NOT_STARTED: 'not-started',     // Pas encore pointé
    MORNING: 'morning',             // Entre clock-in et lunch-start
    LUNCH: 'lunch',                 // Entre lunch-start et lunch-end
    AFTERNOON: 'afternoon',         // Entre lunch-end et clock-out
    COMPLETED: 'completed'          // clock-out effectué
};

// État du timer projet
const TimerStatus = {
    STOPPED: 'stopped',
    RUNNING: 'running',
    PAUSED: 'paused'
};
```

---

## 📈 Évolution du Projet

Ce document est vivant et sera mis à jour au fur et à mesure de l'évolution du projet.

**Dernière mise à jour** : 2025-11-13
**Version** : 2.0.0 (Time Tracker)
