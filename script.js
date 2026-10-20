(function(){
  var K2="habit-tracker-v2", K1="habit-tracker-v1";
  var MON=["January","February","March","April","May","June","July","August","September","October","November","December"];
  var SH=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var SD=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  var DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  function pad(n){return (n<10?"0":"")+n}
  function key(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
  function parse(k){var p=k.split("-");return new Date(+p[0],+p[1]-1,+p[2],12)}
  function addDays(d,n){var x=new Date(d.getTime());x.setDate(x.getDate()+n);return x}
  function mondayOf(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);return addDays(x,-((x.getDay()+6)%7))}
  function isoWeek(mon){var th=addDays(mon,3),j=new Date(th.getFullYear(),0,1,12);return Math.floor(Math.round((th-j)/864e5)/7)+1}
  function range(mon){var e=addDays(mon,6);return mon.getMonth()===e.getMonth()?SH[mon.getMonth()]+" "+mon.getDate()+" – "+e.getDate():SH[mon.getMonth()]+" "+mon.getDate()+" – "+SH[e.getMonth()]+" "+e.getDate()}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

  var today=new Date(), thisWeek=key(mondayOf(today)), year=Math.min(2027,Math.max(2020,today.getFullYear())), MINY=2020, MAXY=2027;
  var state={habits:[{id:1,name:"Study"}],next:2,checks:{},notes:{}};
  try{
    var s=localStorage.getItem(K2);
    if(s){var p=JSON.parse(s); if(p&&Array.isArray(p.habits)) state=p;}
    else{
      var o=localStorage.getItem(K1);
      if(o){var q=JSON.parse(o); if(q&&Array.isArray(q.habits)){
        state={habits:q.habits.map(function(h){return {id:h.id,name:h.name}}),next:q.next||50,checks:{},notes:{}};
        state.checks[thisWeek]={}; q.habits.forEach(function(h){state.checks[thisWeek][h.id]=h.days});
      }}
    }
  }catch(e){}
  state.notes=state.notes||{};state.todos=state.todos||{};state.tn=state.tn||1;if(typeof state.name!=="string") state.name="Nhu";state.name=state.name.slice(0,10);
  state.habits.forEach(function(h){if(h.end){h.off=h.off||[];h.off.push({s:key(addDays(parse(h.end),7)),e:null});delete h.end}});
  function save(){try{localStorage.setItem(K2,JSON.stringify(state))}catch(e){}}
  function off(h,wk){return (h.off||[]).some(function(r){return wk>=r.s&&(r.e===null||wk<=r.e)})}
  function nxt(wk){return key(addDays(parse(wk),7))}
  function prv(wk){return key(addDays(parse(wk),-7))}
  function days(wk,id){var w=state.checks[wk]||(state.checks[wk]={});return w[id]||(w[id]=[0,0,0,0,0,0,0])}

  var view="home", cur=thisWeek, renId=null, confirmId=null, editing=false, focusT=null, editName=false, pauseId=null;
  var app=document.getElementById("app");
  var PEN='<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var BIN='<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>';
  var OK='<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>';
  var PLUS='<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
  var L='<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
  var R='<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>';
  var ARR='<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var PAUSE='<svg viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></svg>';
  var PLAY='<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>';

  function weekView(){
    var mon=parse(cur), h='<div class="wrap"><div class="hdr"><div class="hl"><button class="pill sm" data-a="home">Home</button></div><div class="top"><h1><button class="wkbtn" data-a="thisweek"'+(cur===thisWeek?" disabled":"")+' title="Go to this week">Week '+isoWeek(mon)+'</button></h1><div class="dr"><button class="nav" data-a="prev" aria-label="Previous week">'+L+'</button><div class="sub">'+range(mon)+'</div><button class="nav" data-a="next" aria-label="Next week">'+R+'</button></div></div>';
    h+='<div class="yr"><button class="pill sm" data-a="'+(editing?"done":"edit")+'">'+(editing?"Done":"Edit page")+'</button><button class="pill sm" data-a="year">View by year</button></div></div><div class="book">';
    h+='<section class="left"><h2>Weekly notes</h2>';
    var nw=state.notes[cur]||{};
    for(var i=0;i<7;i++){
      var dt=addDays(mon,i), nv=(nw[i]||"").slice(0,100);
      h+='<div class="nrow"><div class="day'+(key(dt)===key(today)?" today":"")+'"><span>'+SD[i]+'</span><b>'+dt.getDate()+'</b></div><div class="note"><textarea maxlength="100" data-n="'+i+'" aria-label="Notes for '+DAYS[i]+'">'+esc(nv)+'</textarea><span class="cnt">'+nv.length+'/100</span></div></div>';
    }
    h+='</section><section class="right"><div class="rin"><div class="row head"><span></span>'+SD.map(function(d){return "<span>"+d+"</span>"}).join("")+'</div>';
    state.habits.forEach(function(hb){
      if(off(hb,cur)){
        if(editing) h+='<div class="row ghost"><div class="tools"><button class="icon-btn" data-a="resume" data-id="'+hb.id+'" aria-label="Resume tracking '+esc(hb.name)+' from this week" title="Resume from this week">'+PLAY+'</button><button class="icon-btn del" data-a="del" data-id="'+hb.id+'" aria-label="Delete '+esc(hb.name)+'">'+BIN+'</button></div><div class="name" title="'+esc(hb.name)+'">'+esc(hb.name)+'</div><div class="gtxt" title="Paused. Tap play to resume from this week.">Paused · resume from this week</div></div>';
        return;
      }
      var d=days(cur,hb.id), ed=renId===hb.id;
      h+='<div class="row">'+(editing?'<div class="tools"><button class="icon-btn" data-a="pause" data-id="'+hb.id+'" aria-label="Stop tracking '+esc(hb.name)+'" title="Stop tracking">'+PAUSE+'</button><button class="icon-btn del" data-a="del" data-id="'+hb.id+'" aria-label="Delete '+esc(hb.name)+'">'+BIN+'</button></div>':'');
      h+='<div class="name" title="'+esc(hb.name)+'">'+(ed?'<span class="hname hedit" contenteditable="true" spellcheck="false" role="textbox" aria-label="Habit name">'+esc(hb.name)+'</span>':editing?'<span class="hname" data-a="ren" data-id="'+hb.id+'" role="button" tabindex="0">'+esc(hb.name)+'</span>':esc(hb.name))+((hb.off||[]).some(function(r){return r.s===nxt(cur)})?'<span class="pz" title="Tracking stops after this week">'+PAUSE+'</span>':'')+'</div>';
      for(var j=0;j<7;j++) h+='<div class="cell"><input type="checkbox" data-id="'+hb.id+'" data-d="'+j+'" aria-label="'+esc(hb.name)+", "+DAYS[j]+'"'+(d[j]?" checked":"")+'></div>';
      h+='</div>';
    });
    if(!state.habits.some(function(x){return !off(x,cur)})&&!editing) h+='<div class="hint">Nothing yet. Tap Edit page to add a habit.</div>';
    if(editing) h+='<div class="row"><div><button class="add-btn" data-a="add" aria-label="Add habit">'+PLUS+'</button></div></div>';
    var td=state.todos[cur]||[];
    h+='<h2 class="tdh">To do</h2>';
    td.forEach(function(x){
      h+='<div class="trow'+(x.d?" done":"")+'">'+(editing?'<div class="tools"><button class="icon-btn del" data-a="delt" data-id="'+x.id+'" aria-label="Delete to-do">'+BIN+'</button></div>':'')+'<input type="checkbox" data-t="'+x.id+'" aria-label="Done"'+(x.d?" checked":"")+'><input class="todo-input" data-t="'+x.id+'" maxlength="60" placeholder="Write a to-do" aria-label="To-do" value="'+esc(x.t)+'"></div>';
    });
    if(!td.length&&!editing) h+='<div class="hint">Nothing yet. Tap Edit page to add a to-do.</div>';
    if(editing) h+='<div class="trow" style="display:flex"><button class="add-btn" data-a="addt" aria-label="Add to-do">'+PLUS+'</button></div>';
    h+='<div class="fullnote" hidden>This page is full. Delete something to add more.</div>';
    h+='</div></section></div></div>';
    var pb=state.habits.filter(function(x){return x.id===pauseId})[0];
    if(pb) h+='<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><h3 id="mt">Stop tracking habit?</h3><p>Are you sure you want to stop tracking “'+esc(pb.name)+'”? It will stop appearing after this week. Your ticks for this week and earlier weeks will be kept, and you can resume it from any later week.</p><div class="btns"><button class="pill no" data-a="pcancel">No</button><button class="pill ok" data-a="pconfirm">Yes, stop tracking</button></div></div></div>';
    var cb=state.habits.filter(function(x){return x.id===confirmId})[0];
    if(cb) h+='<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><h3 id="mt">Delete habit?</h3><p>Are you sure you want to delete “'+esc(cb.name)+'”? It will be removed from every week of 2026, along with all of its ticks.</p><div class="btns"><button class="pill no" data-a="cancel">No</button><button class="pill yes" data-a="confirm">Yes, I’m sure</button></div></div></div>';
    return h;
  }
  var NF=[{f:"Playfair Display",i:1,w:700},{f:"Instrument Serif",i:1,w:400},{f:"Fraunces",i:1,w:600},{f:"DM Serif Display",i:1,w:400},{f:"Cormorant Garamond",i:1,w:600},{f:"Young Serif",i:0,w:400}];
  var nf=NF[Math.floor(Math.random()*NF.length)];
  var NS='font-family:"'+nf.f+'",Georgia,serif;font-style:'+(nf.i?"italic":"normal")+';font-weight:'+nf.w;
  function homeView(){
    var nm=state.name||"";
    return '<div class="home"><h1 class="hello"><span class="wl">Welcome,</span> '+(editName?'<span class="nm hero-input" contenteditable="true" spellcheck="false" role="textbox" aria-label="Your name" data-ph="name" style="'+NS+'">'+esc(nm)+'</span>':'<button class="nm" data-a="name" style="'+NS+'" title="Click to change your name">'+esc(nm||"friend")+'</button>')+'</h1><p class="ask">What’s on your mind today?</p><button class="pill lg" data-a="journal">Go to this week’s journal'+ARR+'</button></div>';
  }
  function saveName(){
    if(!editName) return;
    var i=app.querySelector(".hero-input"); editName=false;
    if(i){state.name=i.textContent.trim().slice(0,10);save()}
    render();
  }
  function yearView(){
    var used={}, h='<div class="year"><div class="hdr"><div class="hl"><button class="pill sm" data-a="home">Home</button></div><div class="top"><div class="dr"><button class="nav" data-a="py" aria-label="Previous year"'+(year<=MINY?" disabled":"")+'>'+L+'</button><h1>'+year+'</h1><button class="nav" data-a="ny" aria-label="Next year"'+(year>=MAXY?" disabled":"")+'>'+R+'</button></div></div><div class="yr"><div class="ys"><input class="ysearch" inputmode="numeric" maxlength="4" placeholder="Other years" aria-label="Go to year"><div class="ymsg"></div></div></div></div>';
    
    h+='<div class="months">';
    for(var m=0;m<12;m++){
      h+='<section><h2>'+MON[m]+'</h2><div class="weeks">';
      var mon=mondayOf(new Date(year,m,1,12)), last=new Date(year,m+1,0,12);
      while(mon<=last){
        var k=key(mon);
        if(used[k]){mon=addDays(mon,7);continue;} used[k]=1;
        
        h+='<button class="wk'+(k===thisWeek?" cur":"")+'" data-a="go" data-k="'+k+'"><b>Week '+isoWeek(mon)+'</b><span>'+range(mon)+'</span></button>';
        mon=addDays(mon,7);
      }
      h+='</div></section>';
    }
    return h+'</div></div>';
  }
  function room(){var l=app.querySelector(".left"),r=app.querySelector(".rin");return !l||!r||r.offsetHeight+32+40<=l.offsetHeight}
  function lim(){
    if(view!=="week") return;
    var n=app.querySelector(".fullnote"); if(n) n.hidden=true;
    var ok=room();
    app.querySelectorAll('[data-a="add"],[data-a="addt"]').forEach(function(b){b.disabled=!ok;b.style.opacity=ok?"":".4";b.title=ok?"":"This page is full"});
    if(n) n.hidden=ok||!editing;
  }
  function fit(t){t.style.height="auto";t.style.height=Math.max(64,t.scrollHeight)+"px"}
  function render(anim){
    app.innerHTML=view==="week"?weekView():view==="year"?yearView():homeView();
    var ae=anim==="fade"?app.firstElementChild:(anim==="next"||anim==="prev")?(app.querySelector(".book")||app.querySelector(".months")):null;
    if(ae) ae.classList.add("a-"+anim);
    var hi=app.querySelector(".hero-input"); if(hi){hi.focus();var rg=document.createRange();rg.selectNodeContents(hi);var sl=getSelection();sl.removeAllRanges();sl.addRange(rg)}
    var he=app.querySelector(".hedit"); if(he&&confirmId===null&&pauseId===null){he.focus();var r2=document.createRange();r2.selectNodeContents(he);var s2=getSelection();s2.removeAllRanges();s2.addRange(r2)}
    var no=app.querySelector(".pill.no"); if(no) no.focus();
    app.querySelectorAll("textarea").forEach(fit);
    lim();
    if(focusT){var f=app.querySelector('.todo-input[data-t="'+focusT+'"]'); if(f) f.focus(); focusT=null}
    if(view==="year"){var c=app.querySelector(".wk.cur"); if(anim==="fade"&&c&&c.scrollIntoView){try{c.scrollIntoView({block:"center"})}catch(e){}} else window.scrollTo(0,0)}
    else window.scrollTo(0,0);
  }
  function endRename(el){
    if(renId===null) return;
    var hb=state.habits.filter(function(x){return x.id===renId})[0], nv=el.textContent.trim().slice(0,30);
    if(hb&&nv) hb.name=nv;
    renId=null; save();
    el.removeAttribute("contenteditable"); el.classList.remove("hedit");
    if(hb){el.setAttribute("data-a","ren"); el.setAttribute("data-id",hb.id); el.setAttribute("tabindex","0"); el.setAttribute("role","button"); el.textContent=hb.name}
  }
  function commit(){
    var inp=app.querySelector(".name-input"), hb=state.habits.filter(function(x){return x.id===renId})[0];
    if(inp&&hb&&inp.value.trim()) hb.name=inp.value.trim();
    renId=null; save(); render();
  }
  app.addEventListener("click",function(e){
    var b=e.target.closest("[data-a]"); if(!b) return;
    var a=b.getAttribute("data-a"), id=+b.getAttribute("data-id");
    if(a==="prev"||a==="next"){cur=key(addDays(parse(cur),a==="next"?7:-7));renId=null;editing=false;render(a)}
    else if(a==="add"){if(!room())return;var hb={id:state.next++,name:"New habit"};state.habits.push(hb);renId=hb.id;editing=true;save();render()}
    else if(a==="del"){confirmId=id;render()}
    else if(a==="thisweek"){if(cur!==thisWeek){var dr=thisWeek>cur?"next":"prev";cur=thisWeek;renId=null;editing=false;render(dr)}}
    else if(a==="pause"){pauseId=id;render()}
    else if(a==="pcancel"){pauseId=null;render()}
    else if(a==="pconfirm"){var ph=state.habits.filter(function(x){return x.id===pauseId})[0];if(ph){var s0=nxt(cur);ph.off=(ph.off||[]).filter(function(r){return r.s<s0});ph.off.push({s:s0,e:null})}pauseId=null;save();render()}
    else if(a==="resume"){var rs=state.habits.filter(function(x){return x.id===id})[0];if(rs){var p0=prv(cur),nr=[];(rs.off||[]).forEach(function(r){if(cur>=r.s&&(r.e===null||cur<=r.e)){if(p0>=r.s)nr.push({s:r.s,e:p0})}else nr.push(r)});rs.off=nr}save();render()}
    else if(a==="cancel"){confirmId=null;render()}
    else if(a==="confirm"){var gone=confirmId;state.habits=state.habits.filter(function(x){return x.id!==gone});for(var wk in state.checks) delete state.checks[wk][gone];if(renId===gone)renId=null;confirmId=null;save();render()}
    else if(a==="addt"){if(!room())return;var nt={id:state.tn++,t:"",d:0};(state.todos[cur]=state.todos[cur]||[]).push(nt);focusT=nt.id;save();render()}
    else if(a==="delt"){state.todos[cur]=(state.todos[cur]||[]).filter(function(x){return x.id!==id});save();render()}
    else if(a==="edit"){editing=true;render()}
    else if(a==="done"){editing=false;renId=null;render()}
    else if(a==="ren"){renId=id;render()}
    else if(a==="save"){commit()}
    else if(a==="year"){view="year";renId=null;editing=false;render("fade")}
    else if(a==="py"||a==="ny"){var y2=year+(a==="ny"?1:-1); if(y2>=MINY&&y2<=MAXY){year=y2;render(a==="ny"?"next":"prev")}}
    else if(a==="home"){view="home";renId=null;editing=false;render("fade")}
    else if(a==="journal"){cur=thisWeek;view="week";render("fade")}
    else if(a==="name"){editName=true;render()}
    else if(a==="go"){cur=b.getAttribute("data-k");view="week";render("fade")}
  });
  app.addEventListener("change",function(e){
    var t=e.target; if(t.type!=="checkbox") return;
    if(t.hasAttribute("data-t")){var tid=+t.getAttribute("data-t");(state.todos[cur]||[]).forEach(function(x){if(x.id===tid)x.d=t.checked?1:0});t.closest(".trow").classList.toggle("done",t.checked);save();return}
    days(cur,+t.getAttribute("data-id"))[+t.getAttribute("data-d")]=t.checked?1:0; save();
  });
  app.addEventListener("input",function(e){
    var t=e.target;
    if(t.classList.contains("todo-input")){var tid=+t.getAttribute("data-t");(state.todos[cur]||[]).forEach(function(x){if(x.id===tid)x.t=t.value});save();return}
    if(t.classList.contains("hedit")){if(t.textContent.length>30){t.textContent=t.textContent.slice(0,30);var rh=document.createRange();rh.selectNodeContents(t);rh.collapse(false);var sh=getSelection();sh.removeAllRanges();sh.addRange(rh)}return}
    if(t.classList.contains("ysearch")){t.value=t.value.replace(/\D/g,"");var ym=app.querySelector(".ymsg");if(ym)ym.textContent="";return}
    if(t.classList.contains("hero-input")){if(t.textContent.length>10){t.textContent=t.textContent.slice(0,10);var rg=document.createRange();rg.selectNodeContents(t);rg.collapse(false);var sl=getSelection();sl.removeAllRanges();sl.addRange(rg)}return}
    if(t.tagName!=="TEXTAREA") return;
    var w=state.notes[cur]||(state.notes[cur]={}); w[t.getAttribute("data-n")]=t.value; save();
    t.nextElementSibling.textContent=t.value.length+"/100"; fit(t); lim();
  });
  app.addEventListener("keydown",function(e){
    if((confirmId!==null||pauseId!==null)&&e.key==="Escape"){confirmId=null;pauseId=null;render();return}
    if(e.target.classList.contains("ysearch")){if(e.key==="Enter"){var yv=+e.target.value;if(yv>=MINY&&yv<=MAXY){year=yv;render("fade")}else{var ym=app.querySelector(".ymsg");if(ym)ym.textContent="Pick a year from "+MINY+" to "+MAXY}}return}
    if(e.target.classList.contains("hero-input")){if(e.key==="Enter"){e.preventDefault();saveName()}if(e.key==="Escape"){editName=false;render()}return}
    if(e.target.getAttribute&&e.target.getAttribute("data-a")==="ren"&&e.key==="Enter"){renId=+e.target.getAttribute("data-id");render();return}
    if(!e.target.classList.contains("hedit")) return;
    if(e.key==="Enter"){e.preventDefault();e.target.blur()}
    if(e.key==="Escape"){renId=null;render()}
  });
app.addEventListener("focusout",function(e){var c=e.target.classList; if(!c) return; if(c.contains("hero-input")) saveName(); else if(c.contains("hedit")) endRename(e.target)});
  app.addEventListener("paste",function(e){if(e.target.classList&&(e.target.classList.contains("hero-input")||e.target.classList.contains("hedit"))){e.preventDefault();document.execCommand("insertText",false,(e.clipboardData.getData("text")||"").replace(/\s+/g," ").trim())}});
  render();
})();
