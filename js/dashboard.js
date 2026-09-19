const DASHBOARD_DATASET_KEY = "dataflow_dashboard_dataset_id";

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

    summary.classList.remove("d-none");
}

function hideSelectedDataset() {
    document.getElementById("selectedDatasetSummary")?.classList.add("d-none");
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
