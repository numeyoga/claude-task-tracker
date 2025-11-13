# Tests E2E (End-to-End)

Ce dossier contient les tests end-to-end utilisant Playwright pour tester l'application complète.

## 🎯 Objectifs

Les tests E2E vérifient :
1. ✅ Que tous les tests unitaires passent (`/tests/test-runner.html`)
2. ✅ Que l'application se charge correctement
3. ✅ Que le cycle de pointage complet fonctionne
4. ✅ Que les données persistent dans IndexedDB
5. ✅ Qu'il n'y a pas d'erreurs JavaScript
6. ✅ Que toutes les ressources se chargent correctement

## 🚀 Exécution locale

### Prérequis

```bash
npm install
```

### Lancer les tests

```bash
# Mode headless (par défaut)
npm test

# Mode headed (avec navigateur visible)
npm run test:headed

# Mode debug
npm run test:debug

# Interface UI interactive
npm run test:ui
```

## 📁 Structure des tests

### `unit-tests.spec.js`

Test principal qui :
- Charge `/tests/test-runner.html`
- Écoute les logs de la console
- Vérifie qu'aucun test unitaire n'échoue
- Vérifie le message de succès final

### Tests de l'application

- **Chargement de la page** : Vérifie que tous les éléments sont présents
- **Boutons de pointage** : Vérifie l'activation séquentielle
- **Cycle complet** : Teste clock-in → lunch → clock-out
- **Temps réel** : Vérifie que le compteur se met à jour
- **Accessibilité** : Vérifie l'absence d'erreurs JS
- **Performance** : Vérifie que toutes les ressources se chargent

## 📊 Rapports de tests

Après l'exécution, les rapports sont générés dans :
- `playwright-report/` - Rapport HTML interactif
- `test-results/results.json` - Résultats JSON
- `test-results/` - Screenshots et vidéos en cas d'échec

Pour voir le rapport HTML :
```bash
npx playwright show-report
```

## 🐛 Débogage

### Voir les tests en action

```bash
npm run test:headed
```

### Mode debug avec pause

```bash
npm run test:debug
```

### Inspecter un test spécifique

```bash
npx playwright test unit-tests.spec.js --debug
```

### Traces

Les traces sont automatiquement enregistrées lors des échecs.
Pour les visualiser :

```bash
npx playwright show-trace test-results/<trace-file>.zip
```

## ⚙️ Configuration

La configuration se trouve dans `playwright.config.js` :
- **Timeout** : 30 secondes par test
- **Retries** : 2 tentatives sur CI, 0 en local
- **Workers** : 1 sur CI (séquentiel), parallèle en local
- **Base URL** : http://localhost:8000
- **Navigateurs** : Chromium uniquement (Chrome Desktop)

## 🔍 Ce qui est testé

### Tests unitaires automatiques
```javascript
test('Tous les tests unitaires passent', async ({ page }) => {
  await page.goto('/tests/test-runner.html');
  // Vérifie les logs de console
  // Vérifie l'absence de ❌
  // Vérifie la présence de ✅
});
```

### Cycle de pointage
```javascript
test('Le cycle de pointage complet fonctionne', async ({ page }) => {
  await page.goto('/');

  // 1. Clock in
  await clockInBtn.click();

  // 2. Lunch start
  await lunchStartBtn.click();

  // 3. Lunch end
  await lunchEndBtn.click();

  // 4. Clock out
  await clockOutBtn.click();

  // Vérifier que tous les pointages sont enregistrés
  await expect(entries).toHaveCount(4);
});
```

### Validation continue
```javascript
test('Le temps de présence se met à jour en temps réel', async ({ page }) => {
  const initialTime = await presenceTime.textContent();
  await page.waitForTimeout(3000);
  const newTime = await presenceTime.textContent();

  expect(newTime).not.toBe(initialTime);
});
```

## 🚦 CI/CD

Ces tests s'exécutent automatiquement sur GitHub Actions :
- À chaque push
- À chaque pull request
- Avant chaque déploiement

Le déploiement sur GitHub Pages n'a lieu que si tous les tests passent.

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)

## ✅ Checklist avant commit

Avant de committer, assurez-vous que :
- [ ] `npm test` passe sans erreur
- [ ] Aucune erreur dans la console
- [ ] Les nouveaux tests sont ajoutés si nécessaire
- [ ] Les tests couvrent les cas limites
