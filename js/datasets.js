let pendingCSV = null;

document.addEventListener("DOMContentLoaded", () => {
    renderDatasets();
    initDatasetCreation();
});


/* =========================
   RENDER
========================= */

function renderDatasets() {
    const table = document.getElementById("datasetTable");

    if (!table) return;

    const datasets = getDatasets();

    if (datasets.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <i class="bi bi-database" style="font-size:35px;color:#9ca3af;"></i>

                    <p class="mt-3 mb-1">
                        Nenhum conjunto de dados
                    </p>

                    <small class="text-muted">
                        Importe um CSV para começar a análise.
                    </small>
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = datasets.map(dataset => `
        <tr>
            <td>
                <strong>${escapeHTML(dataset.name)}</strong>
                <br>
                <small class="text-muted">
                    ${escapeHTML(dataset.description || dataset.fileName || "")}
                </small>
            </td>

            <td>${dataset.rows || 0}</td>

            <td>${dataset.columns || 0}</td>

            <td>${formatDate(dataset.updatedAt || dataset.createdAt)}</td>

            <td>
                <span class="status-badge">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    Analisado
                </span>
            </td>

            <td class="text-end">
                <button
                    class="icon-button"
                    title="Excluir conjunto"
                    onclick="removeDataset(${dataset.id})"
                >
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}


/* =========================
   IMPORTAÇÃO
========================= */

function initDatasetCreation() {
    const fileInput = document.getElementById("csvFile");
    const createButton = document.getElementById("createDataset");
    const manualButton = document.getElementById("manualDataButton");
    const modal = document.getElementById("datasetModal");

    if (!fileInput || !createButton) return;

    fileInput.addEventListener("change", event => {
        const file = event.target.files?.[0];

        if (!file) return;

        analyzeCSV(file);
    });

    createButton.addEventListener("click", saveImportedDataset);

    if (manualButton) {
        manualButton.addEventListener("click", () => {
            Swal.fire({
                icon: "info",
                title: "Modo manual",
                text: "A importação CSV já está disponível. O editor manual será conectado ao mesmo analisador na próxima etapa."
            });
        });
    }

    modal?.addEventListener("hidden.bs.modal", resetDatasetModal);
}


function analyzeCSV(file) {
    const status = document.getElementById("importStatus");
    const createButton = document.getElementById("createDataset");

    if (!file.name.toLowerCase().endsWith(".csv")) {
        showImportError("Selecione um arquivo CSV válido.");
        return;
    }

    status.textContent = "Lendo e analisando o arquivo...";
    createButton.disabled = true;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: "greedy",
        dynamicTyping: false,
        encoding: "UTF-8",
        delimiter: "",
        complete: results => {
            if (results.errors?.length) {
                const fatalErrors = results.errors.filter(error =>
                    ["TooManyFields", "TooFewFields", "Quotes"].includes(error.type)
                );

                if (fatalErrors.length) {
                    showImportError("O CSV possui linhas com estrutura inconsistente. Verifique separadores e aspas.");
                    return;
                }
            }

            const normalized = normalizeParsedCSV(results);

            if (!normalized.rows.length) {
                showImportError("O arquivo não possui registros válidos para análise.");
                return;
            }

            pendingCSV = {
                fileName: file.name,
                fileSize: file.size,
                ...normalized
            };

            renderCSVAnalysis(pendingCSV);

            status.innerHTML = `
                <i class="bi bi-check-circle-fill text-success me-1"></i>
                Arquivo analisado com sucesso.
            `;

            createButton.disabled = false;

            const nameInput = document.getElementById("datasetName");

            if (!nameInput.value.trim()) {
                nameInput.value = file.name.replace(/\.csv$/i, "");
            }
        },
        error: error => {
            showImportError("Não foi possível ler o arquivo: " + error.message);
        }
    });
}


/* =========================
   NORMALIZAÇÃO / ANÁLISE
========================= */

function normalizeParsedCSV(results) {
    const rawRows = Array.isArray(results.data) ? results.data : [];

    const headers = (results.meta?.fields || Object.keys(rawRows[0] || {}))
        .map((header, index) => {
            const clean = String(header ?? "").replace(/^\uFEFF/, "").trim();
            return clean || `Coluna ${index + 1}`;
        });

    const rows = rawRows
        .map(row => {
            const normalizedRow = {};

            headers.forEach((header, index) => {
                const originalKey = results.meta?.fields?.[index] ?? header;
                normalizedRow[header] = cleanCellValue(row[originalKey]);
            });

            return normalizedRow;
        })
        .filter(row =>
            headers.some(header => String(row[header] ?? "").trim() !== "")
        );

    const columns = headers.map(header => analyzeColumn(header, rows));

    return {
        headers,
        rows,
        columns,
        delimiter: detectDelimiter(results.meta?.delimiter),
        analysis: {
            totalRows: rows.length,
            totalColumns: headers.length,
            numericColumns: columns.filter(column => column.type === "number").length,
            dateColumns: columns.filter(column => column.type === "date").length,
            textColumns: columns.filter(column => column.type === "text").length,
            missingCells: columns.reduce((total, column) => total + column.missing, 0),
            duplicateRows: countDuplicateRows(rows, headers)
        }
    };
}


function analyzeColumn(header, rows) {
    const values = rows.map(row => row[header]);
    const nonEmpty = values.filter(value => String(value).trim() !== "");

    const numericCount = nonEmpty.filter(isNumericValue).length;
    const dateCount = nonEmpty.filter(isDateValue).length;

    let type = "text";

    if (nonEmpty.length && numericCount === nonEmpty.length) {
        type = "number";
    } else if (nonEmpty.length && dateCount === nonEmpty.length) {
        type = "date";
    }

    const unique = new Set(
        nonEmpty.map(value => String(value).trim().toLowerCase())
    ).size;

    return {
        name: header,
        type,
        filled: nonEmpty.length,
        missing: values.length - nonEmpty.length,
        unique
    };
}


function isNumericValue(value) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return false;
    }

    const normalized = String(value)
        .trim()
        .replace(/R\$\s?/gi, "")
        .replace(/\s/g, "")
        .replace(/\.(?=\d{3}(?:\D|$))/g, "")
        .replace(",", ".");

    return Number.isFinite(Number(normalized));
}


function isDateValue(value) {
    if (!value || isNumericValue(value)) return false;

    const text = String(value).trim();

    if (!/[-/]/.test(text)) return false;

    const parsed = Date.parse(text);

    return !Number.isNaN(parsed);
}


function cleanCellValue(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/^\uFEFF/, "")
        .trim();
}


function detectDelimiter(delimiter) {
    if (delimiter === "\t") return "Tabulação";
    if (delimiter === ";") return "Ponto e vírgula";
    if (delimiter === ",") return "Vírgula";

    return delimiter || "Automático";
}


function countDuplicateRows(rows, headers) {
    const seen = new Set();
    let duplicates = 0;

    rows.forEach(row => {
        const signature = headers
            .map(header => row[header])
            .join("\u001F");

        if (seen.has(signature)) {
            duplicates++;
        } else {
            seen.add(signature);
        }
    });

    return duplicates;
}


/* =========================
   INTERFACE DA ANÁLISE
========================= */

function renderCSVAnalysis(dataset) {
    const empty = document.getElementById("csvAnalysisEmpty");
    const analysis = document.getElementById("csvAnalysis");
    const fileInfo = document.getElementById("csvFileInfo");

    empty?.classList.add("d-none");
    analysis?.classList.remove("d-none");

    if (fileInfo) {
        fileInfo.classList.remove("d-none");

        fileInfo.innerHTML = `
            <div class="dataset-file-card">
                <div class="dataset-file-icon">
                    <i class="bi bi-filetype-csv"></i>
                </div>

                <div class="flex-grow-1">
                    <strong>${escapeHTML(dataset.fileName)}</strong>
                    <small>
                        ${formatBytes(dataset.fileSize)} · ${dataset.delimiter}
                    </small>
                </div>

                <span class="badge rounded-pill text-bg-success">
                    CSV válido
                </span>
            </div>
        `;
    }

    const cards = document.getElementById("analysisCards");

    if (cards) {
        cards.innerHTML = [
            ["bi-list-ol", "Registros", dataset.analysis.totalRows],
            ["bi-layout-three-columns", "Colunas", dataset.analysis.totalColumns],
            ["bi-123", "Numéricas", dataset.analysis.numericColumns],
            ["bi-exclamation-circle", "Células vazias", dataset.analysis.missingCells]
        ].map(([icon, label, value]) => `
            <div class="col-6 col-xl-3">
                <div class="analysis-mini-card">
                    <i class="bi ${icon}"></i>
                    <small>${label}</small>
                    <strong>${formatNumber(value)}</strong>
                </div>
            </div>
        `).join("");
    }

    const columnTable = document.getElementById("columnAnalysisTable");

    if (columnTable) {
        columnTable.innerHTML = dataset.columns.map(column => `
            <tr>
                <td><strong>${escapeHTML(column.name)}</strong></td>
                <td>${getTypeBadge(column.type)}</td>
                <td>${formatNumber(column.filled)}</td>
                <td>${formatNumber(column.unique)}</td>
            </tr>
        `).join("");
    }

    renderPreview(dataset);
}


function renderPreview(dataset) {
    const head = document.getElementById("previewHead");
    const body = document.getElementById("previewBody");

    if (!head || !body) return;

    const previewHeaders = dataset.headers.slice(0, 8);
    const previewRows = dataset.rows.slice(0, 5);

    head.innerHTML = `
        <tr>
            ${previewHeaders.map(header => `<th>${escapeHTML(header)}</th>`).join("")}
        </tr>
    `;

    body.innerHTML = previewRows.map(row => `
        <tr>
            ${previewHeaders.map(header => `
                <td title="${escapeHTML(row[header])}">
                    ${escapeHTML(truncate(row[header], 45))}
                </td>
            `).join("")}
        </tr>
    `).join("");
}


/* =========================
   SALVAR DATASET
========================= */

function saveImportedDataset() {
    if (!pendingCSV) {
        showImportError("Importe e analise um CSV antes de continuar.");
        return;
    }

    const name = document.getElementById("datasetName").value.trim();
    const description = document.getElementById("datasetDescription").value.trim();

    if (!name) {
        Swal.fire({
            icon: "warning",
            title: "Nome necessário",
            text: "Informe um nome para o conjunto de dados."
        });
        return;
    }

    const dataset = addDataset({
        name,
        description,
        source: "csv",
        fileName: pendingCSV.fileName,
        delimiter: pendingCSV.delimiter,
        rows: pendingCSV.analysis.totalRows,
        columns: pendingCSV.analysis.totalColumns,
        headers: pendingCSV.headers,
        data: pendingCSV.rows,
        columnAnalysis: pendingCSV.columns,
        analysis: pendingCSV.analysis
    });

    const modalElement = document.getElementById("datasetModal");
    const modal = bootstrap.Modal.getInstance(modalElement);

    modal?.hide();

    renderDatasets();

    Swal.fire({
        icon: "success",
        title: "CSV importado!",
        html: `
            <strong>${formatNumber(dataset.rows)}</strong> registros e
            <strong>${formatNumber(dataset.columns)}</strong> colunas foram analisados.
        `,
        timer: 2200,
        showConfirmButton: false
    });
}


/* =========================
   DELETE
========================= */

function removeDataset(id) {
    Swal.fire({
        title: "Excluir conjunto?",
        text: "Os dados salvos localmente também serão removidos.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Excluir",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#ef4444"
    }).then(result => {
        if (result.isConfirmed) {
            deleteDataset(id);
            renderDatasets();
        }
    });
}


/* =========================
   RESET / UTILITÁRIOS
========================= */

function resetDatasetModal() {
    pendingCSV = null;

    const name = document.getElementById("datasetName");
    const description = document.getElementById("datasetDescription");
    const file = document.getElementById("csvFile");
    const createButton = document.getElementById("createDataset");
    const status = document.getElementById("importStatus");
    const analysis = document.getElementById("csvAnalysis");
    const empty = document.getElementById("csvAnalysisEmpty");
    const fileInfo = document.getElementById("csvFileInfo");

    if (name) name.value = "";
    if (description) description.value = "";
    if (file) file.value = "";
    if (createButton) createButton.disabled = true;
    if (status) status.textContent = "";

    analysis?.classList.add("d-none");
    empty?.classList.remove("d-none");

    if (fileInfo) {
        fileInfo.classList.add("d-none");
        fileInfo.innerHTML = "";
    }
}


function showImportError(message) {
    pendingCSV = null;

    const createButton = document.getElementById("createDataset");
    const status = document.getElementById("importStatus");

    if (createButton) createButton.disabled = true;

    if (status) {
        status.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill text-danger me-1"></i>
            ${escapeHTML(message)}
        `;
    }

    Swal.fire({
        icon: "error",
        title: "Não foi possível analisar",
        text: message
    });
}


function getTypeBadge(type) {
    const labels = {
        number: "Número",
        date: "Data",
        text: "Texto"
    };

    const icons = {
        number: "123",
        date: "calendar3",
        text: "type"
    };

    return `
        <span class="column-type-badge type-${type}">
            <i class="bi bi-${icons[type]}"></i>
            ${labels[type]}
        </span>
    `;
}


function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


function formatNumber(value) {
    return Number(value || 0).toLocaleString("pt-BR");
}


function formatBytes(bytes) {
    if (!bytes) return "0 KB";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    return (bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0) + " " + units[index];
}


function truncate(value, maxLength) {
    const text = String(value ?? "");

    return text.length > maxLength
        ? text.slice(0, maxLength - 1) + "…"
        : text;
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
