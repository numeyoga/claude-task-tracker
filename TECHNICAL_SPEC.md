# Claude Task Tracker - Spécifications Techniques

## 📋 Description du Projet

**Claude Task Tracker** est une application web de gestion de tâches (todo list) développée en technologies web natives. L'application permet à un utilisateur unique de créer, organiser et suivre ses tâches de manière efficace.

### Caractéristiques principales
- Application single-page (SPA)
- Aucune dépendance externe (pas de framework)
- Stockage local via IndexedDB
- Interface moderne et responsive
- Déploiement sur GitHub Pages / GitLab Pages

---

## 🎯 Fonctionnalités

### Phase 1 - MVP
- [ ] Créer une tâche
- [ ] Afficher la liste des tâches
- [ ] Marquer une tâche comme complétée
- [ ] Supprimer une tâche
- [ ] Éditer une tâche existante

### Phase 2 - Améliorations
- [ ] Catégoriser les tâches (tags/labels)
- [ ] Filtrer les tâches (toutes, actives, complétées)
- [ ] Rechercher dans les tâches
- [ ] Trier les tâches (date, priorité, nom)
- [ ] Définir une priorité (haute, moyenne, basse)

### Phase 3 - Fonctionnalités avancées
- [ ] Dates d'échéance
- [ ] Sous-tâches (checklist)
- [ ] Notes/description détaillée
- [ ] Export/Import de données
- [ ] Thème sombre/clair

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
├── js/                    # Modules JavaScript (à créer si nécessaire)
│   ├── storage.js         # Gestion IndexedDB
│   ├── task.js            # Modèle Task
│   ├── ui.js              # Gestion de l'interface
│   └── utils.js           # Fonctions utilitaires
├── css/                   # Fichiers CSS modulaires (si nécessaire)
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

#### Exemples
```css
/* ✅ Correct */
.task-item { }
.task-item__title { }
.task-item__checkbox { }
.task-item--completed { }
.task-item__title--highlighted { }

/* ❌ Incorrect */
.taskItem { }
.task-item-title { }
.completed-task { }
```

#### Règles BEM strictes
1. Un bloc représente un composant indépendant (`.header`, `.task-list`, `.modal`)
2. Un élément est une partie du bloc (`.task-item__title`, `.header__logo`)
3. Un modificateur change l'apparence ou le comportement (`.button--primary`, `.task-item--urgent`)
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
    --color-text: #1e293b;
    --color-text-secondary: #64748b;

    /* Espacements */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;

    /* Typographie */
    --font-family: sans-serif;
    --font-size-base: 16px;

    /* Ombres */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);

    /* Rayons */
    --radius-sm: 0.375rem;
}
```

### JavaScript

#### Nommage
```javascript
// Classes: PascalCase
class TaskManager { }
class StorageService { }

// Fonctions et variables: camelCase
function createTask() { }
const taskList = [];
let isCompleted = false;

// Constantes: UPPER_SNAKE_CASE
const DB_NAME = 'TaskTrackerDB';
const DB_VERSION = 1;

// Fichiers: kebab-case
// task-manager.js, storage-service.js
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

    // Méthodes publiques
    publicMethod() { }

    // Méthodes privées (avec #)
    #privateMethod() { }
}
```

#### Modules ES6
```javascript
// Utiliser 'use strict' en haut de chaque fichier
'use strict';

// Exports nommés préférés aux exports par défaut
export class TaskManager { }
export function createTask() { }

// Import
import { TaskManager, createTask } from './task-manager.js';
```

---

## 🏗️ Architecture

### Pattern MVC Simplifié

#### Model
- Représente les données (Task)
- Logique métier
- Gestion du stockage (IndexedDB)

#### View
- Manipulation du DOM
- Rendu des composants
- Gestion des événements UI

#### Controller
- Coordination entre Model et View
- Gestion de l'état de l'application
- Logique de contrôle

### Exemple d'organisation
```javascript
// Model: task.js
export class Task {
    constructor(title, description = '') {
        this.id = crypto.randomUUID();
        this.title = title;
        this.description = description;
        this.completed = false;
        this.createdAt = new Date();
    }
}

// View: ui.js
export class TaskUI {
    renderTask(task) {
        // Création des éléments DOM
    }

    updateTaskStatus(taskId, completed) {
        // Mise à jour visuelle
    }
}

// Controller: app.js
class App {
    constructor() {
        this.storage = new StorageService();
        this.ui = new TaskUI();
        this.init();
    }

    async init() {
        await this.storage.init();
        await this.loadTasks();
        this.setupEventListeners();
    }
}
```

---

## 💾 Gestion des Données - IndexedDB

### Structure de la base de données

```javascript
const DB_NAME = 'TaskTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

// Schema de l'objet Task
{
    id: 'uuid-string',           // Clé primaire
    title: 'string',             // Requis
    description: 'string',       // Optionnel
    completed: boolean,          // Default: false
    priority: 'high|medium|low', // Optionnel
    tags: ['string'],            // Optionnel
    dueDate: Date,               // Optionnel
    createdAt: Date,             // Auto
    updatedAt: Date              // Auto
}

// Index
- id (keyPath, unique)
- completed
- createdAt
```

### Bonnes pratiques IndexedDB

1. **Toujours gérer les erreurs**
```javascript
try {
    const result = await this.db.add(task);
} catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    throw error;
}
```

2. **Utiliser des transactions appropriées**
```javascript
// Lecture seule
const tx = db.transaction(STORE_NAME, 'readonly');

