const STORAGE_KEY = "dataflow_datasets";

function getDatasets() {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
        return [];
    }

    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveDatasets(datasets) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(datasets)
    );
}

function addDataset(dataset) {
    const datasets = getDatasets();

    dataset.id = Date.now();
    dataset.createdAt = new Date().toISOString();
    dataset.updatedAt = dataset.updatedAt || dataset.createdAt;

    datasets.push(dataset);

    saveDatasets(datasets);

    return dataset;
}

function updateDataset(id, updates) {
    const datasets = getDatasets();
    const index = datasets.findIndex(dataset => dataset.id == id);

    if (index === -1) return null;

    datasets[index] = {
        ...datasets[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveDatasets(datasets);

    return datasets[index];
}

function deleteDataset(id) {
    const datasets = getDatasets()
        .filter(dataset => dataset.id != id);

    saveDatasets(datasets);
}

function getDataset(id) {
    return getDatasets()
        .find(dataset => dataset.id == id);
}
