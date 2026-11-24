/* Pure local analytics. No storage or network. */
const Insights = (() => {
 const sum=a=>a.reduce((s,n)=>s+n,0), mean=a=>sum(a)/a.length, fmt=n=>(n>0?'+':n<0?'−':'')+Math.abs(Math.round(n*10)/10).toLocaleString('ru-RU');
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 function analyze({entries=[],dates=[],settings={},habits=[],spheres=[]}){
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
  return out.sort((a,b)=>b.rank-a.rank||a.id-b.id||a.key.localeCompare(b.key));
 }
 function select(candidates,limit=5){const picked=[],keys=new Set(),counts=new Map();for(const x of candidates){const key=x.group+':'+x.key;if(keys.has(key)||(counts.get(x.group)||0)>=2)continue;keys.add(key);counts.set(x.group,(counts.get(x.group)||0)+1);picked.push(x);if(picked.length>=limit)break;}return picked;}
 return {analyze,select};
})();
if(typeof module!=='undefined')module.exports=Insights;
