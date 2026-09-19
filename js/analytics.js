window.DataFlowAnalytics = (() => {
    function parseNumber(value) {
        const normalized = String(value ?? "").trim()
            .replace(/R\$\s?/gi, "").replace(/\s/g, "")
            .replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
        const number = Number(normalized);
        return normalized !== "" && Number.isFinite(number) ? number : NaN;
    }

    function columns(dataset) {
        if (Array.isArray(dataset?.columnAnalysis) && dataset.columnAnalysis.length) {
            return dataset.columnAnalysis.map(column => ({ name: String(column.name), type: column.type || "text" }));
        }
        const headers = Array.isArray(dataset?.headers) ? dataset.headers : [];
        const rows = Array.isArray(dataset?.data) ? dataset.data : [];
        return headers.map(name => {
            const values = rows.map(row => row?.[name]).filter(value => String(value ?? "").trim() !== "");
            return { name: String(name), type: values.length && values.every(value => Number.isFinite(parseNumber(value))) ? "number" : "text" };
        });
    }

    function numericColumns(dataset) { return columns(dataset).filter(column => column.type === "number"); }

    function summarize(dataset, metric) {
        const values = (Array.isArray(dataset?.data) ? dataset.data : [])
            .map(row => parseNumber(row?.[metric])).filter(Number.isFinite);
        const total = values.reduce((sum, value) => sum + value, 0);
        return { count: values.length, total, average: values.length ? total / values.length : 0, min: values.length ? Math.min(...values) : 0, max: values.length ? Math.max(...values) : 0 };
    }

    function aggregate(dataset, category, metric) {
        const grouped = new Map();
        (Array.isArray(dataset?.data) ? dataset.data : []).forEach(row => {
            const label = String(row?.[category] ?? "").trim() || "Sem categoria";
            const value = parseNumber(row?.[metric]);
            if (Number.isFinite(value)) grouped.set(label, (grouped.get(label) || 0) + value);
        });
        return [...grouped.entries()].map(([label,value]) => ({label,value})).sort((a,b) => b.value-a.value);
    }

    function isCurrency(metric) { return /valor|preço|preco|custo|receita|faturamento|total|frete/i.test(metric || ""); }
    function format(value, currency = false) { return Number(value || 0).toLocaleString("pt-BR", currency ? {style:"currency",currency:"BRL",maximumFractionDigits:2} : {maximumFractionDigits:2}); }
    function escape(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
    function dashboardConfig(datasetId) {
        try { return JSON.parse(localStorage.getItem("dataflow_dashboard_column_config") || "{}")[String(datasetId)] || {}; }
        catch { return {}; }
    }

    return { parseNumber, columns, numericColumns, summarize, aggregate, isCurrency, format, escape, dashboardConfig };
})();
