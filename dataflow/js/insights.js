function renderInsights() {

    const container =
        document.getElementById(
            "insightsContainer"
        );


    if (!container) return;


    const insights = [

        {

            icon: "bi-graph-up-arrow",

            title: "Crescimento positivo",

            text:
                "A receita apresentou crescimento de 16,3% em relação ao período anterior."

        },

        {

            icon: "bi-trophy-fill",

            title: "Melhor desempenho",

            text:
                "Dezembro apresentou o maior valor de receita registrado no período."

        },

        {

            icon: "bi-lightning-fill",

            title: "Tendência de alta",

            text:
                "Os últimos meses apresentam uma tendência consistente de crescimento."

        }

    ];


    container.innerHTML =
        insights.map(insight => `

            <div class="insight-item">

                <div class="insight-icon">

                    <i class="bi ${insight.icon}"></i>

                </div>

                <div>

                    <strong>
                        ${insight.title}
                    </strong>

                    <p>
                        ${insight.text}
                    </p>

                </div>

            </div>

        `).join("");

}