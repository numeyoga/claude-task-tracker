# Tests unitaires - Claude Time Tracker

Ce dossier contient tous les tests unitaires de l'application.

## 📁 Structure

```
tests/
├── test-runner.js          # Framework de tests minimaliste
├── test-runner.html        # Page pour exécuter les tests
├── time-entry.test.js      # Tests du modèle TimeEntry
├── calculator.test.js      # Tests du calculateur de temps
├── utils.test.js           # Tests des fonctions utilitaires
├── storage.test.js         # Tests d'IndexedDB
└── README.md              # Ce fichier
```

## 🚀 Exécuter les tests

### Méthode 1 : Avec un serveur local

```bash
# Depuis la racine du projet
python -m http.server 8000

# Puis ouvrir dans le navigateur
# http://localhost:8000/tests/test-runner.html
```

### Méthode 2 : Avec Live Server (VS Code)

1. Installer l'extension "Live Server" dans VS Code
2. Clic droit sur `test-runner.html`
3. Sélectionner "Open with Live Server"

### Méthode 3 : Avec npx

```bash
npx http-server -p 8000
# Puis ouvrir http://localhost:8000/tests/test-runner.html
```

## 📊 Voir les résultats

1. Ouvrir la page `test-runner.html` dans Chrome
2. Ouvrir la console du navigateur (F12)
3. Les tests s'exécutent automatiquement
4. Vérifier que tous les tests passent (✅)

## 🧪 Framework de tests

Le framework (`test-runner.js`) est minimaliste et ne dépend d'aucune bibliothèque externe.

### Exemple d'utilisation

```javascript
import { TestRunner, Assert } from './test-runner.js';

const runner = new TestRunner();

runner.test('Description du test', () => {
    const result = maFonction();
    Assert.equal(result, 'valeur attendue');
});

runner.run();
```

### Assertions disponibles

- `Assert.equal(actual, expected)` - Égalité stricte
- `Assert.notEqual(actual, expected)` - Différence stricte
- `Assert.deepEqual(actual, expected)` - Égalité profonde (JSON)
- `Assert.isTrue(value)` - Vérifie que la valeur est `true`
- `Assert.isFalse(value)` - Vérifie que la valeur est `false`
- `Assert.isNull(value)` - Vérifie que la valeur est `null`
- `Assert.isNotNull(value)` - Vérifie que la valeur n'est pas `null`
- `Assert.isDefined(value)` - Vérifie que la valeur n'est pas `undefined`
- `Assert.isUndefined(value)` - Vérifie que la valeur est `undefined`
- `Assert.instanceOf(obj, constructor)` - Vérifie le type d'instance
- `Assert.throws(fn, expectedError)` - Vérifie qu'une fonction lance une erreur
- `Assert.rejects(promise, expectedError)` - Vérifie qu'une promesse rejette
- `Assert.greaterThan(actual, expected)` - Supérieur à
- `Assert.lessThan(actual, expected)` - Inférieur à
- `Assert.contains(array, value)` - Vérifie qu'un tableau contient une valeur
- `Assert.notContains(array, value)` - Vérifie qu'un tableau ne contient pas une valeur

## 📝 Suites de tests

### time-entry.test.js (17 tests)

Tests du modèle `TimeEntry` :
- Création d'entrées
- Validation des données
- Sérialisation JSON
- Gestion des erreurs

### calculator.test.js (30+ tests)

Tests du `TimeCalculator` :
- Calcul du temps de présence
- Vérification des objectifs
- Calcul des pauses
- Détermination du statut du jour
- Calcul des pourcentages

### utils.test.js (40+ tests)

Tests des fonctions utilitaires :
- Formatage de durée
- Formatage d'heure et de date
- Échappement HTML
- Création d'éléments DOM
- Traduction des labels

### storage.test.js (20+ tests)

Tests du service de stockage :
- Initialisation d'IndexedDB
- Sauvegarde d'entrées
- Récupération par date
- Récupération par ID
- Suppression d'entrées
- Persistance des données

## ✅ Bonnes pratiques

### Un test = une assertion

```javascript
// ✅ Bon
runner.test('Retourne le bon format de date', () => {
    const result = formatDate(new Date('2025-11-13'));
    Assert.equal(result, '2025-11-13');
});

// ❌ Mauvais - plusieurs assertions non liées
runner.test('Test multiple', () => {
    Assert.equal(formatDate(date1), '2025-11-13');
    Assert.equal(formatTime(time1), '09:00');
    Assert.isTrue(validate(data));
});
```

### Nommer clairement les tests

```javascript
// ✅ Bon
runner.test('Calcule correctement les heures supplémentaires au-delà de 8h', () => { });

// ❌ Mauvais
runner.test('Test calcul', () => { });
```

### Tester les cas limites

```javascript
runner.test('Gère correctement un tableau vide', () => { });
runner.test('Gère correctement null', () => { });
runner.test('Lance une erreur avec des paramètres invalides', () => { });
```

## 🐛 Débogage

Si un test échoue :
1. Consulter le message d'erreur dans la console
2. Vérifier le fichier et la ligne indiqués
3. Exécuter le code concerné manuellement dans la console
4. Ajouter des `console.log()` si nécessaire

## 📚 Ressources

- [Documentation technique complète](../TECHNICAL_SPEC.md)
- [MDN - IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN - ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## 🔄 CI/CD

Pour intégrer ces tests dans un pipeline CI/CD, utilisez un outil comme :
- [Playwright](https://playwright.dev/)
- [Puppeteer](https://pptr.dev/)
- [Cypress](https://www.cypress.io/)

Exemple avec Playwright :

```javascript
// playwright.config.js
test('Tests unitaires', async ({ page }) => {
    await page.goto('http://localhost:8000/tests/test-runner.html');
    await page.waitForTimeout(5000);
    const logs = await page.evaluate(() => console.log('Tests terminés'));
    // Vérifier qu'aucune erreur n'est présente
});
```
