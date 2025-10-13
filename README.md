# Kanban – Custom Widget pour Grist

> **Résumé** : Un widget Kanban léger pour **Grist** (No‑Code DB), déployé sur **GitHub Pages**.  
> **Spécificités** : tout le **HTML + JavaScript** est regroupé **dans un seul fichier** pour permettre l’intégration directe via l’URL du widget.

---

## ✨ Fonctionnalités

- **Kanban** basé sur une **colonne `Choice` / `ChoiceList`** (source) avec gestion de la colonne **`(vide)`**.
- **Glisser‑déposer** des cartes entre colonnes → mise à jour réelle en base (UpdateRecord).
- **Masquage** de colonnes.
- **Sélection des champs** affichés sur les cartes.
- **Groupement par “ligne”** (seconde dimension) : crée une **liste de kanbans** (un par valeur de la colonne choisie), avec **accordéons** ouvrables/fermeturables et **compteurs synchronisés**.
- **Filtre date** : choix du champ `Date/DateTime` + option **masquer les cartes passées** (comparé à “aujourd’hui”).
- **Bouton `+`** pour **créer une nouvelle colonne Kanban** → ajoute le **Choice** dans la colonne source (mise à jour du schéma via `docApi.applyUserActions`).
- **Affichage enrichi** : formats **nombre, pourcentage, devise, date/heure**, rendu `Choice/ChoiceList` avec **couleurs**, `Ref/RefList` sous forme de badges, `Bool` avec cases cochées.
- **Préférences persistées** par widget (via `widgetApi.setOption` / options stockées).
- **Accessibilité & UX** : responsive (Tailwind CDN), mode sombre, compteurs de cartes par colonne.

---

## 🧩 Architecture globale

Le widget est un **fichier unique** (HTML + JS) qui charge :

- `https://docs.getgrist.com/grist-plugin-api.js` (API widget Grist)
- `https://cdn.tailwindcss.com` (utilitaires CSS)

### Organisation interne du script (repères commentés)

0. **Bootstrap Grist & DOM** : `grist.ready(...)`, récupération des nœuds UI, état global.
1. **Helpers génériques** : normalisation (`strNoAccent`, `norm`), JSON safe, slug, vide, etc.
2. **Clés d’options persistées** : conventions des clés (voir plus bas).
3. **Métadonnées colonnes & types** : `getFieldType`, `getDisplayStyle`, parsing `widgetOptions`.
4. **Couleurs & Choice(s)** : cache des couleurs, fallbacks, mapping `choices/choicesById`.
5. **Détection styles d’affichage** : nombre/devise/%, date/heure, options i18n.
6. **Persistance d’options** : `get*/set*` autour de `widgetApi.setOption`.
7. **Index méta & colonnes** : introspection `_grist_Tables` / `_grist_Tables_column`, index rapide.
8. **Helpers Choice & Date** : détection `Choice/List`, parsing des options, utilitaires date.
9. **Rendu valeurs & UI** : `renderFieldValue(...)` et déclinaisons (Choice, Ref, Bool, etc.).
10. **Panneaux d’options** : **Colonnes visibles**, **Champs visibles**, **Filtre Date**.
11. **Construction Kanban & DnD** : création des colonnes, **drag & drop**, `UpdateRecord`.
12. **Cycle de vie Grist** : `onOptions`, `onRecords`, init lazy, événements UI (selects, accordéons).

---

## 🔧 API Grist utilisée (principales)

- **Widget lifecycle & options**
  - `grist.ready({ requiredAccess: "full", allowSelectBy: true })`
  - `grist.onOptions((opts) => { ... })`
  - `grist.widgetApi.setOption(key, value)`
- **Données & navigation**
  - `grist.onRecords((records) => { ... })`
  - `grist.setCursorPos({ rowId })`
- **Introspection schéma (lecture)**
  - `grist.getTable()` → `table._platform.getTableId()` _(usage interne)_
  - `grist.docApi.fetchTable("_grist_Tables")`
  - `grist.docApi.fetchTable("_grist_Tables_column")`
