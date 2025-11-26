# Plan de Refactoring - Programmation Fonctionnelle 100%

## 📋 Vue d'ensemble

Ce document détaille le plan complet de refactoring du **Claude Time Tracker** vers une architecture 100% fonctionnelle, sans dépendances externes.

**Objectif** : Transformer l'architecture OOP actuelle en architecture fonctionnelle pure avec :
- État immutable
- Fonctions pures
- Effets de bord isolés
- Architecture Elm (Model-Update-View)
- Zero dépendances externes (100% vanilla JavaScript)

---

## 📊 État Actuel vs État Cible

| Aspect | État actuel | État cible |
|--------|-------------|------------|
| **Paradigme** | OOP impératif | 100% fonctionnel |
| **État** | Mutable partout | Immutable (Object.freeze) |
| **Structures** | Classes | Fonctions + types ADT |
| **Effets** | Non contrôlés | Isolés (IO monad) |
| **Composition** | Héritage | Pipe/compose |
| **Gestion d'erreurs** | try/catch | Either monad |
| **Async** | Promises/callbacks | IO + Observable |
| **UI** | Mutation DOM | Virtual DOM + Elm |
| **Tests** | Unit tests | Property-based |
| **Dépendances** | Aucune | Aucune (reste vanilla JS) |

---

## 🏗️ Architecture Cible

```
┌─────────────────────────────────────────────────────────────┐
│                         RUNTIME                             │
│              (seule partie avec effets)                     │
│   - Boucle de mise à jour                                   │
│   - Diff & Patch Virtual DOM                                │
│   - Gestion des effets (DB, Timer, etc.)                    │
└─────────────────────────────────────────────────────────────┘
           ▲                                    │
           │                                    │
     ┌─────┴──────┐                      ┌──────▼──────┐
     │    VIEW    │                      │    MODEL    │
     │   (pure)   │                      │   (pure)    │
     │            │                      │             │
     │ - tracker  │                      │ - entries   │
     │ - reports  │                      │ - projects  │
     │ - projects │                      │ - sessions  │
     └─────▲──────┘                      └──────┬──────┘
           │                                    │
           │                              ┌─────▼──────┐
           └──────────────────────────────│   UPDATE   │
                                          │   (pure)   │
                                          │            │
                                          │ - Msg →    │
                                          │   Model'   │
                                          └────────────┘
```

---

## 📁 Structure de Fichiers Cible

```
js/
├── core/
│   ├── fp.js               # Utilitaires FP (pipe, compose, curry, etc.)
│   ├── monads.js           # Maybe, Either, IO, State
│   ├── observable.js       # Observable pattern
│   ├── vdom.js             # Virtual DOM (h, diff, patch)
│   └── runtime.js          # Runtime Elm
│
├── model/
│   ├── model.js            # État initial de l'application
│   ├── entry.js            # Type TimeEntry (immutable)
│   ├── project.js          # Type Project (immutable)
│   └── session.js          # Type ProjectSession (immutable)
│
├── update/
│   ├── update.js           # Fonction update principale
│   └── messages.js         # Définition de tous les messages
│
├── view/
│   ├── view.js             # Vue principale
│   ├── tracker.js          # Composant pointage
│   ├── reports.js          # Composant rapports
│   ├── projects.js         # Composant projets
│   └── common.js           # Composants réutilisables
│
├── logic/
│   ├── calculator.js       # Fonctions pures de calcul
│   ├── report-calc.js      # Calculs de rapports
│   └── validation.js       # Validations pures
│
├── effects/
│   ├── storage.js          # Effets IndexedDB (IO monad)
│   ├── timer.js            # Effets timer (Observable)
│   └── dom.js              # Effets DOM si nécessaire
│
├── utils.js                # Utilitaires (formatDuration, etc.)
│
└── app.js                  # Point d'entrée (< 20 lignes)
```

---

## 🎯 Plan d'Implémentation

### Phase 1 : Fondations FP ✅

**Objectif** : Créer les briques de base de la programmation fonctionnelle

**Fichiers à créer** :
- `js/core/fp.js` - Utilitaires fonctionnels
- `js/core/monads.js` - Monades (Maybe, Either, IO, State)
- `js/core/observable.js` - Pattern Observable
- `js/core/vdom.js` - Virtual DOM minimal

**Contenu** :

#### `fp.js`
- `pipe(...fns)` - Composition de gauche à droite
- `compose(...fns)` - Composition de droite à gauche
- `curry(fn)` - Currying automatique
- `map(fn, functor)` - Map générique
- `filter(predicate, filterable)` - Filter générique
- `reduce(reducer, initial, reducible)` - Reduce générique
- `head(array)` - Premier élément
- `tail(array)` - Tous sauf le premier
- `take(n, array)` - N premiers éléments
- `drop(n, array)` - Supprime N premiers
- `identity(x)` - Fonction identité
- `constant(x)` - Fonction constante

