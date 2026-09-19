document.addEventListener("DOMContentLoaded", initReport);

function initReport() {
    const datasetId=localStorage.getItem("dataflow_dashboard_dataset_id");
    const dataset=getDataset(datasetId);
    const config=dataset ? DataFlowAnalytics.dashboardConfig(dataset.id) : {};
    const empty=document.getElementById("reportsEmpty"), report=document.getElementById("reportDocument"), print=document.getElementById("printReportButton");
    if(!dataset||!config.category||!config.metric){empty.classList.remove("d-none");return;}
    const stats=DataFlowAnalytics.summarize(dataset,config.metric), grouped=DataFlowAnalytics.aggregate(dataset,config.category,config.metric);
    const currency=DataFlowAnalytics.isCurrency(config.metric);
    document.getElementById("reportGeneratedAt").textContent=`Gerado em ${new Date().toLocaleString("pt-BR")}`;
    document.getElementById("reportDatasetName").textContent=dataset.name;
    document.getElementById("reportCategory").textContent=config.category;
    document.getElementById("reportMetric").textContent=config.metric;
    const items=[["Registros",stats.count],["Total",stats.total],["Média",stats.average],["Mínimo",stats.min],["Máximo",stats.max]];
    document.getElementById("reportKpis").innerHTML=items.map(([label,value],index)=>`<div><small>${label}</small><strong>${DataFlowAnalytics.format(value,index?currency:false)}</strong></div>`).join("");
    document.getElementById("reportTableBody").innerHTML=grouped.map(item=>`<tr><td>${DataFlowAnalytics.escape(item.label)}</td><td>${DataFlowAnalytics.format(item.value,currency)}</td><td>${stats.total ? (item.value/stats.total*100).toLocaleString('pt-BR',{maximumFractionDigits:1}) : 0}%</td></tr>`).join("");
    report.classList.remove("d-none"); print.classList.remove("d-none"); print.onclick=()=>window.print();
}
