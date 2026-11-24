"use strict";
(() => {
  const courses = window.O1_COURSES;
  const lessons = courses.flatMap(c => c.lessons.map(l => ({...l, course:c.course, courseTitle:c.title})));
  const byId = new Map(lessons.map(l => [l.id,l]));
  const media = window.O1_STUDY_MEDIA || {};
  const { esc, dayNum, shuffle } = Core.util;
  const main = document.querySelector("#main");
  const status = document.querySelector("#storage-note");
  const key = "palestre.orator1.cours.v1";
  const initial = {version:1,exam:"",confirmed:false,open:null,items:{}};
  let data = {...initial};
  let courseText = null;
  let offlineMessage = "";
  let downloading = false;
  try {
    const previous=JSON.parse(localStorage.getItem(key));
    if (previous?.version===1) data = {...data,...previous};
  } catch {}
  const today=()=>dayNum();
  const item = id => data.items[id] ||= {step:0,unlocked:0,draft:"",revised:"",checked:false,showModel:false,touched:0};
  const completed = l => Boolean(data.items[l.id]?.done);
  const nextLesson = () => lessons.find(l=>!completed(l));
  const due = () => lessons.filter(l=>completed(l)&&item(l.id).due<=today()).sort((a,b)=>item(a.id).due-item(b.id).due);
  const label = ["L’histoire","Le pourquoi","Essayer","Appliquer"];
  const a = (href,text,ghost=false)=>'<a class="btn '+(ghost?"ghost":"")+'" href="'+href+'">'+esc(text)+'</a>';
  const b = (action,text,disabled=false,ghost=false)=>'<button class="btn '+(ghost?"ghost":"")+'" type="button" data-action="'+action+'"'+(disabled?" disabled":"")+'>'+esc(text)+'</button>';
  const p = text=>'<p>'+esc(text)+'</p>';
  const title = (k,h)=>'<p class="eyebrow">'+esc(k)+'</p><h1>'+esc(h)+'</h1>';
  const path = l => "#lecon/"+encodeURIComponent(l.id);
  const reviewPath = l => "#rappel/"+encodeURIComponent(l.id);
  const count = () => lessons.filter(completed).length;
  const weekendCase = l => {
    const cases = window.O1_DAILY_CASES?.["c"+l.course] || [];
    if (cases.length) return cases[dayNum()%cases.length];
    return {prompt:l.application,hint:l.hint,model:l.model,criteria:[]};
  };
  function persist() {
    try { localStorage.setItem(key,JSON.stringify(data)); }
    catch { status.textContent="Le stockage est indisponible. Garde la page ouverte ou exporte ta progression."; }
  }
  function lessonLink(l,text) {return l?a(path(l),text):"";}
  const supportsOffline = () => location.protocol !== "file:" && "serviceWorker" in navigator && "caches" in window;
  function home() {
    const started=byId.get(data.open);
    const daily=started&&!completed(started)?started:nextLesson();
    const recall=due()[0];
    return '<section class="hero"><div>'+title("Première année · Orator 1",daily?daily.title:"Les six cours sont parcourus")+
      p(daily?"Une histoire, le raisonnement expliqué et un essai guidé. Prévois environ huit minutes.":"Réutilise les notions que tu as travaillées dans les rappels et les sujets d’entraînement.")+
      '<div class="actions">'+(daily?lessonLink(daily,started===daily?"Reprendre ma leçon":"Commencer aujourd’hui"):a("#examen","Préparer le QCM"))+
      '</div></div><div class="stat"><p>Notions parcourues</p><b>'+count()+' / '+lessons.length+'</b><progress aria-label="Notions parcourues" value="'+count()+'" max="'+lessons.length+'"></progress>'+
      p("Une notion compte après un essai écrit et la lecture du modèle.")+'</div></section>'+
      '<div class="grid below">'+(recall?'<section class="tile"><h2>Retrouve de mémoire</h2>'+p(recall.title)+'<a href="'+reviewPath(recall)+'">Faire un rappel</a></section>':'<section class="tile"><h2>Rappels</h2>'+p("Ils apparaissent après que tu as étudié une notion.")+'</section>')+
      '<section class="tile"><h2>Les textes et auteurs</h2>'+p("Retrouve chaque notion dans le cours et les passages étudiés.")+'<a href="#cours">Voir les six cours</a></section>'+
      '<section class="tile"><h2>Plus de temps ?</h2>'+p("Deux étapes reliées et un exercice d’application.")+'<a href="#weekend">Ouvrir la séance longue</a></section></div>'+
      (supportsOffline() ? '<details class="panel below"><summary>Étudier sans réseau</summary><p>Ouvre d’abord le parcours en ligne. Enregistre les neuf vidéos sur cet appareil avant de partir. Cette option utilise environ 17 Mo.</p>'+
        b("offline",downloading?"Téléchargement…":"Enregistrer les vidéos hors ligne",downloading,true)+
        '<p id="offline-state" role="status">'+esc(offlineMessage)+'</p></details>' : "");
  }
  function library() {
    return '<div class="panel">'+title("Orator 1","Les six cours")+
      courses.map(c=>{
        const done=c.lessons.filter(completed).length;
        return '<details class="course"'+(c.course===(nextLesson()?.course||1)?" open":"")+'><summary>'+esc("Cours "+c.course+" · "+c.title)+' <small>('+done+'/'+c.lessons.length+')</small></summary><ol class="lessons">'+
          c.lessons.map(x=>'<li><a href="'+path(x)+'">'+esc(x.title)+'</a>'+(completed(x)?' <small>Parcourue</small>':'')+'</li>').join("")+'</ol></details>';
      }).join("")+'</div>';
  }
  function weekend() {
    const available=lessons.filter(l=>!completed(l)).slice(0,2);
    const covered=lessons.filter(completed);
    const anchor=due()[0]||covered.at(-1);
    return '<section class="panel">'+title("Séance longue · environ 25 min","Relier les idées")+
      p("Prends le temps de suivre deux raisonnements. Puis explique avec tes mots celui que tu pourrais réutiliser.")+
      '<div class="grid below">'+available.map((l,i)=>'<div class="tile"><p class="eyebrow">Étape '+(i+1)+'</p><h3>'+esc(l.title)+'</h3>'+lessonLink(l,"Ouvrir")+'</div>').join("")+
      '<div class="tile"><h3>'+ (anchor?"Un cas à expliquer":"Premier cas")+'</h3>'+
      (anchor?p("Résous un autre cas, puis reformule ta réponse comme si tu l’expliquais à un ami en trente secondes.")+a("#oral/"+encodeURIComponent(anchor.id),"Ouvrir un autre cas du cours",true):p("Après ta première leçon, tu retrouveras ici un exercice d’application."))+'</div></div></section>';
  }
  function exam() {
    const examDay=data.exam ? dayNum(new Date(data.exam+"T12:00:00")) : null;
    const time=examDay===null ? null : examDay-today();
    const pace=time>1&&count()<lessons.length?Math.max(1,Math.ceil((lessons.length-count())/(time-1))):null;
    return '<section class="panel reading">'+title("Préparation","Vers le QCM")+
      p("Le support d’Orator 1 décrit un QCM d’une heure sur le cours. Je pars de ce document pour l’entraînement.")+
      '<label for="exam-date">Date de travail'+(data.confirmed?"":" (provisoire)")+'</label><br><input class="date-input" type="date" id="exam-date" value="'+esc(data.exam)+'"> '+
      (time!==null&&!Number.isNaN(time)?'<span class="muted">'+esc(time<0?"Date dépassée":time===0?"Aujourd’hui":"Dans "+time+" jours")+'</span>':'')+
      '<p><label><input type="checkbox" id="exam-confirmed" '+(data.confirmed?"checked":"")+'> La date est confirmée</label></p>'+
      (pace?p("Pour faire un premier tour avant cette date, vise environ "+pace+" notion"+(pace>1?"s":"")+" par jour. La séance longue permet de regrouper deux notions."): "")+
      p("Parcours les notions, puis essaie un QCM chronométré qui couvre les six cours. Tu peux aussi réviser en courtes séances.")+
      '<div class="actions">'+a("index.html#examens","Ouvrir l’examen blanc")+a("o1-revision.html","Réviser",true)+'</div>'+
      '<details><summary>Reprendre mon avancée sur un autre appareil</summary>'+p("Exporte la progression sur cet appareil puis importe-la sur l’autre. Ce fichier contient tes réponses.")+
      b("export","Exporter ma progression",false,true)+'<p><label for="import-progress">Importer une progression</label><br><input id="import-progress" type="file" accept=".json,application/json"></p></details></section>';
  }
  function sources(l) {
    return '<details id="lesson-sources"><summary>Textes et références du cours</summary><ul>'+l.sources.map(s=>{
      const line=Number(s.line);
      return '<li>'+esc(s.label)+' · ligne '+esc(s.line)+(courseText&&line>0&&line<=courseText.length?
        ' <details><summary>Lire ce passage</summary><pre class="excerpt">'+esc(courseText.slice(Math.max(0,line-2),line+17).join("\n"))+'</pre></details>':'')+'</li>';
    }).join("")+'</ul>'+
      (!courseText?'<p>Pour lire le texte à côté de la leçon, charge ton fichier <strong>cours_Orator_1.txt</strong>. Il reste ouvert dans cet onglet.</p><label for="import-ocr">Fichier du cours</label><br><input type="file" id="import-ocr" accept=".txt,text/plain">':'')+'</details>';
  }
  function diagram(l) {
    return '<div class="diagram" aria-label="Les étapes du raisonnement">'+l.visual.map(x=>'<article><strong>'+esc(x.label)+'</strong>'+p(x.text)+'</article>').join("")+'</div>';
  }
  function video(l) {
    const clip=media[l.video];
    if(!clip) return "";
    return '<details><summary>Revoir la capsule avec Vivienne</summary><video class="video" controls playsinline preload="none" src="'+esc(clip.file)+'" aria-label="Capsule de cours"></video><details><summary>Lire la transcription</summary>'+
      clip.voice.map(p).join("")+'</details></details>';
  }
  function lesson(l) {
    const s=item(l.id);
    const body = [
      ()=>p(l.story)+'<div class="actions">'+b("advance","Comprendre ce qui se passe")+'</div>',
      ()=>'<h2>Pourquoi ça fonctionne</h2>'+p(l.why)+diagram(l)+'<h3>Un exemple commenté</h3>'+p(l.example)+
        '<details><summary>Le piège à éviter</summary>'+p(l.confusion)+'</details>'+video(l)+'<div class="actions">'+b("advance","Essayer")+'</div>',
      ()=>'<h2>Essaie avec un repère</h2>'+
        '<details><summary>Revoir le repère</summary>'+p(l.confusion)+'</details>'+
        '<fieldset class="question-options"><legend>'+esc(l.question)+'</legend>'+
        s.order.map(i=>'<label class="choice"><input type="radio" name="quiz" value="'+i+'"'+(s.choice===i?" checked":"")+(s.checked?" disabled":"")+'> '+esc(l.choices[i])+'</label>').join("")+'</fieldset>'+
        (s.checked?'<div role="status" class="feedback '+(s.choice===l.answer?"":"wrong")+'">'+(s.choice===l.answer?p("Oui. "+l.feedback):p("La réponse attendue est « "+l.choices[l.answer]+" »."+ " "+l.feedback))+'</div>':'')+
        '<div class="actions">'+(s.checked?b("advance","Appliquer à un autre cas")+(s.choice===l.answer?"":b("retry","Réessayer",false,true)):b("check","Vérifier",s.choice===undefined))+'</div>',
      ()=>'<h2>Explique avec tes mots</h2>'+p(l.application)+'<details><summary>Ouvrir un indice</summary>'+p(l.hint)+'</details>'+
        '<label for="draft">Ta réponse</label><textarea id="draft"'+(s.showModel?" readonly":"")+'>'+esc(s.draft)+'</textarea>'+
        (s.showModel?'<div class="feedback"><h3>Une réponse possible</h3>'+p(l.model)+p("Compare le lien entre le cas et l’idée du cours. Si un lien manque, précise-le en une phrase.")+
          '<label for="revised">Ta précision, si nécessaire</label><textarea id="revised">'+esc(s.revised)+'</textarea></div><div class="actions">'+b("finish","Terminer cette leçon")+'</div>':
          '<div class="actions">'+b("model","Comparer ma réponse",!s.draft.trim())+'</div>')
    ][s.step]();
    return '<div class="shell"><aside aria-label="Étapes">'+label.map((name,i)=>'<button type="button" class="step" data-step="'+i+'"'+(i===s.step?' aria-current="step"':'')+(i>s.unlocked?' disabled':'')+'><span>'+(i+1)+'</span>'+name+'</button>').join("")+
      '</aside><article class="panel"><p class="eyebrow">'+esc("Cours "+l.course+" · "+l.courseTitle)+'</p><h1>'+esc(l.title)+'</h1><div class="reading">'+body+sources(l)+
      '<div class="actions">'+a("#aujourdhui","Faire une pause",true)+'</div></div></article></div>';
  }
  function recall(l) {
    if(!completed(l)) return lesson(l);
    const s=item(l.id);
    const c=(s.reviews||0)%2===0 ? {prompt:l.question,hint:l.confusion,model:l.choices[l.answer]+" "+l.feedback} :
      {prompt:l.application,hint:l.hint,model:l.model};
    return '<section class="panel reading">'+title("Rappel de mémoire",l.title)+p(c.prompt)+
      '<details><summary>Un indice</summary>'+p(c.hint)+'</details><label for="recall-draft">Ta réponse</label><textarea id="recall-draft"'+(s.recallModel?" readonly":"")+'>'+esc(s.recallDraft||"")+'</textarea>'+
      (s.recallModel?'<div class="feedback"><h3>Une réponse possible</h3>'+p(c.model)+(c.criteria?.length?'<ul>'+c.criteria.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ul>':'')+'</div>'+
       '<div class="actions">'+b("recall-again","À revoir demain",false,true)+b("recall-ok","J’ai expliqué le lien")+'</div>':
       '<div class="actions">'+b("recall-model","Comparer",!s.recallDraft?.trim())+'</div>')+'</section>';
  }
  function oral(l) {
    const c=weekendCase(l);
    return '<section class="panel reading">'+title("Atelier de prise de parole",l.courseTitle)+p(c.prompt)+
      p("Prépare une réponse, puis explique-la à voix haute comme si tu parlais à quelqu’un qui découvre le sujet. Vise trente secondes.")+
      '<details><summary>Voir un indice</summary>'+p(c.hint)+'</details><details><summary>Comparer après ma prise de parole</summary>'+p(c.model)+
      (c.criteria?.length?'<ul>'+c.criteria.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ul>':'')+'</details>'+
      '<div class="actions">'+a("#weekend","Retour à la séance longue",true)+'</div></section>';
  }
  let viewName, active;
  function route() {
    let [kind,slug] = location.hash.slice(1).split("/");
    if (kind==="debut" && !data.exam && /^\d{4}-\d\d-\d\d$/.test(slug||"")) {
      data.exam=slug;
      persist();
      history.replaceState(null,"",location.pathname+location.search+"#aujourdhui");
      kind="aujourdhui";
    }
    active=byId.get(slug);
    viewName=active&&["lecon","rappel","oral"].includes(kind)?kind:["cours","weekend","examen"].includes(kind)?kind:"aujourdhui";
    if(viewName==="rappel"&&!completed(active)) viewName="lecon";
    if(viewName==="lecon") {
      const s=item(active.id);
      s.order ??= shuffle(active.choices.map((_,i)=>i));
      if(!completed(active)) { data.open=active.id; persist(); }
    }
    render();
    main.focus({preventScroll:true});
    window.scrollTo(0,0);
  }
  function render() {
    const views={aujourdhui:home,cours:library,weekend,examen:exam,lecon:lesson,rappel:recall,oral};
    main.innerHTML=views[viewName](active);
    document.querySelectorAll("[data-nav]").forEach(a => a.dataset.nav===viewName?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"));
    const player=main.querySelector("video"), clip=media[active?.video];
    if(player&&clip&&typeof VTTCue==="function"&&typeof player.addTextTrack==="function") {
      const track=player.addTextTrack("captions","Français","fr");
      for(const [start,end,text] of clip.captions) track.addCue(new VTTCue(start,end,text));
    }
  }
  function jump(to) { location.hash=to; }
  async function saveVideos(button) {
    if(!supportsOffline()||downloading)return;
    downloading=true;
    button.disabled=true;
    const notice=message=>{
      offlineMessage=message;
      const node=document.querySelector("#offline-state");
      if(node)node.textContent=message;
    };
    try {
      const cache=await caches.open("palestre-media-v2.3");
      const clips=Object.values(media);
      let saved=0;
      for (const clip of clips) {
        const url=new URL(clip.file,location.href).href;
        if(!await cache.match(url)) {
          const response=await fetch(url);
          if(!response.ok||response.status===206) throw Error("Vidéo indisponible");
          await cache.put(url,response);
        }
        notice((++saved)+" sur "+clips.length+" vidéos enregistrées.");
      }
      notice("Les vidéos sont enregistrées sur cet appareil.");
    } catch { notice("Téléchargement interrompu. Réessaie avec le réseau ou utilise la transcription."); }
    finally { downloading=false;button.disabled=false; }
  }
  main.addEventListener("click",e=>{
    const button=e.target.closest("button");
    if(!button) return;
    const action=button.dataset.action;
    if(action==="offline") { void saveVideos(button); return; }
    if(action==="export") {
      const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"}));
      const link=document.createElement("a");
      link.href=url;link.download="palestre-orator1-progression.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      return;
    }
    if(!active) return;
    const s=item(active.id);
    if(button.dataset.step!==undefined&&Number(button.dataset.step)<=s.unlocked) s.step=Number(button.dataset.step);
    else if(action==="advance"&&s.step<3&&(s.step<2||s.checked)) {s.step++;s.unlocked=Math.max(s.unlocked,s.step);}
    else if(action==="check"&&s.choice!==undefined) s.checked=true;
    else if(action==="retry") {delete s.choice;s.checked=false;s.order=shuffle(s.order);}
    else if(action==="model"&&s.draft.trim()) s.showModel=true;
    else if(action==="finish"&&s.showModel) {
      if(!s.done) {s.done=Date.now();s.due=today()+1;}
      s.touched=Date.now();
      if(data.open===active.id)data.open=null;
      persist();jump("#aujourdhui");return;
    } else if(action==="recall-model"&&s.recallDraft?.trim()) s.recallModel=true;
    else if((action==="recall-ok"||action==="recall-again")&&s.recallModel) {
      s.reviewSuccess=action==="recall-ok"?(s.reviewSuccess||0)+1:0;
      s.due=today()+[1,3,7,14][Math.min(s.reviewSuccess,3)];
      s.lastRecall=s.recallDraft;s.recallDraft="";s.recallModel=false;s.reviews=(s.reviews||0)+1;s.touched=Date.now();
      persist();jump("#aujourdhui");return;
    } else return;
    s.touched=Date.now();persist();render();main.focus({preventScroll:true});window.scrollTo(0,0);
  });
  main.addEventListener("input",e=>{
    if(!active || !["draft","revised","recall-draft"].includes(e.target.id)) return;
    const s=item(active.id);
    if(e.target.id==="recall-draft") s.recallDraft=e.target.value;
    else s[e.target.id]=e.target.value;
    s.touched=Date.now();persist();
    const action=e.target.id==="recall-draft"?"recall-model":"model", button=main.querySelector('[data-action="'+action+'"]');
    if(button)button.disabled=!e.target.value.trim();
  });
  const validDate=value=>typeof value==="string"&&(/^\d{4}-\d\d-\d\d$/.test(value)||value==="");
  main.addEventListener("change",async e=>{
    const t=e.target;
    if(t.name==="quiz"&&active) {
      const s=item(active.id);
      s.choice=Number(t.value);s.touched=Date.now();persist();
      main.querySelector('[data-action="check"]').disabled=false;
    } else if(t.id==="exam-date"&&validDate(t.value)) {data.exam=t.value;data.confirmed=false;persist();render();}
    else if(t.id==="exam-confirmed") {data.confirmed=t.checked;persist();render();}
    else if(t.id==="import-ocr"&&t.files?.length) {
      try {
        const text=await t.files[0].text();
        if(!text.includes("Orator_1_Orator1_c1")||!text.includes("Orator_1_Pline")) throw Error();
        courseText=text.split(/\r?\n/);
        render();
        main.querySelector("#lesson-sources").open=true;
        status.textContent="Le texte du cours est ouvert sur cet appareil.";
      } catch { status.textContent="Sélectionne le fichier cours_Orator_1.txt du dossier de passation."; }
    }
    else if(t.id==="import-progress"&&t.files?.length) {
      try{
        const incoming=JSON.parse(await t.files[0].text());
        if(incoming?.version!==1||!incoming.items||typeof incoming.items!=="object"||Array.isArray(incoming.items))throw Error();
        for(const [id,from] of Object.entries(incoming.items)){
          const l=byId.get(id);
          if(!l||!from||!Number.isFinite(from.touched)||![0,1,2,3].includes(from.step)||![0,1,2,3].includes(from.unlocked)||
            typeof from.draft!=="string"||typeof from.revised!=="string"||!Array.isArray(from.order)||from.order.length!==l.choices.length||
            new Set(from.order).size!==l.choices.length||!from.order.every(i=>Number.isInteger(i)&&i>=0&&i<l.choices.length))continue;
          const current=item(id);
          if((from.done&&!current.done)||Boolean(from.done)===Boolean(current.done)&&from.touched>current.touched)data.items[id]=from;
        }
        if(validDate(incoming.exam)&&incoming.confirmed){data.exam=incoming.exam;data.confirmed=true;}
        persist();status.textContent="Progression importée.";
      }catch{status.textContent="Ce fichier ne contient pas une progression Palestre Orator 1.";}
      render();
    }
  });
  document.querySelector(".skip")?.addEventListener("click", event=>{
    event.preventDefault();
    main.focus();
    main.scrollIntoView({block:"start"});
  });
  if("serviceWorker" in navigator&&location.protocol!=="file:") navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).catch(()=>{});
  window.addEventListener("hashchange",route);
  route();
})();
