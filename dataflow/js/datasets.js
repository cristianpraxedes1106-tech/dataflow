document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderDatasets();

        initDatasetCreation();

    }
);


/* =========================
   RENDER
========================= */

function renderDatasets() {

    const table =
        document.getElementById(
            "datasetTable"
        );


    if (!table) return;


    const datasets =
        getDatasets();


    if (datasets.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="6"
                    class="text-center py-5">

                    <i
                        class="bi bi-database"
                        style="font-size:35px;color:#9ca3af;">
                    </i>

                    <p class="mt-3 mb-1">
                        Nenhum conjunto de dados
                    </p>

                    <small class="text-muted">
                        Crie seu primeiro conjunto para começar.
                    </small>

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        datasets.map(dataset => `

            <tr>

                <td>

                    <strong>
                        ${dataset.name}
                    </strong>

                    <br>

                    <small class="text-muted">
                        ${dataset.description || ""}
                    </small>

                </td>

                <td>
                    ${dataset.rows || 0}
                </td>

                <td>
                    ${dataset.columns || 0}
                </td>

                <td>
                    ${formatDate(dataset.createdAt)}
                </td>

                <td>

                    <span class="status-badge">
                        Ativo
                    </span>

                </td>

                <td class="text-end">

                    <button
                        class="icon-button"
                        onclick="removeDataset(${dataset.id})">

                        <i class="bi bi-trash"></i>

                    </button>

                </td>

            </tr>

        `).join("");

}


/* =========================
   CRIAÇÃO
========================= */

function initDatasetCreation() {

    const button =
        document.getElementById(
            "createDataset"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            const name =
                document.getElementById(
                    "datasetName"
                ).value.trim();


            const description =
                document.getElementById(
                    "datasetDescription"
                ).value.trim();


            if (!name) {

                Swal.fire({

                    icon: "warning",

                    title: "Nome necessário",

                    text:
                        "Informe um nome para o conjunto de dados."

                });

                return;

            }


            const dataset = {

                name,

                description,

                rows: 0,

                columns: 0,

                data: []

            };


            addDataset(dataset);


            const modal =
                bootstrap.Modal.getInstance(
                    document.getElementById(
                        "datasetModal"
                    )
                );


            modal.hide();


            renderDatasets();


            Swal.fire({

                icon: "success",

                title: "Conjunto criado!",

                text:
                    "Seu conjunto de dados foi criado com sucesso.",

                timer: 1800,

                showConfirmButton: false

            });

        }
    );

}


/* =========================
   DELETE
========================= */

function removeDataset(id) {

    Swal.fire({

        title: "Excluir conjunto?",

        text:
            "Essa ação não poderá ser desfeita.",

        icon: "warning",

        showCancelButton: true,

        confirmButtonText:
            "Excluir",

        cancelButtonText:
            "Cancelar",

        confirmButtonColor:
            "#ef4444"

    }).then(result => {

        if (result.isConfirmed) {

            deleteDataset(id);

            renderDatasets();

        }

    });

}


/* =========================
   DATA
========================= */

function formatDate(date) {

    return new Date(date)
        .toLocaleDateString(
            "pt-BR"
        );

}