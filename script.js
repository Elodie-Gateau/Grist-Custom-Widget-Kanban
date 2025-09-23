grist.ready({ requiredAccess: "full" });

// Déclaration des variables
const select = document.getElementById("sortBy");
const wrapper = document.getElementById("wrapper");

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
        option.value = col.label;
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

    if (value !== undefined && value !== "" && !leadValues.includes(value)) {
      leadValues.push(value);
    }
  }
  return leadValues;
}

// Fonction pour créer les éléments d'en-tête dans le DOM
function createKanban(leadHeader, wrapper, records, source) {
  console.log(leadHeader);
  console.log(source);
  console.log(records);
  for (const item of leadHeader) {
    const column = document.createElement("div");
    column.classList.add("column");
    wrapper.appendChild(column);

    const head = document.createElement("h2");
    head.textContent = item;
    head.classList.add("title");
    column.prepend(head);

    for (const record of records) {
      if (record[source] === item) {
        for (const infos in record) {
          console.log(infos, record[infos]);
        }
        const card = document.createElement("div");
        card.classList.add("card");
        card.textContent = record.Nom || "";
        column.appendChild(card);
      }
    }
  }
}

// Fonction pour supprimer les accents d'une chaîne de caractères
function strNoAccent(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// function showCard(source, records, leadHeader) {
//   console.log(leadHeader);
//   console.log(source);
//   console.log(records);
//   for (const leadItem of leadHeader) {
//     const card = document.createElement("div");
//     card.classList.add("card");
//   }
// }

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

grist.onRecord((record) => {});
