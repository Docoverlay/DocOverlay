# DocOverlay

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
ESLint et config TypeScript déjà inclus. (Ajouter `npm run lint` si nécessaire.)

## Roadmap (suggestions)
- Auth réelle (API)
- Tests unitaires (Vitest / React Testing Library)
- CI GitHub Actions (build + lint)
- Déploiement (Netlify / Vercel)

## Licence
Choisir une licence (MIT recommandé) et ajouter un fichier `LICENSE`.

---
Commit de clean start: un seul commit sur `main`.
