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
npm run preview  # prévisualiser le build
```

## Démarrage rapide
1. Cloner le dépôt
2. Installer Node.js >= 18
3. `npm install`
4. `npm run dev`

## Structure
```
project/
  public/            # assets publics, pdf worker
  src/
    components/      # UI et vues
    hooks/           # hooks personnalisés
    utils/           # helpers
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

## Roadmap (suggestions)
- Auth réelle (API)
- Tests unitaires (Vitest / React Testing Library)
- CI GitHub Actions (build + lint)
- Déploiement (Netlify / Vercel)

## Licence
Projet sous licence MIT (voir `LICENSE`).

---
Commit de clean start: un seul commit sur `main`.