#### `monads.js`
- **Maybe** : Gestion des valeurs nullables
  - `Maybe.of(value)`
  - `Maybe.nothing()`
  - `.map(fn)`
  - `.flatMap(fn)`
  - `.getOrElse(default)`

- **Either** : Gestion des erreurs
  - `Either.left(error)`
  - `Either.right(value)`
  - `.map(fn)`
  - `.mapLeft(fn)`
  - `.fold(leftFn, rightFn)`

- **IO** : Gestion des effets de bord
  - `IO.of(value)`
  - `.map(fn)`
  - `.flatMap(fn)`
  - `.unsafePerformIO()`

- **State** : Threading d'état
  - `State.of(value)`
  - `State.get()`
  - `State.put(state)`
  - `.map(fn)`
  - `.flatMap(fn)`

#### `observable.js`
- `Observable.create(producer)`
- `.map(fn)`
- `.filter(predicate)`
- `.scan(reducer, seed)`
- `.subscribe(observer)`

#### `vdom.js`
- `h(tag, props, children)` - Créer un nœud virtuel
- `diff(oldVdom, newVdom)` - Calculer les différences
- `patch(root, patches)` - Appliquer les patches au DOM

---

### Phase 2 : Modèles de Données Immutables ✅

**Objectif** : Remplacer les classes par des types immutables

**Fichiers à refactorer** :
- `js/model/entry.js` (remplace `time-entry.js`)
- `js/model/project.js` (remplace `project.js`)
- `js/model/session.js` (remplace `project-session.js`)
- `js/model/model.js` (nouveau - état global)

**Transformations** :

#### TimeEntry
```javascript
// ❌ AVANT
class TimeEntry {
    constructor(type, timestamp) {
        this.id = crypto.randomUUID();
        this.type = type;
        this.timestamp = timestamp;
    }
    updateTimestamp(newTimestamp) {
        this.timestamp = newTimestamp; // Mutation!
    }
}

// ✅ APRÈS
export const TimeEntry = {
    create: (type, timestamp = new Date(), note = '') =>
        Object.freeze({
            id: crypto.randomUUID(),
            type,
            timestamp,
            date: formatDate(timestamp),
            note
        }),

    updateTimestamp: (entry, newTimestamp) =>
        TimeEntry.create(entry.type, newTimestamp, entry.note),

    toJSON: (entry) => ({
        id: entry.id,
        type: entry.type,
        timestamp: entry.timestamp.toISOString(),
        date: entry.date,
        note: entry.note
    }),

    fromJSON: (json) =>
        TimeEntry.create(json.type, new Date(json.timestamp), json.note)
};
```

#### Project
```javascript
export const Project = {
    create: (name, timeSpent = 0) =>
        Object.freeze({
            id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            timeSpent,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }),

    updateName: (project, newName) =>
        Project.create(newName, project.timeSpent),

    addTime: (project, duration) =>
        ({ ...project, timeSpent: project.timeSpent + duration })
};
```

---

### Phase 3 : Logique Métier Pure ✅

**Objectif** : Transformer toutes les méthodes de calcul en fonctions pures

**Fichiers à refactorer** :
- `js/logic/calculator.js` (remplace `calculator.js`)
- `js/logic/report-calc.js` (remplace `weekly-report.js`)
- `js/utils.js` (déjà majoritairement pur)

**Transformations** :

#### calculator.js
```javascript
// Toutes les méthodes de TimeCalculator deviennent des fonctions

// ❌ AVANT
class TimeCalculator {
    calculatePresenceTime(entries) { ... }
    #getBreakPairs(entries) { ... }
}

// ✅ APRÈS
export const getBreakPairs = (entries) => {
    const sortedEntries = [...entries].sort((a, b) =>
        a.timestamp.getTime() - b.timestamp.getTime()
    );

    return sortedEntries.reduce(
        ({ pairs, currentStart }, entry) => {
            if (isBreakStart(entry.type)) {
                return {
                    pairs: currentStart
                        ? [...pairs, { start: currentStart, end: null }]
                        : pairs,
                    currentStart: entry
                };
            }

            if (isBreakEnd(entry.type) && currentStart) {
                return {
                    pairs: [...pairs, { start: currentStart, end: entry }],
                    currentStart: null
                };
            }

            return { pairs, currentStart };
        },
        { pairs: [], currentStart: null }
    ).pairs;
};

export const calculatePresenceTime = (entries) => {
    if (!entries || entries.length === 0) return 0;

    const clockIn = entries.find(e => e.type === ENTRY_TYPES.CLOCK_IN);
    const clockOut = entries.find(e => e.type === ENTRY_TYPES.CLOCK_OUT);

    if (!clockIn) return 0;

    const endTime = clockOut ? clockOut.timestamp.getTime() : Date.now();
    const totalTime = endTime - clockIn.timestamp.getTime();

    const breaksDuration = pipe(
        getBreakPairs,
        map(pair => pair.end
            ? pair.end.timestamp.getTime() - pair.start.timestamp.getTime()
            : Date.now() - pair.start.timestamp.getTime()
        ),
        reduce((sum, duration) => sum + duration, 0)
    )(entries);

    return Math.max(0, totalTime - breaksDuration);
};
```

