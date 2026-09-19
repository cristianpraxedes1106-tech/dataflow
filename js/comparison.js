document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDatasetOptions();

        initComparison();

    }
);


/* =========================
   SELECTS
========================= */

function loadDatasetOptions() {

    const selectA =
        document.getElementById(
            "datasetA"
        );

    const selectB =
        document.getElementById(
            "datasetB"
        );


    if (!selectA || !selectB) return;


    const datasets =
        getDatasets();


    datasets.forEach(dataset => {

        const optionA =
            new Option(
                dataset.name,
                dataset.id
            );


        const optionB =
            new Option(
                dataset.name,
                dataset.id
            );


        selectA.appendChild(optionA);

        selectB.appendChild(optionB);

    });

}


/* =========================
   COMPARAR
========================= */

function initComparison() {

    const button =
        document.getElementById(
            "compareButton"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            const idA =
                document.getElementById(
                    "datasetA"
                ).value;


            const idB =
                document.getElementById(
                    "datasetB"
                ).value;


            if (!idA || !idB) {

                Swal.fire({

                    icon: "warning",

                    title: "Selecione os dados",

                    text:
                        "Escolha os dois conjuntos que deseja comparar."

                });

                return;

            }


            if (idA === idB) {

                Swal.fire({

                    icon: "warning",

                    title: "Conjuntos iguais",

                    text:
                        "Escolha dois conjuntos diferentes."

                });

                return;

            }


            const datasetA =
                getDataset(idA);


            const datasetB =
                getDataset(idB);


            const valueA =
                datasetA.rows || 0;


            const valueB =
                datasetB.rows || 0;


            const difference =
                valueA === 0
                    ? 0
                    : ((valueB - valueA) / valueA) * 100;


            document.getElementById(
                "comparisonValueA"
            ).textContent =
                valueA;


            document.getElementById(
                "comparisonValueB"
            ).textContent =
                valueB;


            document.getElementById(
                "comparisonDifference"
            ).textContent =
                `${difference >= 0 ? "+" : ""}${difference.toFixed(1)}%`;


            document.getElementById(
                "comparisonResult"
            ).style.display =
                "block";


            createComparisonResultChart(
                valueA,
                valueB
            );

        }
    );

}