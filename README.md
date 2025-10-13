![Last commit](https://img.shields.io/github/last-commit/elodie-gateau/Grist-Custom-Widget-Kanban?style=for-the-badge&color=blueviolet)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Online-2ea44f?style=for-the-badge&logo=github)
![JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Styled%20with-TailwindCSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Grist](https://img.shields.io/badge/Built%20for-Grist-15803d?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAVUlEQVQokWNgYGD4z0ABYBxVSF8BkQ0wDEQmoySLEB8vQvQdgUpoAxVMB0D8mwZQAKizkY2AAkRlA3L5gZGIAAjC3qAAEYQ2AwAJchAA7JbT0EAAAAASUVORK5CYII=)

# Kanban – Custom Widget pour Grist

> **Résumé** : Un widget Kanban léger pour **Grist** (No‑Code DB), déployé sur **GitHub Pages**.  
> **Spécificités** : tout le **HTML + JavaScript** est regroupé **dans un seul fichier** pour permettre l’intégration directe via l’URL du widget.

---

## Fonctionnalités

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

## Architecture globale

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

## API Grist utilisée (principales)

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

## Installation dans Grist (Custom Widget)

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

## Pré‑requis & limites

- **Colonne source** : doit être un **`Choice`** ou **`ChoiceList`** (sinon aucune colonne n’est générée).
- **Droits** : l’onglet doit être créé avec **Full access** pour permettre l’écriture et la MAJ des options.
- **Types supportés (cartes)** : Text, Number/Currency/Percent, Date/DateTime, Bool, Choice/List, Ref/RefList.
- **Fuseau & format** : le filtrage **date** compare à “aujourd’hui” côté navigateur (selon votre locale).
- **Performance** : sur tables volumineuses, préférez un **filtre Grist** en amont et/ou évitez d’afficher **tous** les champs.

---

## Dépannage

- **Menus vides (Source/Lane)** : assurez‑vous d’avoir des colonnes **Choice/ChoiceList** dans la table active.
- **Drag & drop sans effet** : contrôlez l’**Access level = Full** et l’absence d’autorisations restreintes sur la table.
- **Nouveaux Choice non pris en compte** : appuyez sur “+”, validez le libellé, puis **rechargez** le widget si besoin.
- **Dates non filtrées** : choisissez bien la **colonne de type Date/DateTime** dans le panneau “Filtre par date”.

---

## Auteur

**Élodie GATEAU**  
Développeuse Web & No-Code • Création du widget **Kanban pour Grist**  
Réalisé dans le cadre d’un **stage chez Dycazo** (optimisation de l’outil No-Code Grist).

---

## Références utiles

- **Grist Plugin API** : `https://docs.getgrist.com/`
- **Tailwind CDN** : `https://cdn.tailwindcss.com`

# Kanban – Custom Widget for Grist

> **Summary**: A lightweight Kanban widget for **Grist** (No-Code DB), deployed on **GitHub Pages**.  
> **Specifics**: all **HTML + JavaScript** are combined **into a single file** to allow direct integration through the widget URL.

---

## Features

- **Kanban** based on a **`Choice` / `ChoiceList`** column (source), including support for the **`(empty)`** column.
- **Drag and drop** cards between columns → live updates in the database (`UpdateRecord`).
- **Hide/show columns**.
- **Select fields** displayed on cards.
- **Grouping by “lane”** (second dimension): creates a **list of kanbans** (one per value of the chosen column), with collapsible **accordion sections** and **synchronized counters**.
- **Date filter**: select a `Date/DateTime` field + option to **hide past records** (compared to “today”).
- **“+” button** to **create a new Kanban column** → adds a new **Choice** value in the source column (schema update via `docApi.applyUserActions`).
- **Enhanced rendering**: supports **number, percent, currency, date/time** formats, colored `Choice/ChoiceList` chips, `Ref/RefList` as badges, and `Bool` with checkboxes.
- **Persistent preferences** per widget (via `widgetApi.setOption`).
- **Accessibility & UX**: responsive layout (Tailwind CDN), dark mode, and column-level card counters.

---

## Global Architecture

The widget is a **single HTML file** (HTML + JS) that loads:

- `https://docs.getgrist.com/grist-plugin-api.js` (Grist plugin API)
- `https://cdn.tailwindcss.com` (CSS utility classes)

### Internal script organization (commented sections)

0. **Bootstrap Grist & DOM**: `grist.ready(...)`, UI node references, global state.
1. **Generic helpers**: normalization (`strNoAccent`, `norm`), safe JSON parsing, slugs, empty tests, etc.
2. **Persistent option keys**: conventions for option naming (see below).
3. **Column metadata & types**: `getFieldType`, `getDisplayStyle`, `widgetOptions` parsing.
4. **Colors & Choices**: color cache, fallbacks, mapping from `choices` / `choicesById`.
5. **Display style detection**: number/currency/percent, date/time, i18n support.
6. **Option persistence**: `get*/set*` around `widgetApi.setOption`.
7. **Metadata index & columns**: introspection of `_grist_Tables` / `_grist_Tables_column`, quick lookup.
8. **Choice & Date helpers**: detect `Choice/List`, parse options, date utilities.
9. **Value rendering & UI**: `renderFieldValue(...)` with support for Choice, Ref, Bool, etc.
10. **Option panels**: **Visible columns**, **Visible fields**, **Date filter**.
11. **Kanban construction & DnD**: column creation, **drag & drop**, `UpdateRecord`.
12. **Grist lifecycle**: `onOptions`, `onRecords`, lazy init, UI events (selects, accordions).

---

## Grist API Used (main calls)

- **Widget lifecycle & options**
  - `grist.ready({ requiredAccess: "full", allowSelectBy: true })`
  - `grist.onOptions((opts) => { ... })`
  - `grist.widgetApi.setOption(key, value)`
- **Data & navigation**
  - `grist.onRecords((records) => { ... })`
  - `grist.setCursorPos({ rowId })`
- **Schema introspection (read)**
  - `grist.getTable()` → `table._platform.getTableId()` _(internal use)_
  - `grist.docApi.fetchTable("_grist_Tables")`
  - `grist.docApi.fetchTable("_grist_Tables_column")`
- **Write operations (user actions)**
  - `grist.docApi.applyUserActions([["UpdateRecord", tableId, rowId, { ... }]])`
  - Update of a column’s `widgetOptions` (adding a new **Choice**).

> ⚠️ **Required access**: `requiredAccess: "full"` (for writing to tables and widget options).

---

## Installation in Grist (Custom Widget)

1. Open your **Grist document** → add a **page** or a **view to an existing page**.
2. Click **Custom** → select your data source → **Add to page**.
3. In the **URL** field, **paste the GitHub Pages URL** of the widget:  
   **https://elodie-gateau.github.io/Grist-Custom-Widget-Kanban/**
4. **Access level**: choose **Full** (required for drag-and-drop and `Choice` additions).
5. In the **widget settings panel**:
   - **Select the “source”** (`Choice/ChoiceList` column) in the “Choose a source” dropdown.
   - _(Optional)_ **Group by...** a second column to enable **lanes** (row grouping).
   - **Columns**: manage **visibility** (toggle “Show/Hide columns”).
   - **Fields**: choose the **mode** (default / all / custom) and visible fields.
   - **Date filter**: pick a **date column** and enable **“hide past”** if desired.
6. **Drag and drop** a card between columns to confirm database updates.
7. _(Optional)_ Click **“+”** to **add a new Kanban column** — this creates a **new Choice** in the source column (persisted in the schema).
8. _(Optional)_ **Add a “Detail view” linked to the Kanban** to easily edit records:
   - **Add to page** → **Card** (or “Detail view”) and select **the same table** as the Kanban.
   - In the **Data** panel of the “Card” view:
     - **Data source**: same table.
     - **Link section selection to**: **the Kanban section** (its name in the page).
   - Result: when you **click a card** in the Kanban (`grist.setCursorPos({ rowId })`),  
     the **Detail view** automatically shows **the selected record**, allowing easy edits.

---

## Requirements & Limitations

- **Source column**: must be a **`Choice`** or **`ChoiceList`** (otherwise no columns are generated).
- **Access rights**: the widget must have **Full access** to enable updates and option changes.
- **Supported field types (cards)**: Text, Number/Currency/Percent, Date/DateTime, Bool, Choice/List, Ref/RefList.
- **Time zone & locale**: date filtering compares against “today” on the client side (local timezone).
- **Performance**: on large tables, use a **Grist filter** beforehand and/or limit the number of displayed fields.

---

## Troubleshooting

- **Empty menus (Source/Lane)** → ensure the table has **Choice/ChoiceList** columns.
- **Drag & drop not working** → check **Access level = Full** and no restricted permissions.
- **New Choice not appearing** → click “+”, confirm the label, then **reload** the widget if needed.
- **Date filter not applied** → make sure a **Date/DateTime** column is selected in the “Date filter” panel.

---

## Author

**Élodie GATEAU**  
Web & No-Code Developer • Creator of the **Kanban Widget for Grist**  
Developed as part of an **internship at Dycazo**, optimizing the **No-Code tool Grist**.

---

## Useful References

- **Grist Plugin API** → `https://docs.getgrist.com/`
- **Tailwind CDN** → `https://cdn.tailwindcss.com`