---

### Phase 4 : Effets Isolés ✅

**Objectif** : Isoler tous les effets de bord dans des monades IO

**Fichiers à créer** :
- `js/effects/storage.js` (remplace `storage.js`)
- `js/effects/timer.js` (remplace `timer.js`)

**Transformations** :

#### storage.js
```javascript
import { IO } from '../core/monads.js';

// Fonctions pures de transformation
const entryToStorageFormat = (entry) => ({
    id: entry.id,
    type: entry.type,
    timestamp: entry.timestamp.toISOString(),
    date: entry.date,
    note: entry.note
});

const storageFormatToEntry = (data) =>
    TimeEntry.create(data.type, new Date(data.timestamp), data.note);

// Effets encapsulés
export const createStorageEffects = (db) => ({
    saveEntry: (entry) => new IO(() => {
        const transaction = db.transaction(['timeEntries'], 'readwrite');
        const store = transaction.objectStore('timeEntries');
        const data = entryToStorageFormat(entry);

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(entry.id);
            request.onerror = () => reject(new Error('Save failed'));
        });
    }),

    getEntriesByDate: (date) => new IO(() => {
        const transaction = db.transaction(['timeEntries'], 'readonly');
        const store = transaction.objectStore('timeEntries');
        const index = store.index('date');

        return new Promise((resolve, reject) => {
            const request = index.getAll(date);
            request.onsuccess = () => {
                const entries = request.result
                    .map(storageFormatToEntry)
                    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                resolve(entries);
            };
            request.onerror = () => reject(new Error('Fetch failed'));
        });
    })
});
```

#### timer.js
```javascript
import { Observable } from '../core/observable.js';

// Créer un Observable pour le timer
export const createTimer$ = (interval = 1000) =>
    Observable.create(observer => {
        let elapsed = 0;
        const id = setInterval(() => {
            elapsed += interval;
            observer.next(elapsed);
        }, interval);

        return () => clearInterval(id);
    });

// Transformer en heures/minutes
export const timerWithFormat$ = (interval = 1000) =>
    createTimer$(interval).map(ms => ({
        milliseconds: ms,
        hours: Math.floor(ms / 3600000),
        minutes: Math.floor((ms % 3600000) / 60000),
        seconds: Math.floor((ms % 60000) / 1000)
    }));
```

---

### Phase 5 : UI avec Virtual DOM ✅

**Objectif** : Remplacer toutes les manipulations DOM par du Virtual DOM

**Fichiers à créer** :
- `js/view/view.js` - Vue principale
- `js/view/tracker.js` - Composant tracker
- `js/view/reports.js` - Composant rapports
- `js/view/projects.js` - Composant projets
- `js/view/common.js` - Composants communs

**Structure** :

```javascript
// view.js
export const view = (model, dispatch) =>
    h('div', { class: 'app' }, [
        renderNavigation(model, dispatch),
        renderCurrentView(model, dispatch),
        model.errorMessage ? renderError(model.errorMessage) : null
    ]);

// tracker.js
export const renderTracker = (model, dispatch) =>
    h('div', { class: 'tracker' }, [
        renderButtons(model, dispatch),
        renderPresenceBar(model),
        renderEntriesList(model.entries, dispatch),
        model.currentSession ? renderTimer(model.currentSession) : null
    ]);

const renderButtons = (model, dispatch) =>
    h('div', { class: 'buttons' }, [
        h('button', {
            class: 'btn btn--primary',
            onClick: () => dispatch(Msg.ClockIn()),
            disabled: !model.enabledButtons.includes('clock-in')
        }, 'Arriver'),
        // ... autres boutons
    ]);
```

---

### Phase 6 : App Principale avec Runtime Elm ✅

**Objectif** : Créer le runtime et l'état global

**Fichiers** :
- `js/core/runtime.js` - Runtime Elm
- `js/model/model.js` - État initial
- `js/update/update.js` - Fonction update
- `js/update/messages.js` - Définition des messages
- `js/app.js` - Point d'entrée

**Structure** :

