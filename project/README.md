# DocOverlay

> Statut CI: (ajouter le badge après premier run)  
> Couverture: générée via `npm run test` (rapport lcov)

Application web (Vite + React + TypeScript + Tailwind) pour visualisation, annotation et gestion documentaire orientée dossiers patients.

## Stack
- Vite
- React / TypeScript
- Tailwind CSS
- PDF.js (worker embarqué)

## Scripts NPM
```
npm install      # installer les dépendances
npm run dev      # lancer le serveur de dev
npm run build    # build de production
npm run test     # exécuter les tests (Vitest)
npm run test:ui  # mode watch/UI
npm run format   # formatage Prettier
npm run preview  # prévisualiser le build
```

## Démarrage rapide
1. Cloner le dépôt
2. Installer Node.js >= 18
3. `npm install`
4. `npm run dev`

### Installation Node.js (Windows)
Option simple (winget) :
```
winget install OpenJS.NodeJS.LTS
```
Puis rouvrir un terminal :
```
node -v
npm -v
```

Option multi‑versions (recommandé) : installer nvm-windows :
1. Télécharger `nvm-setup.exe` : https://github.com/coreybutler/nvm-windows/releases
2. Installer, rouvrir PowerShell
3. Choisir version :
```
nvm install 20.16.0
nvm use 20.16.0
node -v
npm -v
```

Si `npm` introuvable : redémarrer la session ou vérifier la variable PATH.

## Structure
```
project/
  public/            # assets publics, pdf worker
  src/
    components/      # UI et vues
    hooks/           # hooks personnalisés
    utils/           # helpers
  geometry.ts    # utilitaires géométrie/rotation (testés)
  detectContentRect.ts # détection HQ cadre contenu
    data/            # données mock
    pdf/             # initialisation PDF
```

## Personnalisation
- Tailwind: `tailwind.config.js`
- Types TS: `tsconfig*.json`

## Qualité / Lint
ESLint, Vitest et Testing Library configurés.
- Lint: `npm run lint`
- Tests: `npm run test`
- CI: workflow GitHub Actions `.github/workflows/ci.yml`

### Couverture
Après exécution :
```
npm run test
```
Un rapport texte s’affiche et `coverage/lcov-report/index.html` peut être ouvert dans un navigateur.

### Tests unitaires ajoutés
Des tests couvrent les fonctions de géométrie (`rotateRectPct`, `mapDisplayDeltaToModel`, etc.). Exécuter :
```
npm test
```
Mode watch UI :
```
npm run test:ui
```

## Roadmap (suggestions)
- Auth réelle (API)
- Tests unitaires (Vitest / React Testing Library)
- CI GitHub Actions (build + lint)
- Déploiement (Netlify / Vercel)
 - Offload détection contenu & auto-cochage vers Web Worker
 - Plus de tests (détection, auto-cochage)
 - Lazy loading PDF worker / dynamic import
 - Optimisation mémoire (revocation URL blobs après usage)

## Licence
Projet sous licence MIT (voir `LICENSE`).

## Contribution / Qualité
- Husky pré-commit: exécute lint-staged (Prettier + ESLint sur fichiers modifiés)
- Lint-staged: défini dans `.lintstagedrc.json`
- Formatage: Prettier (`.prettierrc`)
- TS stricte renforcée (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`)

## Workflow recommandé (dev expérimenté)
1. Créer branche feature: `git checkout -b feat/ma-fonctionnalite`
2. Développer + tests (`npm run test:ui`)
3. Lint & format auto via pre-commit
4. Push → CI (build + lint + tests) valide
5. Pull Request avec description claire

## Badges (à ajouter après premier run CI)
```
![CI](https://github.com/Docoverlay/DocOverlay/actions/workflows/ci.yml/badge.svg)
```

---
Commit de clean start: un seul commit sur `main`.
