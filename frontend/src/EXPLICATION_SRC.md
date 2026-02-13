# Explication Du Dossier `src`

Ce document explique le role de chaque fichier pour comprendre l'architecture frontend.

## Vue d'ensemble

Le frontend est organise en couches:

1. `main.jsx`: point d'entree React.
2. `App.jsx`: orchestrateur principal (layout + choix de la vue active).
3. `hooks/`: logique metier et etat global de l'app.
4. `views/`: ecrans fonctionnels (auth, library, admin, etc.).
5. `components/`: composants reutilisables (layout, feedback, chart).
6. `services/`: acces API.
7. `utils/`: fonctions utilitaires pures.
8. `config/`: constantes de configuration.
9. `styles.css`: styles globaux.

---

## Fichiers racine

### `src/main.jsx`
- Monte React dans `#root`.
- Importe `App.jsx` et `styles.css`.

### `src/App.jsx`
- Compose le squelette de l'application:
  - `AppHeader`
  - `SidebarNav`
  - `ToastHost`
  - la vue active (Auth, Dashboard, Library, etc.)
- Utilise le hook `useLibraryApp()` pour recuperer:
  - etat global
  - refs formulaires
  - actions metier
- Ne contient presque plus de logique metier lourde.

### `src/styles.css`
- Feuille de style globale.
- Gere layout, cartes, tableaux, grilles AG Grid, toasts, responsive.

---

## Dossier `config/`

### `src/config/auth.js`
- Stocke la constante `AUTH_TOKEN_KEY` utilisee pour `localStorage`.

### `src/config/views.js`
- Defini les cles de navigation (`auth`, `dashboard`, etc.).
- Defini aussi les items du menu lateral `MAIN_NAV_ITEMS`.

---

## Dossier `services/`

### `src/services/api.js`
- Fournit `apiRequest(path, options)`.
- Enveloppe `fetch` avec:
  - `credentials: "include"`
  - gestion d'erreur uniforme (`throw Error(...)` si `!response.ok`)
- Centralise le comportement reseau de base.

---

## Dossier `utils/`

### `src/utils/money.js`
- Fonction `money(value)` pour formatter en dollars (`$xx.xx`).

### `src/utils/books.js`
- Fonction `parseBooksPayload(text)` pour parser un JSON d'import livres.
- Accepte:
  - un tableau direct
  - ou `{ books: [...] }`
- Lance `invalid_json` si format incorrect.

---

## Dossier `hooks/`

### `src/hooks/useToast.js`
- Gere l'etat des toasts.
- Expose:
  - `toasts`
  - `showToast(title, message, variant)`
- Chaque toast disparait automatiquement apres timeout.

### `src/hooks/useLibraryApp.js`
- Hook central de l'application.
- Contient principalement l'orchestration:
  - etats globaux (`user`, `books`, `favorites`, `adminStats`, etc.)
  - branchement des sous-hooks metier
  - logique de navigation/rechargement globale
- Retourne un objet `app` utilise par `App.jsx`:
  - `app.status`, `app.view`, `app.user`, ...
  - `app.refs`
  - `app.actions`

### `src/hooks/library/useLibraryRefs.js`
- Centralise toutes les refs de formulaires et inputs fichier.

### `src/hooks/library/useLibraryLoaders.js`
- Regroupe les fonctions de chargement donnees:
  - `loadBooks`, `loadFavorites`, `loadCustomBooks`, `loadRentals`, `loadAdminData`, etc.
- Gere aussi:
  - `loadSession`
  - `refreshAll`
  - `reloadView`

### `src/hooks/library/useLibraryActions.js`
- Regroupe les actions utilisateur (mutations):
  - auth (`handleLogin`, `handleRegister`, `handleLogout`)
  - favoris, locations, admin updates, imports, etc.

### `src/hooks/library/useLibraryCharts.js`
- Construit les donnees derivees pour les graphiques:
  - `userTrendChart`
  - `userCategoryChart`
  - `adminCharts`

---

## Dossier `components/`

### `src/components/ChartCanvas.jsx`
- Composant low-level pour afficher un graphique Chart.js dans un `<canvas>`.
- Cree/detruit proprement l'instance Chart via `useEffect`.

### `src/components/layout/AppHeader.jsx`
- Affiche logo, statut utilisateur, bouton sign in/sign out.

### `src/components/layout/SidebarNav.jsx`
- Affiche la navigation laterale.
- Utilise `MAIN_NAV_ITEMS`.
- Affiche "Admin Studio" uniquement si `adminVisible`.

### `src/components/feedback/ToastHost.jsx`
- Affiche la liste des toasts actifs.

---

## Dossier `views/`

Chaque fichier `views/*.jsx` represente un ecran metier:

### `src/views/AuthView.jsx`
- Formulaire login + creation de compte.
- Recoit `refs`, `onLogin`, `onRegister` en props.

### `src/views/DashboardView.jsx`
- Resume utilisateur:
  - budget
  - nombre de locations en cours
  - historique
  - nombre de livres

### `src/views/LibraryView.jsx`
- Affiche la bibliotheque en AG Grid.
- Actions:
  - louer un livre
  - ajouter en favori

### `src/views/FavoritesView.jsx`
- Affiche favoris en AG Grid.
- Permet suppression d'un favori.
- Gere upload JSON des livres custom.
- Affiche les livres custom avec action "Favorite".

### `src/views/RentalsView.jsx`
- Affiche:
  - historique des locations
  - locations en cours
- Permet retour d'un livre.

### `src/views/AnalyticsView.jsx`
- Affiche les graphes utilisateur:
  - tendance de locations
  - repartition par categorie

### `src/views/AdminView.jsx`
- Ecran admin:
  - totaux globaux
  - edition budget utilisateurs
  - ajout/import de livres
  - edition stock
  - graphes admin

---

## Flux de fonctionnement (resume)

1. `main.jsx` charge `App`.
2. `App` appelle `useLibraryApp()`.
3. `useLibraryApp` charge session + donnees initiales.
4. `App` affiche layout global et choisit la vue via `app.view`.
5. Les vues appellent `app.actions.*`.
6. Les actions mettent a jour l'etat et declenchent reloads/toasts.

---

## Pourquoi c'est plus "clean"

- Separation claire UI / logique / utilitaires / reseau.
- `App.jsx` est simple, lisible et stable.
- Chaque vue est focalisee sur une responsabilite.
- La logique metier est centralisee dans un hook unique et testable.
- Les composants reutilisables sont isoles.
