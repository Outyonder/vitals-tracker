
const $ = s=>document.querySelector(s); const $$ = s=>Array.from(document.querySelectorAll(s));
const STORAGE_KEY = "vitals_log_v1";
const uid = ()=> (Date.now().toString(36)+Math.random().toString(36).slice(2,8)).toUpperCase();
function loadData(){ try{const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):[]}catch(e){return[]} }
function saveData(rows){ localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); }
const toNum = v => {const n=Number(v); return isNaN(n)?null:n;};
function getFormValues(){ return {
  Entry_ID: uid(),
  Timestamp: $("#ts").value || new Date().toISOString(),
  Systolic_BP_mmHg: toNum($("#sys").value),
  Diastolic_BP_mmHg: toNum($("#dia").value),
  Heart_Rate_bpm: toNum($("#hr").value),
  Blood_Sugar_mg_dL: toNum($("#sugar").value),
  SpO2_percent: toNum($("#spo2").value),
  Temperature_F: toNum($("#temp").value),
  Weight_lb: toNum($("#wt").value),
  Dialysis_Day: $("#dialysis").checked,
  Before_or_After_Dialysis: $("#dialysisBAD").value || "",
  Body_Position: $("#position").value || "",
  Cuff_Arm: $("#arm").value || "",
  Medications_Taken: $("#meds").value || "",
  Symptoms_Notes: $("#sym").value || "",
  Meal_Time: $("#meal").value || "",
  Food_Notes: $("#food").value || "",
  Portion_Size: $("#portion").value || "",
  Post_Meal_Time: $("#postmeal").value || "",
  Symptoms_After_Eating: $("#symFood").value || ""
};}
function clearForm(){ $$("input[type='number'], textarea").forEach(el=>el.value=""); $("#dialysis").checked=false; $$("select").forEach(el=>el.value=""); $("#ts").value=new Date().toISOString().slice(0,16); }
function val(v){ return v==null||v===""? "": v; }
function renderTable(){
  const rows=loadData().sort((a,b)=>new Date(b.Timestamp)-new Date(a.Timestamp));
  $("#rows").innerHTML = rows.map(r=>`
    <tr>
      <td>${new Date(r.Timestamp).toLocaleString()}</td>
      <td>${val(r.Systolic_BP_mmHg)}</td>
      <td>${val(r.Diastolic_BP_mmHg)}</td>
      <td>${val(r.Heart_Rate_bpm)}</td>
      <td>${val(r.Blood_Sugar_mg_dL)}</td>
      <td>${val(r.SpO2_percent)}</td>
      <td>${val(r.Temperature_F)}</td>
      <td>${val(r.Weight_lb)}</td>
      <td>${r.Dialysis_Day?"Yes":"No"}</td>
      <td><button class="btn warn" data-del="${r.Entry_ID}">Delete</button></td>
    </tr>`).join("");
}
function exportCSV(){
  const rows=loadData(); if(!rows.length){alert("No data to export."); return;}
  const headers=Object.keys(rows[0]); const lines=[headers.join(",")];
  for(const r of rows){ const line=headers.map(h=>{const v=r[h]; if(v==null) return ""; const s=String(v).replace(/"/g,'""'); return /[",\n]/.test(s)?`"${s}"`:s;}).join(","); lines.push(line); }
  const blob=new Blob([lines.join("\n")],{type:"text/csv"}); const a=document.createElement("a");
  const dt=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-"); a.href=URL.createObjectURL(blob); a.download=`vitals_export_${dt}.csv`; document.body.appendChild(a); a.click(); a.remove();
}
function parseCSVLine(line){ const out=[]; let cur="",inQ=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(inQ){ if(c=='"'&&line[i+1]=='"'){cur+='"';i++;} else if(c=='"'){ inQ=false; } else cur+=c; } else { if(c==','){ out.push(cur); cur=""; } else if(c=='"'){ inQ=true; } else cur+=c; } } out.push(cur); return out; }
function importCSV(file){
  const reader=new FileReader();
  reader.onload=e=>{
    const txt=e.target.result; const lines=txt.split(/\\r?\\n/).filter(Boolean); if(!lines.length) return;
    const headers=lines[0].split(","); const rows=lines.slice(1).map(line=>{ const cols=parseCSVLine(line); const obj={}; headers.forEach((h,i)=>obj[h]=cols[i]); 
      ["Systolic_BP_mmHg","Diastolic_BP_mmHg","Heart_Rate_bpm","Blood_Sugar_mg_dL","SpO2_percent","Temperature_F","Weight_lb"].forEach(k=>obj[k]=toNum(obj[k]));
      obj.Dialysis_Day = (obj.Dialysis_Day==="TRUE"||obj.Dialysis_Day==="true"||obj.Dialysis_Day==="Yes");
      return obj; });
    const current=loadData(); saveData([...current, ...rows]); renderTable(); renderCharts();
  }; reader.readAsText(file);
}
let _charts={};
function makeLineChart(id, labels, series, yScale={}){
  const ctx=document.getElementById(id).getContext("2d");
  if(_charts[id]) _charts[id].destroy();
  _charts[id]=new Chart(ctx, { type:"line", data:{ labels, datasets: series.map(s=>({label:s.label,data:s.data,tension:.25,fill:false})) },
    options:{ responsive:true, plugins:{legend:{labels:{color:"#c8d4f5"}}},
      scales:{ x:{ticks:{color:"#a6b0c3"},grid:{color:"rgba(255,255,255,.06)"}}, y:{ticks:{color:"#a6b0c3"},grid:{color:"rgba(255,255,255,.06)"}, ...yScale} } }
  });
}
function renderCharts(){
  const rows=loadData().sort((a,b)=>new Date(a.Timestamp)-new Date(b.Timestamp));
  const labels=rows.map(r=>new Date(r.Timestamp).toLocaleString());
  const systolic=rows.map(r=>r.Systolic_BP_mmHg), diastolic=rows.map(r=>r.Diastolic_BP_mmHg);
  const sugar=rows.map(r=>r.Blood_Sugar_mg_dL), spo2=rows.map(r=>r.SpO2_percent), weight=rows.map(r=>r.Weight_lb);
  makeLineChart("bpChart", labels, [{label:"Systolic",data:systolic},{label:"Diastolic",data:diastolic}]);
  makeLineChart("sugarChart", labels, [{label:"Blood Sugar",data:sugar}]);
  makeLineChart("spo2Chart", labels, [{label:"SpO2 %",data:spo2}], {suggestedMin:70,suggestedMax:100});
  makeLineChart("weightChart", labels, [{label:"Weight (lb)",data:weight}]);
}
document.addEventListener("DOMContentLoaded", ()=>{
  $("#ts").value=new Date().toISOString().slice(0,16);
  $("#dialysis").addEventListener("change", e=> $("#dialysisDetails").style.display = e.target.checked ? "block":"none");
  $("#save").addEventListener("click", ()=>{ const row=getFormValues(); const rows=loadData(); rows.push(row); saveData(rows); clearForm(); renderTable(); renderCharts(); });
  $("#export").addEventListener("click", exportCSV);
  $("#import").addEventListener("change", e=>{ const f=e.target.files[0]; if(f) importCSV(f); e.target.value=""; });
  $("#rows").addEventListener("click", e=>{ const id=e.target.getAttribute("data-del"); if(id){ const rows=loadData().filter(r=>r.Entry_ID!==id); saveData(rows); renderTable(); renderCharts(); } });
  renderTable(); renderCharts();
});
