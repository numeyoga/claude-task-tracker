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

## Tests

Le projet utilise une suite complète de tests unitaires pour garantir la qualité du code.

### Tests unitaires (100+ tests)

Framework de tests minimaliste sans dépendances externes :
- Tests pour TimeEntry, Calculator, Utils, Storage
- Exécution locale : `python -m http.server 8000` puis ouvrir `http://localhost:8000/tests/test-runner.html`
- 17 tests pour TimeEntry (création, validation, sérialisation)
- 30+ tests pour Calculator (calculs de temps, états)
- 40+ tests pour Utils (formatage, sécurité)
- 20+ tests pour Storage (IndexedDB, persistance)

## Déploiement

L'application est déployée automatiquement sur GitHub Pages à chaque push sur `main` ou `master`.

**URL de production** : `https://<username>.github.io/claude-task-tracker/`

Pour plus de détails, consultez le [guide de déploiement](DEPLOYMENT.md).
