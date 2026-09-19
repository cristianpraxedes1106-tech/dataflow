const DASHBOARD_DATASET_KEY = "dataflow_dashboard_dataset_id";
const DASHBOARD_COLUMNS_KEY = "dataflow_dashboard_column_config";
let activeDashboardDataset = null;

document.addEventListener("DOMContentLoaded", initDashboardDatasetSelection);

function initDashboardDatasetSelection() {
    const datasets = getDatasets();
    const emptyState = document.getElementById("dashboardEmptyState");
    const selectionPanel = document.getElementById("datasetSelectionPanel");
    const select = document.getElementById("dashboardDatasetSelect");

    if (!emptyState || !selectionPanel || !select) return;

    if (!datasets.length) {
        emptyState.classList.remove("d-none");
        selectionPanel.classList.add("d-none");
        localStorage.removeItem(DASHBOARD_DATASET_KEY);
        return;
    }

    emptyState.classList.add("d-none");
    selectionPanel.classList.remove("d-none");

    select.innerHTML = `
        <option value="">Selecione um conjunto</option>
        ${datasets.map(dataset => `
            <option value="${escapeDashboardHTML(dataset.id)}">
                ${escapeDashboardHTML(dataset.name)} (${formatDashboardNumber(dataset.rows)} registros)
            </option>
        `).join("")}
    `;

    const savedId = localStorage.getItem(DASHBOARD_DATASET_KEY);
    const savedDataset = datasets.find(dataset => String(dataset.id) === savedId);

    if (savedDataset) {
        select.value = String(savedDataset.id);
        renderSelectedDataset(savedDataset);
    }

    select.addEventListener("change", () => {
        const dataset = datasets.find(item => String(item.id) === select.value);

        if (!dataset) {
            localStorage.removeItem(DASHBOARD_DATASET_KEY);
            hideSelectedDataset();
            return;
        }

        localStorage.setItem(DASHBOARD_DATASET_KEY, String(dataset.id));
        renderSelectedDataset(dataset);
    });
}

function renderSelectedDataset(dataset) {
    const summary = document.getElementById("selectedDatasetSummary");

    if (!summary) return;

    setDashboardText("selectedDatasetName", dataset.name || "Conjunto sem nome");
    setDashboardText(
        "selectedDatasetDescription",
        dataset.description || dataset.fileName || "Dados importados"
    );
    setDashboardText("selectedDatasetRows", formatDashboardNumber(dataset.rows));
    setDashboardText("selectedDatasetColumns", formatDashboardNumber(dataset.columns));
    setDashboardText("selectedDatasetFormat", getDatasetFormat(dataset));
    setDashboardText("selectedDatasetUpdated", formatDashboardDate(dataset.updatedAt || dataset.createdAt));

    activeDashboardDataset = dataset;
    summary.classList.remove("d-none");
    renderColumnSelection(dataset);
}

function hideSelectedDataset() {
    activeDashboardDataset = null;
    document.getElementById("selectedDatasetSummary")?.classList.add("d-none");
    document.getElementById("columnSelectionPanel")?.classList.add("d-none");
}

function renderColumnSelection(dataset) {
    const panel = document.getElementById("columnSelectionPanel");
    const categorySelect = document.getElementById("categoryColumnSelect");
    const metricSelect = document.getElementById("metricColumnSelect");
    const warning = document.getElementById("columnSelectionWarning");

    if (!panel || !categorySelect || !metricSelect || !warning) return;

    const columns = getDashboardColumns(dataset);
    const categoryColumns = columns.filter(column => column.type !== "number");
    const numericColumns = columns.filter(column => column.type === "number");
    const availableCategories = categoryColumns.length ? categoryColumns : columns;

    categorySelect.innerHTML = buildColumnOptions(
        "Selecione uma coluna",
        availableCategories
    );
    metricSelect.innerHTML = buildColumnOptions(
        "Selecione uma coluna numérica",
        numericColumns
    );

    const config = getSavedColumnConfig(dataset.id);
    const validCategory = availableCategories.some(column => column.name === config.category);
    const validMetric = numericColumns.some(column => column.name === config.metric);

    categorySelect.value = validCategory ? config.category : "";
    metricSelect.value = validMetric ? config.metric : "";
    metricSelect.disabled = numericColumns.length === 0;

    if (!numericColumns.length) {
        warning.classList.remove("d-none");
        warning.querySelector("span").textContent =
            "Este conjunto não possui uma coluna numérica. Importe dados com valores ou quantidades para continuar.";
    } else {
        warning.classList.add("d-none");
    }

    categorySelect.onchange = saveActiveColumnSelection;
    metricSelect.onchange = saveActiveColumnSelection;

    panel.classList.remove("d-none");
    updateColumnSelectionState();
}

