let revenueChartInstance = null;
let categoryChartInstance = null;
let comparisonChartInstance = null;
let comparisonResultChartInstance = null;


/* =========================
   RECEITA
========================= */

function createRevenueChart() {

    const canvas =
        document.getElementById("revenueChart");


    if (!canvas) return;


    revenueChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels: [
                    "Jan",
                    "Fev",
                    "Mar",
                    "Abr",
                    "Mai",
                    "Jun",
                    "Jul",
                    "Ago",
                    "Set",
                    "Out",
                    "Nov",
                    "Dez"
                ],

                datasets: [{

                    label: "Receita",

                    data: [
                        32000,
                        38000,
                        41000,
                        45000,
                        43000,
                        52000,
                        58000,
                        61000,
                        67000,
                        72000,
                        79000,
                        84200
                    ],

                    borderColor: "#635BFF",

                    backgroundColor:
                        "rgba(99,91,255,.08)",

                    fill: true,

                    tension: .4,

                    pointRadius: 3,

                    pointHoverRadius: 6

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        grid: {
                            color: "#eef0f4"
                        },

                        ticks: {

                            callback: value =>
                                "R$ " +
                                (value / 1000) +
                                "k"

                        }

                    },

                    x: {

                        grid: {
                            display: false
                        }

                    }

                }

            }

        });

}


/* =========================
   CATEGORIAS
========================= */

function createCategoryChart() {

    const canvas =
        document.getElementById("categoryChart");


    if (!canvas) return;


    categoryChartInstance =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: [
                    "Eletrônicos",
                    "Casa",
                    "Moda",
                    "Outros"
                ],

                datasets: [{

                    data: [
                        42,
                        25,
                        20,
                        13
                    ],

                    backgroundColor: [
                        "#635BFF",
                        "#22C55E",
                        "#F59E0B",
                        "#94A3B8"
                    ],

                    borderWidth: 0

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "72%",

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            usePointStyle: true,

                            padding: 15,

                            font: {
                                size: 10
                            }

                        }

                    }

                }

            }

        });

}


/* =========================
   COMPARAÇÃO
========================= */

function createComparisonChart() {

    const canvas =
        document.getElementById("comparisonChart");


    if (!canvas) return;


    comparisonChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: [
                    "Jan",
                    "Fev",
                    "Mar",
                    "Abr",
                    "Mai",
                    "Jun"
                ],

                datasets: [

                    {

                        label: "2025",

                        data: [
                            40,
                            45,
                            48,
                            51,
                            55,
                            60
                        ],

                        backgroundColor:
                            "#CBD5E1",

                        borderRadius: 6

                    },

                    {

                        label: "2026",

                        data: [
                            48,
                            53,
                            59,
                            65,
                            72,
                            81
                        ],

                        backgroundColor:
                            "#635BFF",

                        borderRadius: 6

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {
                            usePointStyle: true
                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        grid: {
                            color: "#eef0f4"
                        }

                    },

                    x: {

                        grid: {
                            display: false
                        }

                    }

                }

            }

        });

}


/* =========================
   COMPARAÇÃO DE RESULTADO
========================= */

function createComparisonResultChart(
    valueA,
    valueB
) {

    const canvas =
        document.getElementById(
            "comparisonResultChart"
        );


    if (!canvas) return;


    if (comparisonResultChartInstance) {

        comparisonResultChartInstance.destroy();

    }


    comparisonResultChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: [
                    "Dados A",
                    "Dados B"
                ],

                datasets: [{

                    data: [
                        valueA,
                        valueB
                    ],

                    backgroundColor: [
                        "#CBD5E1",
                        "#635BFF"
                    ],

                    borderRadius: 10

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {
                        beginAtZero: true
                    },

                    x: {
                        grid: {
                            display: false
                        }
                    }

                }

            }

        });

}