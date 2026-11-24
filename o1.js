"use strict";
(function () {
  const Core = window.Core;
  const { esc, shuffle, dayNum } = Core.util;
  const cases = window.O1_DAILY_CASES || {};
  const demo = window.O1_DEMO || [];
  const media = window.O1_MEDIA || {};
  const view = document.querySelector("#daily-view");
  const status = document.querySelector("#daily-storage");
  const key = "palestre.orator1.daily.v1";
  const packKey = "palestre.pack";
  const titles = ["Les deux sens de bien parler", "Le vraisemblable", "Les sophistes", "Le Gorgias de Platon", "Cicéron", "Le Principat"];
  const guides = [
    "Distingue l’effet sur ceux qui écoutent de la valeur du conseil.",
    "Cherche ce qui rendrait une conduite probable, puis imagine l’interprétation adverse.",
    "Demande-toi si les faits changent, ou si seul le rapport à une situation change.",
    "Repère le passage d’une connaissance à un comportement.",
    "Distingue la manière de parler, la conduite et le crédit auprès de l’auditoire.",
    "Demande-toi ce que le texte établit et ce qu’il invite à croire."
  ];
  const courseIndex = course => Number(course.slice(1)) - 1;
  const sameCourse = q => q && typeof q.q === "string" && typeof q.id === "string" &&
    /^c[1-6]$/.test(q.cours) && cases[q.cours]?.length && Array.isArray(q.choix) && q.choix.length>1 &&
    [q.a].flat().length && [q.a].flat().every(a=>Number.isInteger(a) && a>=0 && a<q.choix.length);
  const read = keyName => {
    try { return JSON.parse(localStorage.getItem(keyName)); }
    catch { return null; }
  };
  const saved = read(key);
  const data = saved && saved.v === 1 ? saved : { v:1 };
  let localPack = read(packKey);
  let ready = false;
  let packMode = false;
  let questions = [];
  let state;
  let note = "";

  function signature(items) {
    const raw = JSON.stringify(items.map(q => [q.id,q.cours,q.q,q.choix,q.a,q.why]));
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) hash = Math.imul(hash ^ raw.charCodeAt(i),16777619);
    return hash >>> 0;
  }
  function init() {
    const bank = Array.isArray(localPack?.qcm) ? localPack.qcm.filter(sameCourse) : [];
    packMode = bank.length > 0;
    questions = packMode ? Core.pack.normalize({qcm:bank}).qcm : demo.filter(sameCourse);
    const mode = packMode ? "pack" : "demo";
    const sig = signature(packMode ? bank : questions);
    const previous = data[mode];
    state = previous?.signature === sig ? previous : { signature:sig, review:{}, cases:{}, session:null, sessions:0 };
    data[mode] = state;
  }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch { status.textContent = "Ce navigateur ne permet pas de sauvegarder. Garde la page ouverte pour conserver cette séance."; }
  }
  const history = q => state.review["q:"+q.id] || null;

  function plan(bank, now) {
    const ordered = shuffle(bank);
    const pastDue = ordered.filter(q => history(q)?.due <= now)
      .sort((a,b) => history(a).due - history(b).due);
    const failures = pastDue.filter(q => history(q).streak === 0);
    const seen = new Set();
    const picked = [];
    function add(question) {
      if (!question || seen.has(question.id) || picked.length >= 3) return;
      picked.push(question);
      seen.add(question.id);
    }
    for (const problem of failures) {
      const variation = ordered.find(q => q.cours === problem.cours && !history(q) && !seen.has(q.id));
      add(variation);
      add(problem);
      if (picked.length >= 3) break;
    }
    const latest = pastDue.filter(q => history(q).streak > 0);
    latest.forEach(add);
    ordered.filter(q => !history(q)).forEach(add);
    return picked;
  }
  const recordFor = q => {
    const id = "q:"+q.id;
    const before = state.review[id] || {streak:0};
    const full = Core.score.qcmRight(q,state.session.choices) && !state.session.usedHelp;
    const streak = full ? before.streak+1 : 0;
    const interval = [1,2,5,9,14][Math.min(streak,4)];
    state.review[id] = {due:dayNum()+interval,streak,tries:(before.tries||0)+1};
    return full;
  };
  const action = (name,label,variant="primary") => '<button type="button" class="btn '+variant+'" data-act="'+name+'">'+label+'</button>';
  const wrap = (label,heading,body) => '<section class="card"><p class="eyebrow">'+esc(label)+'</p><h1>'+esc(heading)+'</h1>'+body+'</section>';
  const para = text => "<p>"+esc(text)+"</p>";
  const detail = (label,text) => "<details><summary>"+esc(label)+"</summary>"+para(text)+"</details>";
  function clip(course) {
    const title = titles[courseIndex(course)];
    return '<details><summary>Revoir un exemple de ce cours</summary><video controls playsinline preload="none" data-course="'+esc(course)+'" src="videos/o1-'+esc(course)+'.mp4" aria-label="'+esc(title)+'"></video>'+
      (media[course] ? '<details><summary>Lire la transcription</summary>'+media[course].voice.map(para).join("")+'</details>' : "")+'</details>';
  }
  function mountCaptions() {
    if (typeof VTTCue !== "function") return;
    for (const video of view.querySelectorAll("video[data-course]")) {
      const cues = media[video.dataset.course]?.captions;
      if (!cues?.length || typeof video.addTextTrack !== "function") continue;
      const track = video.addTextTrack("captions","Français","fr");
      for (const [start,end,text] of cues) track.addCue(new VTTCue(start,end,text));
    }
  }
  function gradeWord(result) {
    return ({solo:"Réussi seul", helped:"Juste avec aide", retry:"À retravailler"})[result];
  }
  function selectCase(session) {
    const weak = session.results.find(r => r.grade === "retry") || session.results.find(r => r.grade === "helped") || session.results[0];
    if (!weak) return null;
    const list = cases[weak.course];
    const previous = state.cases[weak.course] || 0;
    return { course:weak.course,index:previous % list.length };
  }
  function render() {
    const s = state.session;
    const badge = packMode ? "Pack privé · "+questions.length+" questions" : "Démo · exemples originaux";
    if (!s || s.phase === "done" || !ready) {
      const active = s && s.phase !== "done";
      const due = plan(questions, dayNum()).length;
      const start = active ? action("resume","Reprendre ma séance") :
        due && s?.day !== dayNum() ? action("start","Commencer la séance") : "";
      const summary = s?.phase === "done" ? '<p><strong>Dernière séance.</strong> '+s.results.filter(r=>r.grade==="solo").length+
        ' réponse(s) réussie(s) sans aide sur '+s.results.length+'. Cas écrit : '+esc(s.caseStatus)+'.</p>' : "";
      view.innerHTML = wrap(badge, "Ta séance Orator 1", para("Environ 8 minutes. Réponds de mémoire, vérifie ton raisonnement, puis applique une notion à un autre cas.") +
        '<div class="actions">'+start+'</div>'+summary+
        (!start ? para("La séance du jour est terminée ou tes rappels ne sont pas encore prêts.") : "")+
        (!packMode ? '<details><summary>Utiliser mon pack de cours</summary><p>Choisis ton fichier pack.json. Le pack est lu sur cet appareil.</p>'+
          '<label for="daily-import">Fichier de cours</label><input class="daily-import" id="daily-import" type="file" accept="application/json,.json"></details>' : "")+
        (note ? para(note) : ""));
      return;
    }
    if (s.phase === "question" || s.phase === "feedback") {
      const q = s.items[s.index];
      const multi = Array.isArray(q.a);
      const result = s.results[s.index];
      const correct = multi ? q.a : [q.a];
      const options = q.choix.map((label,index) => {
        const selected = multi ? (s.choices||[]).includes(index) : s.choices===index;
        const cl = result ? correct.includes(index) ? " ok" : selected ? " ko" : " dim" : selected ? " sel" : "";
        return '<label class="choice'+cl+'"><input type="'+(multi?"checkbox":"radio")+'" name="choice" value="'+index+'"'+(selected?" checked":"")+(result?" disabled":"")+'><span>'+esc(label)+'</span></label>';
      }).join("");
      const help = s.usedHelp ? '<div class="hint">'+para(guides[courseIndex(q.cours)])+clip(q.cours)+'</div>' : action("help","Un repère","ghost");
      const selection = multi ? s.choices?.length : s.choices !== null;
      const next = s.index+1 === s.items.length ? "Passer au cas écrit" : "Question suivante";
      view.innerHTML = wrap("Question "+(s.index+1)+" sur "+s.items.length+" · "+titles[courseIndex(q.cours)],q.q,
        (multi ? para("Plusieurs réponses peuvent être attendues.") : "")+options+
        (result ? '<div class="fb"><p><strong>'+gradeWord(result.grade)+'</strong></p>'+para(q.why||"Aucune explication n’est renseignée pour cette question.")+
          (q.src?'<p class="hint source">'+esc(q.src)+'</p>':'')+clip(q.cours)+action("next",next)+'</div>' :
          '<div class="actions">'+action("submit","Vérifier").replace("data-act",selection?"data-act":"disabled data-act")+help+'</div>')+
        action("home","Faire une pause","ghost"));
      mountCaptions();
      return;
    }
    const example = cases[s.example.course][s.example.index];
    const checks = example.criteria.map((criterion,index) => '<label class="review-check"><input data-check="'+index+'" type="checkbox"'+
      (s.checks.includes(index)?" checked":"")+'> <span>'+esc(criterion)+'</span></label>').join("");
    const response = '<label for="daily-draft">Ta réponse</label><textarea id="daily-draft">'+esc(s.draft)+'</textarea>';
    const model = s.phase === "model" ? '<div class="fb"><p><strong>Une réponse possible</strong></p>'+para(example.model)+
      para("Coche les critères que tu retrouves dans ta première réponse.")+checks+
      '<label for="daily-rewrite">Ta réponse retravaillée, si besoin</label><textarea id="daily-rewrite">'+esc(s.rewrite)+'</textarea>'+
      '<div class="actions">'+action("finish","Terminer mon auto-évaluation")+'</div></div>' : "";
    const hint = s.caseHelp ? para(example.hint)+clip(s.example.course) : action("case-help","Un indice","ghost");
    view.innerHTML = wrap("Cas d’application · "+titles[courseIndex(s.example.course)],"Explique ton raisonnement",
      para(example.prompt)+response+(s.phase==="model" ? model : '<div class="actions">'+action("compare","Comparer ma réponse").replace("data-act",s.draft.trim()?"data-act":"disabled data-act")+hint+'</div>')+
      action("home","Faire une pause","ghost"));
    if (s.phase==="model") view.querySelector("#daily-draft").readOnly=true;
    mountCaptions();
  }
  function redraw() {
    persist();
    render();
    view.focus({preventScroll:true});
    window.scrollTo(0,0);
  }
  view.addEventListener("click", event => {
    const name = event.target.closest("button")?.dataset.act;
    if (!name) return;
    const s = state.session;
    if (name==="start" && (!s || s.phase==="done" && s.day!==dayNum())) {
      const items=plan(questions,dayNum()).map(q=>Core.plan.shuffleQcm(q));
      if (!items.length) return;
      state.session={ phase:"question",day:dayNum(),items,index:0,choices:null,results:[],usedHelp:false,caseHelp:false,draft:"",rewrite:"",checks:[] };
      ready=true;
    } else if (name==="resume") ready=true;
    else if (name==="home") ready=false;
    else if (name==="help" && s.phase==="question") s.usedHelp=true;
    else if (name==="submit" && s.phase==="question" && s.choices!==null && (!Array.isArray(s.choices)||s.choices.length)) {
      const q=s.items[s.index];
      const correct=Core.score.qcmRight(q,s.choices);
      recordFor(q);
      s.results.push({course:q.cours,grade:correct?(s.usedHelp?"helped":"solo"):"retry"});
      s.phase="feedback";
    } else if (name==="next" && s.phase==="feedback") {
      if (s.index+1<s.items.length) { s.index++; s.choices=null; s.usedHelp=false; s.phase="question"; }
      else { s.example=selectCase(s); s.phase="case"; }
    } else if (name==="case-help" && s.phase==="case") s.caseHelp=true;
    else if (name==="compare" && s.phase==="case" && s.draft.trim()) s.phase="model";
    else if (name==="finish" && s.phase==="model") {
      const checks=cases[s.example.course][s.example.index].criteria.length;
      s.caseStatus=s.checks.length===checks ? (s.caseHelp?"critères cochés avec aide":"critères cochés sans indice") : "à retravailler";
      state.cases[s.example.course]=(state.cases[s.example.course]||0)+1;
      state.sessions++;
      s.phase="done";
      ready=false;
    } else return;
    redraw();
  });
  view.addEventListener("input",event=>{
    const s=state.session;
    if (!s) return;
    if (event.target.id==="daily-draft" && s.phase==="case") {
      s.draft=event.target.value;
      const button=view.querySelector('[data-act="compare"]');
      if (button) button.disabled=!s.draft.trim();
    } else if (event.target.id==="daily-rewrite" && s.phase==="model") s.rewrite=event.target.value;
    else return;
    persist();
  });
  view.addEventListener("change",async event=>{
    if (event.target.id==="daily-import" && event.target.files[0]) {
      try {
        const pack=JSON.parse(await event.target.files[0].text());
        if (!Core.pack.validate(pack).ok || !pack.qcm?.some(sameCourse)) throw new Error("Pack sans QCM Orator 1 utilisable.");
        localPack=pack;
        try { localStorage.setItem(packKey,JSON.stringify(pack)); }
        catch { status.textContent="Le pack est ouvert. L’enregistrement sur cet appareil est indisponible."; }
        ready=false; note="Pack importé."; init(); redraw();
      } catch { note="Ce fichier n’est pas un pack Palestre avec des QCM Orator 1 utilisables."; render(); }
      return;
    }
    const s=state.session;
    if (!s) return;
    const input=event.target;
    if (input.name==="choice" && s.phase==="question") {
      const n=Number(input.value);
      if (input.type==="checkbox") {
        const choices=s.choices||[];
        s.choices=input.checked ? [...new Set([...choices,n])] : choices.filter(x=>x!==n);
      } else s.choices=n;
      const button=view.querySelector('[data-act="submit"]');
      if (button) button.disabled=s.choices===null||Array.isArray(s.choices)&&!s.choices.length;
    } else if (input.dataset.check!==undefined && s.phase==="model") {
      const n=Number(input.dataset.check);
      s.checks=input.checked ? [...new Set([...s.checks,n])] : s.checks.filter(x=>x!==n);
    } else return;
    persist();
  });
  init();
  render();
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js", {updateViaCache:"none"}).catch(()=>{});
  }
})();