#### model.js
```javascript
export const initialModel = Object.freeze({
    // Données
    entries: [],
    projects: [],
    sessions: [],
    currentSession: null,

    // UI
    currentView: 'tracker',
    selectedDate: getTodayDateString(),
    enabledButtons: ['clock-in'],

    // État
    isLoading: false,
    errorMessage: null,

    // Rapports
    reportPeriod: null,
    reportData: null
});
```

#### messages.js
```javascript
export const Msg = {
    // Pointage
    ClockIn: () => ({ type: 'CLOCK_IN' }),
    ClockOut: () => ({ type: 'CLOCK_OUT' }),
    BreakStart: () => ({ type: 'BREAK_START' }),
    BreakEnd: () => ({ type: 'BREAK_END' }),

    // Projets
    StartSession: (projectId) => ({ type: 'START_SESSION', projectId }),
    StopSession: () => ({ type: 'STOP_SESSION' }),

    // Navigation
    ChangeView: (view) => ({ type: 'CHANGE_VIEW', view }),

    // Effets
    EntriesLoaded: (entries) => ({ type: 'ENTRIES_LOADED', entries }),
    ProjectsLoaded: (projects) => ({ type: 'PROJECTS_LOADED', projects }),

    // Erreurs
    Error: (message) => ({ type: 'ERROR', message })
};
```

#### update.js
```javascript
import { calculatePresenceTime, getEnabledButtons } from '../logic/calculator.js';

export const update = (msg, model) => {
    switch (msg.type) {
        case 'CLOCK_IN': {
            const newEntry = TimeEntry.create('clock-in', new Date());
            const newEntries = [...model.entries, newEntry];
            return {
                ...model,
                entries: newEntries,
                enabledButtons: getEnabledButtons(newEntries)
            };
        }

        case 'START_SESSION': {
            const session = ProjectSession.create(msg.projectId);
            return {
                ...model,
                currentSession: session
            };
        }

        case 'ENTRIES_LOADED': {
            return {
                ...model,
                entries: msg.entries,
                isLoading: false,
                enabledButtons: getEnabledButtons(msg.entries)
            };
        }

        default:
            return model;
    }
};
```

#### app.js
```javascript
import { createRuntime } from './core/runtime.js';
import { initialModel } from './model/model.js';
import { update } from './update/update.js';
import { view } from './view/view.js';

// Démarrage
const runtime = createRuntime(initialModel, update, view);
runtime.init();

// Export pour debugging
window.runtime = runtime;
```

---

## 🔄 Stratégie de Migration

### Approche Progressive

1. **Créer la nouvelle structure en parallèle** (ne pas casser l'ancien code)
2. **Tester chaque module indépendamment**
3. **Basculer progressivement** les fonctionnalités
4. **Supprimer l'ancien code** une fois la migration complète

### Points de Validation

Après chaque phase :
- ✅ Tous les tests passent
- ✅ L'application fonctionne
- ✅ Commit avec message descriptif
- ✅ Documentation mise à jour si nécessaire

---

## 📈 Métriques de Succès

- ✅ **0 classe ES6** dans le code final
- ✅ **0 mutation** d'état (Object.freeze partout)
- ✅ **100% fonctions pures** pour la logique métier
- ✅ **Effets isolés** dans des monades IO
- ✅ **0 dépendance externe** ajoutée
- ✅ **Tests property-based** pour les fonctions pures
- ✅ **Time-travel debugging** fonctionnel

---

## 🎯 Résultat Final

### Avant
```javascript
// app.js - 42,850 octets
class App {
    constructor() {
        this.storage = new StorageService();
        this.todayEntries = [];
        // ... 50 lignes de configuration
    }

    async handleClockIn() {
        const entry = new TimeEntry('clock-in');
        await this.storage.saveEntry(entry);
        this.todayEntries.push(entry);
        this.ui.updateButtons(this.calculator.getNextExpectedEntry(this.todayEntries));
        // ... mutations partout
    }
}
```

### Après
```javascript
// app.js - ~500 octets
import { createRuntime } from './core/runtime.js';
import { initialModel } from './model/model.js';
import { update } from './update/update.js';
import { view } from './view/view.js';

const runtime = createRuntime(initialModel, update, view);
runtime.init();
```

---

## 📚 Ressources

### Concepts FP
- **Immutabilité** : Object.freeze, spread operator
- **Fonctions pures** : Pas d'effets de bord, déterministes
- **Composition** : pipe, compose
- **Monades** : Maybe, Either, IO, State
- **Virtual DOM** : h, diff, patch

### Patterns
- **Architecture Elm** : Model-Update-View
- **Observable** : Pattern réactif
- **Lenses** : Accès immutable aux propriétés

### Inspiration
- Elm Language
- Redux
- Cycle.js
- Ramda.js (concepts, pas la lib)

---

**Date de création** : 2025-11-26
**Auteur** : Claude Code
**Version** : 1.0