- **Écriture (actions utilisateur)**
  - `grist.docApi.applyUserActions([["UpdateRecord", tableId, rowId, { ... }]])`
  - Mise à jour de `widgetOptions` d’une colonne (ajout d’un **Choice**).

> ⚠️ **Accès requis** : `requiredAccess: "full"` (écriture dans les tables et les options).

---

## 🧰 Installation dans Grist (Custom Widget)

1. Ouvrez votre **document Grist** → ajoutez une **page** ou une **vue à la page**.
2. Cliquez sur **Personnalisée** → Sélectionnez votre source de données → **Ajouter une page**.
3. Dans le champ **URL**, **collez l’URL GitHub Pages** du widget : **https://elodie-gateau.github.io/Grist-Custom-Widget-Kanban/** .
4. **Access level** : choisissez **Full** (nécessaire pour drag&drop, ajout de `Choice`, etc.).
5. Dans le **panneau du widget** :
   - **Choisissez la “source”** (colonne `Choice/ChoiceList`) : menu déroulant “Choisissez une source”.
   - (Optionnel) **Regroupez par…** une seconde colonne pour activer les **lignes**.
   - **Colonnes** : configurez la **visibilité** (bouton _Afficher/Masquer les colonnes_).
   - **Champs** : choisissez le **mode** (par défaut / tous / personnalisé) et les champs visibles.
   - **Filtre date** : sélectionnez la **colonne date** et activez **“masquer le passé”** si souhaité.
6. **Drag & drop** une carte entre colonnes pour vérifier l’écriture en base.
7. (Optionnel) Appuyez sur **“+”** pour **ajouter une colonne** Kanban : cela crée un **nouveau Choice** dans la colonne source (persisté dans le schéma).
8. _(Optionnel)_ **Ajouter une “vue fiche” liée au Kanban** pour éditer facilement le record :
   - **Ajouter une vue à la page** → **Fiche** et choisissez **la même table** que celle du Kanban.
   - Dans le panneau **Données** de la vue “Fiche” :
     - **Données sources** : la même table.
     - **Sélectionner par** : **la section du Kanban** (son nom dans la page).
   - Résultat : au **clic sur une carte** du Kanban (le widget envoie `grist.setCursorPos({ rowId })`),  
     la vue **Fiche** s'affiche automatiquement **sur l’enregistrement sélectionné**, pour modifier d’autres champs.

---

## 📦 Pré‑requis & limites

- **Colonne source** : doit être un **`Choice`** ou **`ChoiceList`** (sinon aucune colonne n’est générée).
- **Droits** : l’onglet doit être créé avec **Full access** pour permettre l’écriture et la MAJ des options.
- **Types supportés (cartes)** : Text, Number/Currency/Percent, Date/DateTime, Bool, Choice/List, Ref/RefList.
- **Fuseau & format** : le filtrage **date** compare à “aujourd’hui” côté navigateur (selon votre locale).
- **Performance** : sur tables volumineuses, préférez un **filtre Grist** en amont et/ou évitez d’afficher **tous** les champs.

---

## 🐞 Dépannage

- **Menus vides (Source/Lane)** : assurez‑vous d’avoir des colonnes **Choice/ChoiceList** dans la table active.
- **Drag & drop sans effet** : contrôlez l’**Access level = Full** et l’absence d’autorisations restreintes sur la table.
- **Nouveaux Choice non pris en compte** : appuyez sur “+”, validez le libellé, puis **rechargez** le widget si besoin.
- **Dates non filtrées** : choisissez bien la **colonne de type Date/DateTime** dans le panneau “Filtre par date”.

---

## 👩‍💻 Auteur

**Élodie GATEAU**  
Développeuse Web & No-Code • Création du widget **Kanban pour Grist**  
Réalisé dans le cadre d’un **stage chez Dycazo** (optimisation de l’outil No-Code Grist).

---

## 📚 Références utiles

- **Grist Plugin API** : `https://docs.getgrist.com/`
- **Tailwind CDN** : `https://cdn.tailwindcss.com`
