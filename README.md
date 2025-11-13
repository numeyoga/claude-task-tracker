# Claude Time Tracker

Application web de suivi du temps de travail développée en HTML5, Vanilla JavaScript et CSS.

## Description

Claude Time Tracker permet de :
- Pointer ses heures d'arrivée et de départ (avec pause repas)
- Vérifier l'atteinte de l'objectif quotidien de 8 heures de présence
- Suivre le temps passé par projet chaque jour
- Consulter un bilan hebdomadaire de son activité

## Technologies

- HTML5
- Vanilla JavaScript (ES6+)
- Vanilla CSS (méthodologie BEM)
- IndexedDB (stockage local)
- Tests unitaires sans dépendance externe

## Documentation

- [Spécifications techniques](TECHNICAL_SPEC.md) - Documentation complète du projet
- [Guide de déploiement](DEPLOYMENT.md) - Configuration GitHub Pages et déploiement automatique

## CI/CD et Tests

### Tests automatisés

Le projet utilise une suite complète de tests pour garantir la qualité du code :

**Tests unitaires** (100+ tests)
- Framework de tests minimaliste sans dépendances
- Tests pour TimeEntry, Calculator, Utils, Storage
- Exécution locale : `python -m http.server 8000` puis ouvrir `http://localhost:8000/tests/test-runner.html`

**Tests E2E avec Playwright**
```bash
npm install
npm test              # Exécuter les tests
npm run test:headed   # Mode visuel
npm run test:ui       # Interface UI
```

### Workflow GitHub Actions

À chaque push ou pull request, le workflow automatique :
1. ✅ Exécute tous les tests unitaires
2. ✅ Exécute les tests E2E avec Playwright
3. ✅ Vérifie qu'il n'y a pas d'erreurs JavaScript
4. ✅ Teste le cycle de pointage complet
5. 🚀 Déploie automatiquement sur GitHub Pages (si sur main/master)

Le déploiement n'a lieu que si **tous les tests passent**.

[![Tests](https://github.com/<username>/claude-task-tracker/actions/workflows/test-and-deploy.yml/badge.svg)](https://github.com/<username>/claude-task-tracker/actions)

## Déploiement

L'application est déployée automatiquement sur GitHub Pages à chaque push sur `main` ou `master`, **uniquement si tous les tests passent**.

**URL de production** : `https://<username>.github.io/claude-task-tracker/`

Pour plus de détails, consultez le [guide de déploiement](DEPLOYMENT.md).
