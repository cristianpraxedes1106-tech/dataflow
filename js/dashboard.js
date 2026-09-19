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
    document.getElementById("dashboardAnalytics")?.classList.add("d-none");
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
        renderDashboardAnalytics(category, metric);
    } else {
        status.classList.remove("ready");
        status.innerHTML = '<i class="bi bi-circle"></i> Selecione as duas colunas';
        ready.classList.add("d-none");
        document.getElementById("dashboardAnalytics")?.classList.add("d-none");
    }
}

function renderDashboardAnalytics(category, metric) {
    const panel = document.getElementById("dashboardAnalytics");
    const rows = Array.isArray(activeDashboardDataset?.data) ? activeDashboardDataset.data : [];
    const values = rows.map(row => parseDashboardNumber(row?.[metric])).filter(Number.isFinite);

    if (!panel || !values.length) {
        panel?.classList.add("d-none");
        return;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    const stats = {
        count: values.length,
        total,
        average: total / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
    };
    const isCurrency = isCurrencyMetric(metric);

    setDashboardText("analyticsSubtitle", `${metric} analisado por ${category}.`);
    setDashboardText("kpiCount", formatDashboardNumber(stats.count));
    setDashboardText("kpiTotal", formatDashboardMetric(stats.total, isCurrency));
    setDashboardText("kpiAverage", formatDashboardMetric(stats.average, isCurrency));
    setDashboardText("kpiMin", formatDashboardMetric(stats.min, isCurrency));
    setDashboardText("kpiMax", formatDashboardMetric(stats.max, isCurrency));
    setDashboardText("chartTitle", `${metric} por ${category}`);

    const grouped = aggregateDashboardRows(rows, category, metric);
    const chartType = document.getElementById("chartTypeSelect");
    chartType.onchange = () => renderAnalyticsChart(grouped, chartType.value, isCurrency);
    renderAnalyticsChart(grouped, chartType.value, isCurrency);
    panel.classList.remove("d-none");
}

function parseDashboardNumber(value) {
    const normalized = String(value ?? "")
        .trim()
        .replace(/R\$\s?/gi, "")
        .replace(/\s/g, "")
        .replace(/\.(?=\d{3}(?:\D|$))/g, "")
        .replace(",", ".");
    const number = Number(normalized);
    return normalized !== "" && Number.isFinite(number) ? number : NaN;
}

function aggregateDashboardRows(rows, category, metric) {
    const groups = new Map();

    rows.forEach(row => {
        const label = String(row?.[category] ?? "").trim() || "Sem categoria";
        const value = parseDashboardNumber(row?.[metric]);
        if (Number.isFinite(value)) groups.set(label, (groups.get(label) || 0) + value);
    });

    return [...groups.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12);
}

function renderAnalyticsChart(data, type, isCurrency) {
    const chart = document.getElementById("analyticsChart");
    const footnote = document.getElementById("chartFootnote");
    if (!chart) return;

    if (!data.length) {
        chart.innerHTML = '<div class="chart-empty">Não há dados suficientes para o gráfico.</div>';
        return;
    }

    chart.className = `analytics-chart chart-${type}`;
    chart.innerHTML = type === "line"
        ? buildLineChart(data, isCurrency)
        : type === "pie"
            ? buildPieChart(data, isCurrency)
            : buildBarChart(data, isCurrency);

    if (footnote) {
        footnote.textContent = data.length === 12
            ? "Exibindo as 12 categorias com maiores valores."
            : `Exibindo ${data.length} categoria${data.length === 1 ? "" : "s"}.`;
    }
}

function buildBarChart(data, isCurrency) {
    const max = Math.max(...data.map(item => Math.abs(item.value)), 1);
    return `<div class="bar-chart">${data.map((item, index) => `
        <div class="bar-row">
            <span class="bar-label" title="${escapeDashboardHTML(item.label)}">${escapeDashboardHTML(item.label)}</span>
            <div class="bar-track"><span style="width:${Math.max(2, Math.abs(item.value) / max * 100)}%;--bar-index:${index}"></span></div>
            <strong>${formatDashboardMetric(item.value, isCurrency)}</strong>
        </div>`).join("")}</div>`;
}

function buildLineChart(data, isCurrency) {
    const width = 900, height = 300, padding = 34;
    const max = Math.max(...data.map(item => item.value), 1);
    const min = Math.min(...data.map(item => item.value), 0);
    const span = max - min || 1;
    const points = data.map((item, index) => {
        const x = padding + index * ((width - padding * 2) / Math.max(data.length - 1, 1));
        const y = height - padding - ((item.value - min) / span) * (height - padding * 2);
        return { ...item, x, y };
    });
    return `<div class="line-chart-wrap"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de linha">
        <line x1="${padding}" y1="${height-padding}" x2="${width-padding}" y2="${height-padding}" class="chart-axis"/>
        <polyline points="${points.map(p => `${p.x},${p.y}`).join(" ")}" class="chart-line"/>
        ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="6"><title>${escapeDashboardHTML(p.label)}: ${formatDashboardMetric(p.value,isCurrency)}</title></circle>`).join("")}
    </svg><div class="line-labels">${points.map(p => `<span title="${escapeDashboardHTML(p.label)}">${escapeDashboardHTML(p.label)}</span>`).join("")}</div></div>`;
}

function buildPieChart(data, isCurrency) {
    const positive = data.map(item => ({...item, value: Math.max(0, item.value)}));
    const total = positive.reduce((sum, item) => sum + item.value, 0) || 1;
    const colors = ["#635bff","#00b8a9","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#14b8a6","#f97316","#84cc16","#ec4899","#06b6d4","#64748b"];
    let cursor = 0;
    const stops = positive.map((item,index) => {
        const start = cursor; cursor += item.value / total * 360;
        return `${colors[index % colors.length]} ${start}deg ${cursor}deg`;
    });
    return `<div class="pie-layout"><div class="pie-visual" style="background:conic-gradient(${stops.join(",")})"><span>${formatDashboardNumber(data.length)}</span><small>categorias</small></div>
        <div class="pie-legend">${data.map((item,index)=>`<div><i style="background:${colors[index%colors.length]}"></i><span>${escapeDashboardHTML(item.label)}</span><strong>${formatDashboardMetric(item.value,isCurrency)}</strong></div>`).join("")}</div></div>`;
}

function isCurrencyMetric(metric) {
    return /valor|preço|preco|custo|receita|faturamento|total|frete/i.test(metric);
}

function formatDashboardMetric(value, currency) {
    return Number(value || 0).toLocaleString("pt-BR", currency
        ? { style: "currency", currency: "BRL", maximumFractionDigits: 2 }
        : { maximumFractionDigits: 2 });
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
