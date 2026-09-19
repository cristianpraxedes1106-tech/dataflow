document.addEventListener("DOMContentLoaded", initComparison);

function initComparison() {
    const datasets = getDatasets();
    const empty = document.getElementById("comparisonEmpty");
    const panel = document.getElementById("comparisonPanel");
    if (datasets.length < 2) { empty.classList.remove("d-none"); return; }
    panel.classList.remove("d-none");
    const a=document.getElementById("comparisonDatasetA"), b=document.getElementById("comparisonDatasetB");
    const options=datasets.map(d=>`<option value="${DataFlowAnalytics.escape(d.id)}">${DataFlowAnalytics.escape(d.name)}</option>`).join("");
    a.innerHTML=options; b.innerHTML=options; b.selectedIndex=1;
    const refresh=()=>{ populateMetric(a.value,"comparisonMetricA",datasets); populateMetric(b.value,"comparisonMetricB",datasets); renderComparison(datasets); };
    a.onchange=refresh; b.onchange=refresh;
    document.getElementById("comparisonMetricA").onchange=()=>renderComparison(datasets);
    document.getElementById("comparisonMetricB").onchange=()=>renderComparison(datasets);
    refresh();
}

function populateMetric(datasetId, selectId, datasets) {
    const select=document.getElementById(selectId), dataset=datasets.find(d=>String(d.id)===String(datasetId));
    const current=select.value;
    select.innerHTML=DataFlowAnalytics.numericColumns(dataset).map(c=>`<option value="${DataFlowAnalytics.escape(c.name)}">${DataFlowAnalytics.escape(c.name)}</option>`).join("");
    if([...select.options].some(o=>o.value===current)) select.value=current;
}

function renderComparison(datasets) {
    const a=datasets.find(d=>String(d.id)===document.getElementById("comparisonDatasetA").value);
    const b=datasets.find(d=>String(d.id)===document.getElementById("comparisonDatasetB").value);
    const metricA=document.getElementById("comparisonMetricA").value, metricB=document.getElementById("comparisonMetricB").value;
    const result=document.getElementById("comparisonResult");
    if(!a||!b||!metricA||!metricB){result.classList.add("d-none");return;}
    const sa=DataFlowAnalytics.summarize(a,metricA), sb=DataFlowAnalytics.summarize(b,metricB);
    const currencyA=DataFlowAnalytics.isCurrency(metricA), currencyB=DataFlowAnalytics.isCurrency(metricB);
    document.getElementById("comparisonNameA").textContent=a.name;
    document.getElementById("comparisonNameB").textContent=b.name;
    const metrics=[["Registros",sa.count,sb.count,false],["Total",sa.total,sb.total,currencyA||currencyB],["Média",sa.average,sb.average,currencyA||currencyB],["Mínimo",sa.min,sb.min,currencyA||currencyB],["Máximo",sa.max,sb.max,currencyA||currencyB]];
    document.getElementById("comparisonTableBody").innerHTML=metrics.map(([label,x,y,currency])=>`<tr><td><strong>${label}</strong></td><td>${DataFlowAnalytics.format(x,currency)}</td><td>${DataFlowAnalytics.format(y,currency)}</td><td class="${y-x>=0?'positive-diff':'negative-diff'}">${y-x>=0?'+':''}${DataFlowAnalytics.format(y-x,currency)}</td></tr>`).join("");
    document.getElementById("comparisonCards").innerHTML=[{name:a.name,metric:metricA,stats:sa,currency:currencyA},{name:b.name,metric:metricB,stats:sb,currency:currencyB}].map((item,index)=>`<article><span>CONJUNTO ${index?'B':'A'}</span><h2>${DataFlowAnalytics.escape(item.name)}</h2><p>${DataFlowAnalytics.escape(item.metric)}</p><strong>${DataFlowAnalytics.format(item.stats.total,item.currency)}</strong><small>Total da métrica</small></article>`).join("");
    result.classList.remove("d-none");
}
