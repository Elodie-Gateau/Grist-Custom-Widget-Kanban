grist.ready({ requiredAccess: "full", allowSelectBy: true });

// Déclaration des variables
const select = document.getElementById("sortBy");
const wrapper = document.getElementById("wrapper");
wrapper.classList.add("h-full", "flex", "divide-x-2", "divide-slate-200");

// Fonction pour récupérer toutes les colonnes de la table actuelle
async function getAllColumns() {
  const table = await grist.getTable();
  const tableId = await table._platform.getTableId();
  const tables = await grist.docApi.fetchTable("_grist_Tables");
  const columns = await grist.docApi.fetchTable("_grist_Tables_column");
  const fields = Object.keys(columns);

  const tableColumns = [];
  if (tableId) {
    const tableRef = tables.id[tables.tableId.indexOf(tableId)];

    for (const index in columns.parentId) {
      if (columns.parentId[index] === tableRef) {
        tableColumns.push(
          Object.fromEntries(fields.map((f) => [f, columns[f][index]]))
        );
      }
    }
  } else {
    console.log("Aucun id de table trouvé");
  }
  return tableColumns;
}

// Initialisation du menu déroulant avec les colonnes de type "Choice"
(async () => {
  try {
    const cols = await getAllColumns();
    for (const col of cols) {
      if (col.type === "Choice") {
        const option = document.createElement("option");
        option.value = strNoAccent(col.label);
        option.textContent = col.label;
        select.appendChild(option);
      }
    }
  } catch (e) {
    console.error(e);
  }
})();

// Fonction pour rendre les en-têtes basés sur les valeurs uniques de la colonne sélectionnée
function renderHeader(source, records) {
  wrapper.innerHTML = "";
  const leadValues = [];
  for (const row of records) {
    const value = row[source];
    const valueNoAccent = strNoAccent(value);
    if (
      value !== undefined &&
      value !== "" &&
      !leadValues.some((v) => strNoAccent(v) === valueNoAccent)
    ) {
      leadValues.push(value);
    }
  }
  return leadValues;
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
    head.textContent = item;
    head.classList.add("title", "bg-primary");
    column.prepend(head);

    for (const record of records) {
      if (strNoAccent(record[source]) === strNoAccent(item)) {
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
            const item = document.createElement("div");
            card.appendChild(item);
            item.classList.add("flex", "gap-2", "items-center");
            const titleItem = document.createElement("h3");
            titleItem.textContent = infos;
            const contentItem = document.createElement("p");
            contentItem.textContent = record[infos];
            item.appendChild(titleItem);
            item.appendChild(contentItem);
          }
        }
        column.appendChild(card);
        // Pour chaque record, lors de la création de la card :
        card.dataset.rowId = record.id; // Ajoute l'id du record comme data attribute

        card.addEventListener("click", () => {
          if (record.id !== undefined) {
            grist.setCursorPos({ rowId: record.id }); // Position l'éditeur de Grist sur le bon record
          }
        });
      }
    }
  }
}

// Fonction pour supprimer les accents d'une chaîne de caractères
function strNoAccent(str) {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Écouteur d'événements pour le changement de sélection dans le menu déroulant
grist.onRecords((records) => {
  const selectedSource = select.value;
  const leadHeader = renderHeader(selectedSource, records);
  createKanban(leadHeader, wrapper, records, selectedSource);

  select.addEventListener("change", () => {
    const selectedSource = strNoAccent(select.value);
    const leadHeader = renderHeader(selectedSource, records);
    createKanban(leadHeader, wrapper, records, selectedSource);
  });
});

grist.onRecord((record) => {
  console.log(record);
});