// Lecture/écriture
const tx = db.transaction(STORE_NAME, 'readwrite');
```

3. **Fermer les curseurs et transactions**
```javascript
const tx = db.transaction(STORE_NAME, 'readonly');
const store = tx.objectStore(STORE_NAME);
await tx.complete;
```

---

## 🎯 Bonnes Pratiques Générales

### Performance

1. **Minimiser les reflows/repaints**
```javascript
// ✅ Bon: modifier le DOM une seule fois
const fragment = document.createDocumentFragment();
tasks.forEach(task => {
    const element = createTaskElement(task);
    fragment.appendChild(element);
});
container.appendChild(fragment);

// ❌ Mauvais: modifier le DOM en boucle
tasks.forEach(task => {
    const element = createTaskElement(task);
    container.appendChild(element);
});
```

2. **Utiliser la délégation d'événements**
```javascript
// ✅ Bon: un seul listener sur le parent
taskList.addEventListener('click', (e) => {
    if (e.target.matches('.task-item__checkbox')) {
        handleCheckbox(e.target);
    }
});

// ❌ Mauvais: un listener par élément
tasks.forEach(task => {
    task.addEventListener('click', handleClick);
});
```

3. **Debounce/Throttle pour les événements fréquents**
```javascript
// Pour la recherche, le resize, etc.
const debouncedSearch = debounce(search, 300);
searchInput.addEventListener('input', debouncedSearch);
```

### Sécurité

1. **Échapper le contenu utilisateur**
```javascript
// ✅ Bon: utiliser textContent
element.textContent = userInput;

// ❌ Mauvais: risque XSS
element.innerHTML = userInput;
```

2. **Valider les entrées**
```javascript
function createTask(title) {
    if (!title || typeof title !== 'string') {
        throw new Error('Titre invalide');
    }

    if (title.trim().length === 0) {
        throw new Error('Le titre ne peut pas être vide');
    }

    // Continuer...
}
```

### Maintenabilité

1. **Commenter le "pourquoi", pas le "quoi"**
```javascript
// ✅ Bon
// Délai nécessaire pour laisser l'animation CSS se terminer
await delay(300);

// ❌ Mauvais
// Attendre 300ms
await delay(300);
```

2. **Fonctions courtes et ciblées**
```javascript
// Chaque fonction fait une seule chose
function validateTask(task) { }
function saveTask(task) { }
function renderTask(task) { }

// Plutôt que tout faire dans une seule fonction
function createAndSaveAndRenderTask(data) { }
```

3. **Éviter la duplication**
```javascript
// ✅ Bon: fonction utilitaire réutilisable
function createElement(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
}

// Utilisation
const title = createElement('h2', 'task-item__title', task.title);
const desc = createElement('p', 'task-item__description', task.description);
```

### Accessibilité (optionnelle mais recommandée)

Bien que non requise, quelques bonnes pratiques simples :
```html
<!-- Boutons clairs -->
<button type="button" aria-label="Supprimer la tâche">×</button>

<!-- Checkbox avec label -->
<label>
    <input type="checkbox" class="task-item__checkbox">
    <span class="task-item__title">Titre de la tâche</span>
</label>
```

---

## 🧪 Tests et Validation

### Validation manuelle

Avant chaque commit, vérifier :
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
 * Crée une nouvelle tâche et la sauvegarde dans la base de données
 * @param {string} title - Titre de la tâche
 * @param {string} [description=''] - Description optionnelle
 * @param {Object} [options={}] - Options supplémentaires
 * @param {string} [options.priority='medium'] - Priorité de la tâche
 * @param {Date} [options.dueDate] - Date d'échéance
 * @returns {Promise<Task>} La tâche créée
 * @throws {Error} Si le titre est invalide
 */
async function createTask(title, description = '', options = {}) {
    // Implémentation
}
```

### Commentaires de section

```javascript
class TaskManager {
    constructor() {
        // ======================
        // Propriétés
        // ======================
        this.tasks = [];
        this.filters = {};

        // ======================
        // Initialisation
        // ======================
        this.init();
    }

    // ======================
    // Méthodes publiques - CRUD
    // ======================

    createTask() { }
    updateTask() { }
    deleteTask() { }

    // ======================
    // Méthodes publiques - Filtrage
    // ======================

    filterByStatus() { }
    searchTasks() { }

    // ======================
    // Méthodes privées
    // ======================

    #validateTask() { }
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
   - Tester dans Chrome

3. **Validation**
   - Vérifier la console (pas d'erreurs)
   - Tester la persistance des données
   - Valider le respect des conventions

4. **Commit**
   - Message clair et descriptif
   - Grouper les changements logiquement

5. **Push**
   - Vers la branche feature
   - Créer une PR si nécessaire

---

## ⚠️ Contraintes et Limitations

### Ce qu'on NE fait PAS
- ❌ Pas de framework (React, Vue, Angular)
- ❌ Pas de bibliothèque externe (jQuery, Lodash)
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
- ✅ Code simple et lisible
- ✅ Architecture modulaire
- ✅ Bonnes pratiques de performance

---

## 📈 Évolution du Projet

Ce document est vivant et sera mis à jour au fur et à mesure de l'évolution du projet.

**Dernière mise à jour** : 2025-11-13
**Version** : 1.0.0
