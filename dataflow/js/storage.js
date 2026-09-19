const STORAGE_KEY = "dataflow_datasets";


function getDatasets() {

    const data =
        localStorage.getItem(STORAGE_KEY);


    if (!data) {

        return [];

    }


    try {

        return JSON.parse(data);

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

    const datasets =
        getDatasets();


    dataset.id =
        Date.now();


    dataset.createdAt =
        new Date().toISOString();


    datasets.push(dataset);


    saveDatasets(datasets);


    return dataset;

}


function deleteDataset(id) {

    const datasets =
        getDatasets()
        .filter(dataset => dataset.id !== id);


    saveDatasets(datasets);

}


function getDataset(id) {

    return getDatasets()
        .find(dataset => dataset.id == id);

}