function buildColumnOptions(placeholder, columns) {
    return `
        <option value="">${placeholder}</option>
        ${columns.map(column => `
            <option value="${escapeDashboardHTML(column.name)}">
                ${escapeDashboardHTML(column.name)} · ${getColumnTypeLabel(column.type)}
            </option>
        `).join("")}
    `;
}

function getDashboardColumns(dataset) {
    if (Array.isArray(dataset.columnAnalysis) && dataset.columnAnalysis.length) {
        return dataset.columnAnalysis.map(column => ({
            name: String(column.name),
            type: ["number", "date", "text"].includes(column.type) ? column.type : "text"
        }));
    }

    const headers = Array.isArray(dataset.headers) ? dataset.headers : [];
    const rows = Array.isArray(dataset.data) ? dataset.data : [];

    return headers.map(header => {
        const values = rows
            .map(row => row?.[header])
            .filter(value => String(value ?? "").trim() !== "");
        const numeric = values.length > 0 && values.every(isDashboardNumericValue);

        return { name: String(header), type: numeric ? "number" : "text" };
    });
}

function isDashboardNumericValue(value) {
    const normalized = String(value ?? "")
        .trim()
        .replace(/R\$\s?/gi, "")
        .replace(/\s/g, "")
        .replace(/\.(?=\d{3}(?:\D|$))/g, "")
        .replace(",", ".");

    return normalized !== "" && Number.isFinite(Number(normalized));
}

function getColumnTypeLabel(type) {
    if (type === "number") return "Número";
    if (type === "date") return "Data";
    return "Texto";
}

function saveActiveColumnSelection() {
    if (!activeDashboardDataset) return;

    const category = document.getElementById("categoryColumnSelect")?.value || "";
    const metric = document.getElementById("metricColumnSelect")?.value || "";
    const allConfigs = getAllColumnConfigs();

    if (category || metric) {
        allConfigs[String(activeDashboardDataset.id)] = { category, metric };
    } else {
        delete allConfigs[String(activeDashboardDataset.id)];
    }

    localStorage.setItem(DASHBOARD_COLUMNS_KEY, JSON.stringify(allConfigs));
    updateColumnSelectionState();
}

function updateColumnSelectionState() {
    const category = document.getElementById("categoryColumnSelect")?.value || "";
    const metric = document.getElementById("metricColumnSelect")?.value || "";
    const status = document.getElementById("columnSelectionStatus");
    const ready = document.getElementById("columnSelectionReady");

    if (!status || !ready) return;

    if (category && metric) {
        status.classList.add("ready");
        status.innerHTML = '<i class="bi bi-check-circle-fill"></i> Colunas definidas';
        setDashboardText("columnSelectionSummary", `${metric} será analisado por ${category}.`);
        ready.classList.remove("d-none");
    } else {
        status.classList.remove("ready");
        status.innerHTML = '<i class="bi bi-circle"></i> Selecione as duas colunas';
        ready.classList.add("d-none");
    }
}

function getSavedColumnConfig(datasetId) {
    return getAllColumnConfigs()[String(datasetId)] || { category: "", metric: "" };
}

function getAllColumnConfigs() {
    try {
        const parsed = JSON.parse(localStorage.getItem(DASHBOARD_COLUMNS_KEY) || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function setDashboardText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function getDatasetFormat(dataset) {
    if (dataset.source === "excel") return "Excel";
    if (dataset.source === "csv") return "CSV";

    const extension = String(dataset.fileName || "").split(".").pop().toLowerCase();
    return ["xlsx", "xls"].includes(extension) ? "Excel" : "CSV";
}

function formatDashboardDate(date) {
    if (!date) return "—";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function formatDashboardNumber(value) {
    return Number(value || 0).toLocaleString("pt-BR");
}

function escapeDashboardHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
