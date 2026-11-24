// ── month.js — экран итогов месяца ───────────────────────────

const MonthScreen = (() => {

  const MONTH_QUESTIONS = [
    { key: 'discovery',  q: 'Главное открытие месяца об энергии' },
    { key: 'bestTime',   q: 'В какое время дня было больше всего энергии?' },
    { key: 'recovery',   q: 'Что лучше всего восстанавливает тебя?' },
    { key: 'change',     q: 'Что изменю в следующем месяце?' },
    { key: 'gratitude',  q: 'За что я благодарна себе в этом месяце?' },
  ];

  const SPHERES = DB.SPHERES;

  // Цвета секторов — тёплая палитра в тоне приложения
  const SPHERE_COLORS = [
    '#C97B7B', '#D4A56A', '#B8C46A', '#6AB8A5',
    '#6A8BB8', '#9B6AB8', '#B86A9B',
  ];

  let presenceMode='all', presencePercent=false;
  function renderPresence(){
    const {days,stats}=DB.getSpherePresence();
    const fmt=n=>presencePercent?(days?Math.round(n/days*100)+'%':'−'):n+' из '+days;
    const pt=(r,i)=>[150+r*Math.sin(i*2*Math.PI/7),145-r*Math.cos(i*2*Math.PI/7)];
    const points=SPHERES.map((s,i)=>pt(100*stats[s.id][presenceMode]/Math.max(1,days),i).join(',')).join(' ');
    return '<div class="presence-controls">'+[['all','Всё'],['tasks','Дела и события'],['habits','Привычки']].map(([k,v])=>'<button type="button" data-presence="'+k+'" aria-pressed="'+(k===presenceMode)+'">'+v+'</button>').join('')+'</div>'+
      '<div class="wheel-wrap"><svg viewBox="0 0 300 290" class="balance-wheel">'+[25,50,75,100].map(r=>'<circle cx="150" cy="145" r="'+r+'" fill="none" stroke="#B58E8E" stroke-opacity=".35"/>').join('')+
      SPHERES.map((s,i)=>{const [x,y]=pt(100,i);return '<line x1="150" y1="145" x2="'+x+'" y2="'+y+'" stroke="#B58E8E" stroke-opacity=".35"/>';}).join('')+
      '<polygon points="'+points+'" fill="#B58E8E" fill-opacity=".25" stroke="#B58E8E" stroke-width="1.5"/>'+
      SPHERES.map((s,i)=>{const [x,y]=pt(125,i);return '<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="17">'+s.emoji+'</text><text x="'+x+'" y="'+(y+14)+'" text-anchor="middle" font-size="10" fill="#B58E8E">'+stats[s.id][presenceMode]+' дн.</text>';}).join('')+'</svg></div>'+
      '<div class="presence-controls"><span>'+days+' дней цикла</span><button type="button" data-presence-unit aria-pressed="'+presencePercent+'">'+(presencePercent?'В днях':'В процентах')+'</button></div>'+
      SPHERES.map(s=>{const n=stats[s.id][presenceMode];return '<div class="sphere-stat-row"><span class="ssr-emoji">'+s.emoji+'</span><div class="ssr-body"><div class="ssr-top"><span class="ssr-name">'+s.name+'</span><span class="ssr-pct">'+fmt(n)+'</span></div><div class="ssr-track"><div class="ssr-fill" style="background:#B58E8E;width:'+(100*n/Math.max(1,days))+'%"></div></div></div></div>';}).join('');
  }
  function bindPresence(){
    const el=document.getElementById('month-presence');
    if(!el)return;
    el.querySelectorAll('[data-presence]').forEach(b=>b.onclick=()=>{presenceMode=b.dataset.presence;el.innerHTML=renderPresence();bindPresence();});
    el.querySelector('[data-presence-unit]').onclick=()=>{presencePercent=!presencePercent;el.innerHTML=renderPresence();bindPresence();};
  }

  function renderWheel(stats) {
    const N = SPHERES.length;
    const cx = 130, cy = 130;
    const Rmax = 80, Rmin = 20;
    const Rlabel = 100;
    const step = (2 * Math.PI) / N;
    const offset = -Math.PI / 2;

    function pt(r, i) {
      const a = offset + i * step;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }

    let html = '';

    // Концентрические сетки
    [0.25, 0.5, 0.75, 1].forEach(frac => {
      const r = Rmin + (Rmax - Rmin) * frac;
      const pts = Array.from({length: N}, (_, i) => pt(r, i));
      const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ') + 'Z';
      html += `<path d="${d}" fill="none" stroke="rgba(213,184,184,${frac === 1 ? '.25' : '.1'})" stroke-width="${frac === 1 ? 1 : 0.5}"/>`;
    });

    // Радиусные линии
    for (let i = 0; i < N; i++) {
      const [x1, y1] = pt(Rmin, i), [x2, y2] = pt(Rmax, i);
      html += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="rgba(213,184,184,.12)" stroke-width="0.5"/>`;
    }

    // Заполненная область
    const fillPts = SPHERES.map((s, i) => {
      const pct = (stats[s.id]?.pct ?? 0) / 100;
      const r = Rmin + (Rmax - Rmin) * Math.max(0.03, pct);
      return pt(r, i);
    });
    const fillD = fillPts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ') + 'Z';
    html += `<path d="${fillD}" fill="rgba(181,142,142,.2)" stroke="rgba(181,142,142,.7)" stroke-width="1.5"/>`;

    // Точки на вершинах
    SPHERES.forEach((s, i) => {
      if (!stats[s.id]?.total) return;
      const pct = (stats[s.id]?.pct ?? 0) / 100;
      const r = Rmin + (Rmax - Rmin) * Math.max(0.03, pct);
      const [x, y] = pt(r, i);
      html += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4" fill="${SPHERE_COLORS[i]}" stroke="var(--dark)" stroke-width="1.5"/>`;
    });

    // Эмодзи снаружи
    SPHERES.forEach((s, i) => {
      const [x, y] = pt(Rlabel, i);
      html += `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" font-size="15">${s.emoji}</text>`;
    });

    // Центр
    const totals = Object.values(stats).reduce((a,s)=>({done:a.done+s.done,total:a.total+s.total}),{done:0,total:0});
    const avg = totals.total ? Math.round(100*totals.done/totals.total)+'%' : '−';
    html += `<circle cx="${cx}" cy="${cy}" r="${Rmin}" fill="var(--dark)"/>`;
    html += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="7" fill="#B58E8E" font-family="var(--font-sans)" letter-spacing="1">ВСЕГО</text>`;
    html += `<text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="15" font-weight="500" fill="var(--lighter)" font-family="var(--font-sans)">${avg}</text>`;

    return `
      <div class="wheel-wrap">
        <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" class="balance-wheel">
          ${html}
        </svg>
      </div>
    `;
  }

  function renderSphereList(stats) {
    return SPHERES.map((s, i) => {
      const st  = stats[s.id] || { done: 0, total: 0, pct: 0 };
      const color = SPHERE_COLORS[i];
      return `
        <div class="sphere-stat-row">
          <span class="ssr-emoji">${s.emoji}</span>
          <div class="ssr-body">
            <div class="ssr-top">
              <span class="ssr-name">${s.name}</span>
              <span class="ssr-pct">${st.total ? st.pct+'%' : '−'}</span>
            </div>
            <div class="ssr-track">
              <div class="ssr-fill" style="width:${st.pct}%; background:${color}"></div>
            </div>
            <div class="ssr-sub">${st.total ? `${st.done} из ${st.total} отметок` : 'Нет данных'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function period(from=1,to=4){
    const days=[],dates=[];let tasks=0,marks=0,positive=0,negative=0;
    const settings=DB.settings();const habits=settings.habits?DB.getHabits():[];
    for(let w=from;w<=to;w++)for(let d=1;d<=7;d++){
      const date=DB.dateForDay(w,d);if(!date||date>DB.localDate())continue;
      dates.push(date);const entries=(settings.tasks?DB.getTasks(w,d):[]).filter(t=>String(t.name||'').trim());tasks+=entries.length;
      const comp=DB.getCompletionsForDate(date),done=habits.filter(h=>comp[h.id]);marks+=done.length;
      const scores=entries.filter(t=>t.score!==null&&t.score!==undefined).map(t=>Number(t.score)||0).concat(done.map(h=>Number(h.energy)||0));
      if(scores.length){const total=scores.reduce((a,b)=>a+b,0);days.push({w,d,date,total});for(const n of scores){positive+=Math.max(0,n);negative+=Math.max(0,-n);}}
    }
    const rows=habits.map(h=>({name:h.name,...DB.habitProgress(h,dates)})).filter(h=>h.total);
    const done=rows.reduce((a,h)=>a+h.done,0),target=rows.reduce((a,h)=>a+h.total,0);
    return {days,dates,tasks,marks,positive,negative,total:positive-negative,rows,done,target,pct:target?Math.round(done/target*100):null};
  }
  function fmt(n){return n===null?'−':n>0?'+'+n:n<0?'−'+Math.abs(n):'0';}
  function balance(p){return '<div class="review-card review-center"><div class="sc-label">Баланс энергии</div><div class="review-big '+(p.total<0?'review-neg':'review-pos')+'">'+fmt(p.days.length?p.total:null)+'</div><div class="review-pair"><span class="review-pos">Получено '+fmt(p.positive)+'</span><span class="review-neg">Потрачено '+fmt(-p.negative)+'</span></div><div class="review-track"><i style="width:'+(100*p.positive/Math.max(1,p.positive+p.negative))+'%"></i><b style="width:'+(100*p.negative/Math.max(1,p.positive+p.negative))+'%"></b></div><div class="sc-sub">Дней с оценками: '+p.days.length+' из '+p.dates.length+'</div></div>';}
  function chart(values,labels){
    const max=Math.max(1,...values.filter(n=>n!==null).map(Math.abs)),step=280/values.length;
    return '<div class="review-card"><svg viewBox="0 0 320 150" width="100%" role="img" aria-label="Динамика энергии"><line x1="12" y1="70" x2="308" y2="70" stroke="#D4B8B8"/>'+values.map((n,i)=>{const x=20+step*(i+.5),h=n===null?0:Math.abs(n)/max*48;return (n===null?'': '<rect x="'+(x-10)+'" y="'+(n>=0?70-h:70)+'" width="20" height="'+Math.max(1,h)+'" rx="3" fill="'+(n>=0?'#8DA787':'#C99489')+'"/>')+'<text x="'+x+'" y="'+(n===null?65:n>=0?65-h:82+h)+'" text-anchor="middle" font-size="10" fill="#6B4E4E">'+fmt(n)+'</text><text x="'+x+'" y="145" text-anchor="middle" font-size="10" fill="#6B4E4E">'+labels[i]+'</text>';}).join('')+'</svg><div class="sc-sub">− нет оценок энергии</div></div>';
  }
  function habitsReview(p){return '<div class="review-card"><div class="review-big">'+(p.pct===null?'−':p.pct+'%')+'</div><div class="sc-sub">'+p.done+' из '+p.target+' запланированных выполнений</div>'+p.rows.map(h=>'<div class="review-habit"><span>'+escHtml(h.name)+'</span><span>'+h.done+'/'+h.total+'</span></div><div class="ssr-track"><div class="ssr-fill" style="width:'+h.pct+'%;background:#B58E8E"></div></div>').join('')+'</div>';}
  function render() {
    const el = document.getElementById('screen-month');

    const p=period();
    const weekScores = [1,2,3,4].map(w => DB.getWeekScore(w));
    const monthScore = weekScores.reduce((s, v) => s + v, 0);
    const totalTasks = (() => { let n = 0; for (let w=1;w<=4;w++) for (let d=1;d<=7;d++) n+=DB.getTasks(w,d).length; return n; })();

    const bestWeekIdx  = weekScores.indexOf(Math.max(...weekScores));
    const worstWeekIdx = weekScores.indexOf(Math.min(...weekScores));
    const maxAbs = Math.max(1, ...weekScores.map(Math.abs));

    const vampires   = DB.getActiveSources(1,4,'min');
    const donors     = DB.getActiveSources(1,4,'max');
    const refl       = DB.getReflection('month');
    const meta       = DB.getMeta();
    const sphereStats = DB.getHabitsSphereStats();

    const scoreDisp = monthScore > 0 ? `+${monthScore}` : `${monthScore}`;

    const monthName = (() => {
      const d = meta.startDate ? DB.parseDate(meta.startDate) : new Date();
      return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    })();

    el.innerHTML = `
      <div class="page-header">
        <div class="eyebrow">Итоги</div>
        <div class="title">${capitalize(monthName)}</div>
        <div class="subtitle">${totalTasks} записей · 4 недели</div>
      </div>

      <div class="strip">
        ${[1,2,3,4].map(w => {
          const s = weekScores[w-1];
          const cls = s > 0 ? 'pos' : s < 0 ? 'neg' : '';
          const lbl = s > 0 ? `+${s}` : s === 0 ? '·' : `${s}`;
          return `<div class="strip-pill">
            <span class="p-name">Нед ${w}</span>
            <span class="p-score ${cls}">${lbl}</span>
          </div>`;
        }).join('')}
      </div>

      <div class="page-content">

        <div class="section-label">Месяц в цифрах</div>
        ${DB.settings().energy?balance(p):''}
        <div class="stat-grid"><div class="stat-card" ${DB.settings().tasks?'':'hidden'}><div class="sc-label">Записей за период</div><div class="sc-value">${p.tasks}</div></div><div class="stat-card" ${DB.settings().habits?'':'hidden'}><div class="sc-label">Отметок привычек</div><div class="sc-value">${p.marks}</div></div></div>
        <div ${DB.settings().energy?'':'hidden'}>
        <div class="section-label">Динамика энергии</div>
        ${chart([1,2,3,4].map(w=>{const x=period(w,w);return x.days.length?x.total:null;}),['Нед 1','Нед 2','Нед 3','Нед 4'])}
        </div>
        <div ${DB.settings().spheres&&DB.settings().tasks&&DB.settings().habits?'':'hidden'}>
        <div class="section-label">Колесо сфер жизни</div>
        <div class="sc-sub">В какие дни сферы присутствовали в моей жизни</div>
        <div id="month-presence">${renderPresence()}</div>
        ${renderSphereEnergy(DB.getSphereEnergy(), true)}
        </div>
        <div ${DB.settings().habits?'':'hidden'}>
        <div class="section-label">Привычки за месяц</div>
        ${habitsReview(p)}
        </div>
        <div ${DB.settings().energy?'':'hidden'}>
        ${donors.length||vampires.length?'<details class="review-card"><summary>Источники энергии за месяц</summary>'+(donors.length?renderVD(donors,'pos','Что наполняло'):'')+(vampires.length?renderVD(vampires,'neg','Что истощало'):'')+'</details>':''}
        <div class="section-label">Мои наблюдения</div>
        <div class="review-card">${p.days.length>=2?'<p>Самая ресурсная из заполненных дат: '+p.days.reduce((a,b)=>a.total>=b.total?a:b).date+' ('+fmt(Math.max(...p.days.map(d=>d.total)))+').</p>':'<p>Пока недостаточно оценок для сравнения.</p>'}${p.rows.length?'<p>Наиболее регулярная привычка: '+escHtml([...p.rows].sort((a,b)=>b.pct-a.pct)[0].name)+'.</p>':''}</div>
        </div>
        <div ${DB.settings().reflection?'':'hidden'}>
        <div class="section-label">Завершая месяц</div>
        ${[{key:'insight_v2',q:'Что я поняла о себе?'},{key:'more_less_v2',q:'Чего хочется больше, а чего меньше?'},{key:'focus_v2',q:'Мой фокус на следующий месяц'}].map(({key,q})=>'<div class="reflection-card"><div class="ref-q">'+q+'</div><textarea class="ref-input" data-key="'+key+'" placeholder="Можно оставить пустым">'+escHtml(refl[key]||'')+'</textarea></div>').join('')}
        ${MONTH_QUESTIONS.some(q=>refl[q.key])?'<details class="review-card"><summary>Предыдущие ответы</summary>'+MONTH_QUESTIONS.filter(q=>refl[q.key]).map(q=>'<div class="ref-q">'+q.q+'</div><textarea class="ref-input" data-key="'+q.key+'">'+escHtml(refl[q.key])+'</textarea>').join('')+'</details>':''}
        </div>

      </div>
    `;

    bindPresence();
    // Автосохранение рефлексии
    document.querySelectorAll('#screen-month .ref-input[data-key]').forEach(ta => {
      ta.addEventListener('input', () => {
        const r = DB.getReflection('month');
        r[ta.dataset.key] = ta.value;
        DB.saveReflection(r, 'month');
      });
    });
  }

  function renderVD(items, type, title) {
    if (!items.length) {
      return `<div class="empty-state" style="padding:16px">Заполните дни − данные появятся автоматически</div>`;
    }
    return `
      <div class="vd-card">
        <div class="vd-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${type === 'neg' ? 'var(--accent)' : 'var(--pos-5-tx)'}" stroke-width="1.5" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span>${title}</span>
        </div>
        ${items.map((item, i) => `
          <div class="vd-row">
            <span class="vd-num">${i + 1}</span>
            <span class="vd-name">${escHtml(item.name)}</span>
            <span class="vd-chip ${item.score === 10 ? 'pos10' : type}">${item.score > 0 ? '+' : ''}${item.score}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderSphereEnergy(rows, detailed=false) {
    const fmt=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'0';
    const max=Math.max(1,...rows.map(r=>Math.abs(r.total)));
    return '<div class="section-label">Энергия по сферам</div>'+(!rows.length?'<div class="empty-state">Данных пока нет</div>':rows.map(r=>{
      const balance='<span class="sphere-energy-value '+(r.total<0?'neg':'pos')+'">'+fmt(r.total)+'</span>';
      const title='<span>'+r.emoji+' '+r.name+'</span>'+balance;
      if(!detailed)return '<div class="sphere-energy-card"><div class="sphere-energy-head">'+title+'</div><div class="sphere-energy-track"><div class="sphere-energy-bar '+(r.total<0?'neg':'pos')+'" style="width:'+Math.abs(r.total)/max*100+'%"></div></div></div>';
      return '<details class="sphere-energy-card"><summary class="sphere-energy-head">'+title+'</summary><div class="sphere-energy-meta">Получено +'+r.positive+' · Потрачено −'+r.negative+'</div><div class="sphere-energy-items">'+r.items.map(i=>'<div class="sphere-energy-head"><span>'+escHtml(i.name)+' <small>'+ (i.kind==='habit'?'Привычка':'Запись')+' · '+i.count+'</small></span><span>'+fmt(i.score)+'</span></div>').join('')+'</div></details>';
    }).join(''));
  }
  return { render, renderSphereEnergy, period, balance, chart, habitsReview, fmt };

})();
