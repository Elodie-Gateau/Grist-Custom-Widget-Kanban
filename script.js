grist.ready({ requiredAccess: "full", allowSelectBy: true });

// Déclaration des variables
const select = document.getElementById("sortBy");
const wrapper = document.getElementById("wrapper");

// État global
let allColsMeta = [];
let lastRecords = [];
let choices = [];

// Utils
function strNoAccent(str) {
  return (str ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function safeParse(json) {
  try {
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

// Fonction pour récupérer toutes les colonnes de la table actuelle
async function getAllColumns() {
  const table = await grist.getTable();
  const tableId = await table._platform.getTableId();
  const tables = await grist.docApi.fetchTable("_grist_Tables");
  const columns = await grist.docApi.fetchTable("_grist_Tables_column");
  const fields = Object.keys(columns);

  const tableColumns = [];
  if (!tableId) {
    console.log("Aucun id de table trouvé");
    return tableColumns;
  }
  const tableRef = tables.id[tables.tableId.indexOf(tableId)];
  for (const index in columns.parentId) {
    if (columns.parentId[index] === tableRef) {
      // On reconstruit une "ligne" objet depuis la table en colonnes
      tableColumns.push(
        Object.fromEntries(fields.map((f) => [f, columns[f][index]]))
      );
    }
  }
  return tableColumns;
}

/* ---------------------------------------------
   Helpers pour reconnaître Choice/ChoiceList
   et extraire l'ordre des 'choices' depuis widgetOptions
   --------------------------------------------- */
function isChoiceLike(colMeta) {
  const wo = safeParse(colMeta?.widgetOptions);
  // Certaines versions stockent le widget +/ou les choices
  return (
    wo?.widget === "Choice" ||
    wo?.widget === "ChoiceList" ||
    !!wo?.choices ||
    !!wo?.choicesById
  );
}
function getChoicesFromMeta(colMeta) {
  const wo = safeParse(colMeta?.widgetOptions);
  if (!wo) return [];

  let result = [];

  // 1) Si wo.choices est un tableau
  if (wo && Array.isArray(wo.choices)) {
    for (const c of wo.choices) {
      let label;
      if (typeof c === "string") {
        label = c;
      } else if (c && (c.label != null || c.value != null)) {
        label = c.label != null ? c.label : c.value;
      } else {
        label = "";
      }
      if (label) result.push(label);
    }
    return result;
  }

  // 2) Sinon, si wo.choicesById est un objet
  if (wo && typeof wo.choicesById === "object") {
    for (const key of Object.keys(wo.choicesById)) {
      const c = wo.choicesById[key];
      const label = (c && (c.label ?? c.value)) || "";
      if (label) result.push(label);
    }
    return result;
  }

  // 3) Sinon, rien
  return result;
}

// Initialisation du menu déroulant avec les colonnes de type "Choice"

(async () => {
  try {
    const cols = await getAllColumns();
    allColsMeta = cols;

    for (const col of cols) {
      if (isChoiceLike(col)) {
        const option = document.createElement("option");
        option.value = col.colId || col.id || "";
        option.textContent = col.label || col.colId || "(?)";
        select.appendChild(option);
        choices.push(col);
      }
    }
  } catch (e) {
    console.error(e);
  }
})();

// Fonction pour rendre les en-têtes basés sur les valeurs uniques de la colonne sélectionnée
function renderHeader(source, records) {
  const order = getChoicesFromMeta(source);
  wrapper.innerHTML = "";
  return order.map((value, index) => ({ index, value }));
}

// Fonction pour créer les éléments d'en-tête dans le DOM
function createKanban(leadHeader, wrapper, records, source) {
  for (const item of leadHeader) {
    const column = document.createElement("div");
    column.classList.add(
      "column",
      "p-2",
      "w-full",
      "h-full",
      "flex",
      "flex-col"
    );
    wrapper.appendChild(column);

    const head = document.createElement("h2");
    head.textContent = item.value;
    head.classList.add("title", "bg-primary");
    column.prepend(head);

    for (const record of records) {
      const cellValue = record[source];
      const headerValue = item.value;

      let isMatch = false;

      if (Array.isArray(cellValue)) {
        // ChoiceList : on vérifie si au moins une valeur de la liste correspond
        for (const v of cellValue) {
          if (strNoAccent(v) === strNoAccent(headerValue)) {
            isMatch = true;
            break;
          }
        }
      } else {
        // Choice (scalaire) : comparaison directe
        isMatch = strNoAccent(cellValue) === strNoAccent(headerValue);
      }

      if (!isMatch) continue;

      const card = document.createElement("div");
      card.classList.add(
        "card",
        "max-w-sm",
        "rounded",
        "overflow-hidden",
        "shadow-lg",
        "p-2",
        "h-auto"
      );
      for (const infos in record) {
        if (infos !== "id" && infos !== source) {
          const row = document.createElement("div");
          row.classList.add("flex", "gap-2", "items-center");
          const titleItem = document.createElement("h3");
          titleItem.textContent = `${infos} :`;
          const contentItem = document.createElement("p");
          contentItem.textContent = record[infos];
          row.appendChild(titleItem);
          row.appendChild(contentItem);
          card.appendChild(row);
        }
      }
      column.appendChild(card);
      card.dataset.rowId = record.id;

      card.addEventListener("click", () => {
        if (record.id !== undefined) {
          grist.setCursorPos({ rowId: record.id }); // Position l'éditeur de Grist sur le bon record
        }
      });
    }
  }
}

function catchColumn(choices, selectedSource) {
  // selectedSource = colId (ex: "Statut")
  for (const col of choices) {
    if ((col.colId || col.id) === selectedSource) {
      return col; // on renvoie l'objet méta complet (accès à widgetOptions)
    }
  }
  return null;
}

// Écouteur d'événements pour le changement de sélection dans le menu déroulant
select.addEventListener("change", () => {
  const selectedSource = select.value; // STRING: colId
  const selectedColumn = catchColumn(choices, selectedSource); // OBJET: méta (avec widgetOptions)
  if (!selectedColumn) return;

  const leadHeader = renderHeader(selectedColumn, lastRecords); // header depuis widgetOptions
  createKanban(leadHeader, wrapper, lastRecords, selectedSource);
});

// Écouteurs d'événements Grist
grist.onRecords((records) => {
  lastRecords = records || [];

  const selectedSource = select.value; // STRING: colId
  const selectedColumn = catchColumn(choices, selectedSource); // OBJET: méta
  if (!selectedColumn) return;

  const leadHeader = renderHeader(selectedColumn, lastRecords); // header depuis widgetOptions
  createKanban(leadHeader, wrapper, lastRecords, selectedSource);
});

grist.onRecord((record) => {});
