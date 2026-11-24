/* Pure local analytics. No storage or network. */
const Insights = (() => {
 const sum=a=>a.reduce((s,n)=>s+n,0), mean=a=>sum(a)/a.length, fmt=n=>(n>0?'+':n<0?'−':'')+Math.abs(Math.round(n*10)/10).toLocaleString('ru-RU');
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 function analyze({entries=[],dates=[],settings={},habits=[],spheres=[],habitDetails=[],previous=null}){
  const out=[], groups=new Map(), days=new Map();
  const add=(id,group,key,title,body,proof,n,effect,utility=0.7)=>out.push({id,group,key,title,body,proof,rank:35*Math.min(n/14,1)+30*Math.min(Math.abs(effect),1)+25*utility});
  const rows=entries.filter(e=>dates.includes(e.date)&&(e.kind==='habit'?settings.habits!==false:settings.tasks!==false));
  if(settings.energy!==false){
   for(const e of rows.filter(e=>finite(e.score))){
    if(!days.has(e.date))days.set(e.date,[]);days.get(e.date).push(e.score);
    // Habit energy is configured, not an independent daily rating.
    if(e.kind==='habit')continue;
    const key=e.name.trim().toLocaleLowerCase('ru');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);
   }
   const stats=[...groups].map(([key,r])=>({key,name:r[0].name,r,n:new Set(r.map(e=>e.date)).size,values:r.map(e=>e.score)})).filter(x=>x.n>=3);
   const gross=sum(rows.filter(e=>finite(e.score)&&e.score>0).map(e=>e.score)),positiveCount=rows.filter(e=>finite(e.score)&&e.score>0).length;
   for(const sign of [1,-1]){
    const sorted=stats.filter(x=>sum(x.values)*sign>0).sort((a,b)=>sign*(sum(b.values)-sum(a.values)));
    for(const x of sorted){
     const count=x.values.filter(v=>v*sign>0).length,ratio=count/x.values.length,total=sum(x.values),proof=x.n+' разных дней; '+count+' из '+x.values.length+' оценок; баланс '+fmt(total)+'.';
     if(ratio>=.75)add(sign>0?1:2,'sources',x.key,sign>0?'Что наполняет':'Что истощает',x.name+': '+count+' из '+x.values.length+' оценок '+(sign>0?'положительные':'отрицательные')+'.',proof,x.n,ratio,.9);
     const small=x.r.filter(e=>e.score*sign>=1&&e.score*sign<=3);
     if(small.length>=5&&new Set(small.map(e=>e.date)).size>=5)add(sign>0?7:6,'sources',x.key,'Накопительный эффект',x.name+': небольшие '+(sign>0?'прибавления':'потери')+' энергии суммарно '+fmt(sum(small.map(e=>e.score)))+'.',proof,x.n,.7,.95);
    }
    const x=sorted[0];if(x)add(sign>0?3:4,'sources',x.key,sign>0?'Главный источник':'Главная потеря',x.name+': суммарный баланс '+fmt(sum(x.values))+'.',x.n+' разных дней; сравнение повторяющихся дел и событий.',x.n,Math.abs(sum(x.values))/30,.8);
   }
   for(const x of stats){
    if(x.values.length>=5&&x.values.filter(v=>v>0).length>=2&&x.values.filter(v=>v<0).length>=2)add(5,'sources',x.key,'Переменная оценка',x.name+' в разные дни получает и положительные, и отрицательные оценки.',x.values.length+' оценок за '+x.n+' разных дней.',x.n,.8,.9);
    const gain=sum(x.values.filter(v=>v>0));if(positiveCount>=10&&gross>0&&gain/gross>=.4)add(8,'sources',x.key,'Концентрация энергии',x.name+' приносит '+Math.round(gain/gross*100)+'% всей полученной энергии.',fmt(gain)+' из '+fmt(gross)+' положительных баллов.',x.n,gain/gross,.85);
   }
   const rated=dates.filter(d=>days.has(d)).map(d=>({d,v:sum(days.get(d))}));
   const a=rated.filter(x=>dates.indexOf(x.d)<14),b=rated.filter(x=>dates.indexOf(x.d)>=14);
   if(dates.length===28&&a.length>=7&&b.length>=7){
    const av=mean(a.map(x=>x.v)),bv=mean(b.map(x=>x.v)),diff=bv-av,proof=a.length+' и '+b.length+' оценённых дней в двух половинах цикла.';
    if(Math.abs(diff)>=2)add(diff>0?9:10,'trend','balance','Динамика энергии','Средний дневной баланс '+(diff>0?'вырос':'снизился')+' с '+fmt(av)+' до '+fmt(bv)+'.',proof,a.length+b.length,Math.abs(diff)/5,.95);
    for(const sign of [1,-1]){const x=a.filter(e=>e.v*sign>0).length/a.length,y=b.filter(e=>e.v*sign>0).length/b.length;if(y-x>=.2)add(sign>0?11:12,'trend','balance','Динамика энергии','Доля дней с '+(sign>0?'положительным':'отрицательным')+' балансом выросла с '+Math.round(x*100)+'% до '+Math.round(y*100)+'%.',proof,a.length+b.length,(y-x)*2,.85);}
   }
   if(rated.length>=14){const n=rated.filter(x=>x.v>0).length;if(n/rated.length>=.75)add(13,'trend','balance','Устойчивый баланс',n+' из '+rated.length+' оценённых дней имеют положительный баланс.','Нулевые и отрицательные дни не считаются положительными.',rated.length,n/rated.length,.8);}
   let run=0,streaks=0;for(const d of dates){if(days.has(d)&&sum(days.get(d))<0){run++;if(run===3)streaks++;}else run=0;}if(streaks>=2)add(14,'trend','streak','Повторяющиеся потери','За цикл отмечено '+streaks+' отдельных периодов из трёх или более отрицательных дней подряд.','Дни без оценок прерывают последовательность.',rated.length,.9,.95);
  }
  if(settings.habits!==false&&dates.length>=14)for(const h of habits.filter(h=>h.total>=4)){if(h.pct>=85||h.pct<=35)add(h.pct>=85?15:16,'habits',h.name,'Регулярность привычек',h.name+': выполнено '+h.done+' из '+h.total+' запланированных выполнений.','Регулярность '+h.pct+'%; учитывается заданный график.',h.total,Math.abs(h.pct-60)/60,.8);}
  if(settings.spheres!==false){const n=new Set(spheres.flatMap(s=>[...s.dates])).size;if(n>=7){const max=Math.max(...spheres.map(s=>s.dates.size));const top=spheres.filter(s=>s.dates.size===max);if(top.length&&max)add(23,'spheres','presence','Моё внимание',top.map(s=>s.name).join(', ')+' − чаще всего в записях: '+max+' дн.','Уникальные дни присутствия; не оценка качества жизни.',n,max/n,.7);}}

  if(settings.habits!==false)for(const h of habitDetails){
   const a=h.halves[0],b=h.halves[1],key=h.name;
   if(dates.length===28&&a.total>=4&&b.total>=4&&Math.abs(b.pct-a.pct)>=20)add(b.pct>a.pct?17:18,'habits',key,'Динамика привычки',key+': регулярность изменилась с '+a.pct+'% до '+b.pct+'%.','Две половины цикла: '+a.total+' и '+b.total+' запланированных выполнений.',a.total+b.total,.8);
   if(dates.length===28&&h.weeks.every(w=>w.total>0&&w.pct>=80))add(19,'habits',key,'Устойчивая привычка',key+': не менее 80% выполнений каждую неделю.','Четыре полные недели.',h.weeks.reduce((n,w)=>n+w.total,0),.9);
   let missed=0,returned=false;for(const d of h.timeline){if(d.done){if(missed>=3)returned=true;missed=0;}else if(d.eligible)missed++;}if(h.schedule!=='weekly'&&returned)add(20,'habits',key,'Возвращение к привычке',key+': выполнение возобновилось после трёх или более пропусков.','Учитываются только запланированные дни.',h.timeline.length,.8);
   const marks=h.timeline.filter(d=>d.done).length;if(settings.energy!==false&&marks>=5&&finite(h.energy)&&h.energy!==0)add(h.energy>0?21:22,'habits',key,'Энергия привычки',key+': '+marks+' выполнений с заданной оценкой '+fmt(h.energy)+'.','Это настроенная оценка, не независимые ежедневные измерения.',marks,.7);
  }
  if(settings.spheres!==false){
   const categorized=new Set(spheres.flatMap(x=>[...x.dates]));const n=categorized.size;
   if(n>=7){
    for(const x of spheres){
     const share=x.dates.size/n,vals=x.scores.filter(finite);
     if(share<=.15)add(24,'spheres',x.name,'Редкие записи',x.name+': записи в '+x.dates.size+' из '+n+' категоризированных дней.','Отсутствие записей не означает отсутствие сферы в жизни.',n,1-share,.65);
     if(settings.energy!==false&&share<=.3&&vals.filter(v=>v>0).length>=3&&mean(vals)>=3)add(27,'spheres',x.name,'Редкая ресурсная сфера',x.name+': средняя оценка '+fmt(mean(vals))+'.',vals.length+' оценок; '+x.dates.size+' дней присутствия.',n,.8);
     if(dates.length===28){const a=dates.slice(0,14).filter(d=>categorized.has(d)),b=dates.slice(14).filter(d=>categorized.has(d));if(a.length>=7&&b.length>=7){const av=a.filter(d=>x.dates.has(d)).length/a.length,bv=b.filter(d=>x.dates.has(d)).length/b.length;if(Math.abs(bv-av)>=.2)add(28,'spheres',x.name,'Изменение внимания',x.name+': доля дней с записями изменилась с '+Math.round(av*100)+'% до '+Math.round(bv*100)+'%.','Сравнение категоризированных дней двух половин цикла.',a.length+b.length,.8);}}
    }
    if(settings.energy!==false)for(const sign of [1,-1]){const x=spheres.filter(x=>x.scores.length>=3&&sum(x.scores)*sign>0).sort((a,b)=>sign*(sum(b.scores)-sum(a.scores)))[0];if(x)add(sign>0?25:26,'spheres',x.name,'Энергия сферы',x.name+': суммарный баланс '+fmt(sum(x.scores))+'.',x.scores.length+' оценок; сравнение сфер с достаточными данными.',x.scores.length,.8);}
   }
  }
  if(settings.energy!==false){
   const byDay=dates.map(d=>({d,rows:rows.filter(e=>e.date===d)})).filter(x=>x.rows.length);
   function compare(id,key,title,predicate,exclude=()=>false,eligible=()=>true){
    const a=[],b=[];for(const day of byDay){if(!eligible(day))continue;const scores=day.rows.filter(e=>!exclude(e)&&finite(e.score)).map(e=>e.score);if(scores.length)(predicate(day)?a:b).push(sum(scores));}
    if(a.length<5||b.length<5)return;const diff=mean(a)-mean(b);if(Math.abs(diff)<2)return;
    add(id===29?(diff>0?29:30):id,'links',key,title,'Средний баланс сравниваемых групп: '+fmt(mean(a))+' и '+fmt(mean(b))+'.',a.length+' и '+b.length+' оценённых дней; связь не доказывает причинность.',a.length+b.length,Math.abs(diff)/5,.95);
   }
   for(const [key,g] of groups){const match=e=>e.kind!=='habit'&&e.name.trim().toLocaleLowerCase('ru')===key;compare(29,key,g[0].name+' и энергия',d=>d.rows.some(match),match);}
   if(settings.habits!==false){const daily=new Map();for(const h of habitDetails.filter(h=>h.schedule!=='weekly'))for(const d of h.timeline){if(!d.eligible)continue;const v=daily.get(d.date)||[0,0];v[0]+=Number(d.done);v[1]++;daily.set(d.date,v);}const ratio=d=>{const v=daily.get(d.d);return v?v[0]/v[1]:null;};compare(31,'habit-ratio','Регулярность и энергия',d=>ratio(d)>=.75,e=>e.kind==='habit',d=>ratio(d)!==null&&(ratio(d)>=.75||ratio(d)<=.25));}
   if(settings.tasks!==false)compare(32,'load','Количество записей и энергия',d=>d.rows.filter(e=>e.kind==='task').length>=5,()=>false,d=>{const n=d.rows.filter(e=>e.kind==='task').length;return n>=5||(n>=1&&n<=2);});
   if(settings.spheres!==false){compare(33,'self','Время для себя и энергия',d=>d.rows.some(e=>e.sphereId==='self'),e=>e.sphereId==='self',d=>d.rows.some(e=>e.sphereId));compare(34,'diversity','Разнообразие сфер и энергия',d=>new Set(d.rows.map(e=>e.sphereId).filter(Boolean)).size>=3,()=>false,d=>{const n=new Set(d.rows.map(e=>e.sphereId).filter(Boolean)).size;return n===1||n>=3;});}
  }
  return out.sort((a,b)=>b.rank-a.rank||a.id-b.id||a.key.localeCompare(b.key));
 }
 function select(candidates,limit=5){const picked=[],keys=new Set(),counts=new Map();for(const x of candidates){const key=x.group+':'+x.key;if(keys.has(key)||(counts.get(x.group)||0)>=2)continue;keys.add(key);counts.set(x.group,(counts.get(x.group)||0)+1);picked.push(x);if(picked.length>=limit)break;}return picked;}
 return {analyze,select};
})();
if(typeof module!=='undefined')module.exports=Insights;
