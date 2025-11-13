# Guide de déploiement sur GitHub Pages

Ce document explique comment configurer le déploiement automatique de l'application sur GitHub Pages.

## Configuration initiale

### 1. Activer GitHub Pages dans le repository

1. Aller dans les **Settings** du repository GitHub
2. Dans le menu latéral, cliquer sur **Pages**
3. Dans la section **Build and deployment** :
   - **Source** : Sélectionner `GitHub Actions`

### 2. Vérifier les permissions

Le workflow a besoin des permissions suivantes (déjà configurées dans `.github/workflows/deploy.yml`) :
- `contents: read` - Lire le contenu du repository
- `pages: write` - Écrire sur GitHub Pages
- `id-token: write` - Générer un token d'identification

## Déclenchement du déploiement

Le déploiement se fait **automatiquement** dans les cas suivants :

1. **Push sur la branche main ou master**
   ```bash
   git push origin main
   ```

2. **Déclenchement manuel**
   - Aller dans l'onglet **Actions** du repository
   - Sélectionner le workflow "Deploy to GitHub Pages"
   - Cliquer sur **Run workflow**

## Vérification du déploiement

1. Aller dans l'onglet **Actions** du repository
2. Vérifier que le workflow "Deploy to GitHub Pages" s'est exécuté avec succès ✅
3. L'URL de l'application sera disponible dans les logs du workflow
4. Par défaut, l'URL sera : `https://<username>.github.io/<repository-name>/`

## Fichiers de configuration

### `.github/workflows/deploy.yml`
Workflow GitHub Actions qui gère le déploiement automatique.

### `.nojekyll`
Fichier vide qui indique à GitHub Pages de ne pas utiliser Jekyll pour générer le site.
Cela permet de servir directement les fichiers HTML/CSS/JS.

### `.gitignore`
Liste des fichiers et dossiers à ne pas versionner (IDE, OS, logs, etc.).

## Déploiement local pour tests

Comme l'application est 100% statique (pas de build), vous pouvez la tester localement :

### Option 1 : Extension VS Code
Utiliser l'extension "Live Server" dans VS Code.

### Option 2 : Python
```bash
# Python 3
python -m http.server 8000

# Puis ouvrir : http://localhost:8000
```

### Option 3 : Node.js
```bash
# Installer http-server globalement
npm install -g http-server

# Démarrer le serveur
http-server -p 8000

# Puis ouvrir : http://localhost:8000
```

## Structure des fichiers déployés

Tous les fichiers à la racine du repository seront déployés :

```
/
├── index.html          # Point d'entrée
├── style.css           # Styles
├── app.js              # Application principale
├── js/                 # Modules JavaScript (à créer)
├── tests/              # Tests (non visibles en production)
├── assets/             # Ressources statiques (à créer)
├── .nojekyll           # Config GitHub Pages
└── README.md
```

**Note** : Les fichiers/dossiers listés dans `.gitignore` ne seront pas déployés.

## Dépannage

### Le déploiement échoue

1. Vérifier que GitHub Pages est activé dans Settings > Pages
2. Vérifier que la source est bien `GitHub Actions`
3. Consulter les logs dans l'onglet Actions pour voir l'erreur

### L'application ne s'affiche pas correctement

1. Vérifier que le fichier `.nojekyll` existe à la racine
2. Vérifier la console du navigateur pour les erreurs
3. Vérifier que tous les chemins de fichiers sont relatifs (pas absolus)

### Erreur 404 sur les ressources

Si les fichiers CSS/JS ne se chargent pas :
- Utiliser des chemins relatifs : `./style.css` au lieu de `/style.css`
- Vérifier que les fichiers existent bien dans le repository

## Workflow de développement

1. **Développer en local**
   - Modifier les fichiers
   - Tester avec un serveur local

2. **Committer et pusher**
   ```bash
   git add .
   git commit -m "Nouvelle fonctionnalité"
   git push origin main
   ```

3. **Déploiement automatique**
   - Le workflow GitHub Actions se déclenche automatiquement
   - L'application est déployée en quelques secondes

4. **Vérifier en production**
   - Ouvrir l'URL GitHub Pages
   - Vérifier que tout fonctionne

## Domaine personnalisé (optionnel)

Pour utiliser un domaine personnalisé :

1. Aller dans Settings > Pages
2. Dans la section **Custom domain**, entrer votre domaine
3. Configurer les DNS de votre domaine pour pointer vers GitHub Pages
4. Attendre la propagation DNS (peut prendre quelques heures)

Plus d'infos : [Documentation GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
