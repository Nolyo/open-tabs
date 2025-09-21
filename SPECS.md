# TODO - Extension Chrome "Open Tabs"

## Phase 1: Configuration et Setup ✅
- [x] Configurer le projet Plasmo avec les dépendances nécessaires
- [x] Mettre à jour manifest.json avec les permissions requises
- [x] Installer @plasmohq/storage pour la gestion des données
- [x] Créer la structure de base des fichiers

## Phase 2: Modèle de Données et Storage ✅
- [x] Définir les interfaces TypeScript pour TabGroup et TabUrl
- [x] Configurer le storage avec @plasmohq/storage
- [x] Implémenter les fonctions CRUD pour les groupes
- [x] Implémenter les fonctions CRUD pour les URLs
- [x] Mettre en place la persistance des données

## Phase 3: Background Script ✅
- [x] Créer background.ts avec la logique métier
- [x] Implémenter la fonction d'ouverture groupée des onglets
- [x] Gérer la création des groupes Chrome natifs
- [x] Mettre en place les listeners pour les événements Chrome

## Phase 4: Interface Popup ✅
- [x] Développer popup.tsx avec la liste des groupes récents
- [x] Ajouter le bouton "Ajouter l'onglet courant"
- [x] Implémenter la sélection de groupe pour ajout d'URL
- [x] Ajouter le bouton "Ouvrir un groupe" rapide
- [x] Lier vers la page d'options complète

## Phase 5: Page d'Options ✅
- [x] Créer options.tsx pour la gestion complète
- [x] Implémenter l'affichage en grille des groupes
- [x] Développer le formulaire de création/édition de groupe
- [x] Ajouter la fonctionnalité d'import depuis bookmarks
- [x] Implémenter l'export JSON
- [x] Ajouter la recherche et les filtres

## Phase 6: Features Avancées
- [ ] Implémenter le drag & drop pour réorganiser les groupes
- [ ] Ajouter la recherche full-text dans les URLs
- [ ] Mettre en place les filtres par date et nombre d'URLs
- [ ] Gérer les couleurs des groupes
- [ ] Ajouter la suppression et l'édition des URLs

## Phase 7: Tests et Optimisation
- [ ] Tester toutes les fonctionnalités
- [ ] Vérifier la compatibilité Chrome
- [ ] Optimiser les performances
- [ ] Tester le stockage et la persistance
- [ ] Valider l'expérience utilisateur

## Phase 8: Documentation et Déploiement
- [ ] Mettre à jour README.md avec les instructions
- [ ] Préparer le package pour publication
- [ ] Créer les assets nécessaires (icônes)
- [ ] Documenter l'utilisation de l'extension

---

## Détails Techniques

### Permissions Chrome requises:
```json
{
  "permissions": [
    "storage",
    "tabs",
    "tabGroups"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ]
}
```

### Structure des fichiers:
```
open-tabs/
├── popup.tsx           # Interface principale
├── options.tsx         # Page de gestion complète
├── background.ts       # Logique métier
└── assets/             # Icônes et ressources
```

### Dépendances à ajouter:
- @plasmohq/storage
- @types/chrome (déjà dans devDependencies)

### Structure des données:
- TabGroup: { id, name, color, urls[], createdAt, updatedAt }
- TabUrl: { id, url, title?, favicon?, groupId, order }