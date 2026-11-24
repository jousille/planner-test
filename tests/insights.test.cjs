const {test}=require('node:test');const assert=require('node:assert/strict');const I=require('../js/insights.js');
const dates=Array.from({length:28},(_,i)=>String(i+1).padStart(2,'0'));
const entries=(values,name='Прогулка',kind='task')=>values.map((score,i)=>({date:dates[i],name,kind,score}));
test('stable positive and negative, missing and zero are distinct',()=>{const r=I.analyze({dates,entries:[...entries([2,2,2,null,0,0]),...entries([-3,-3,-3],'Работа')]});assert(!r.some(x=>x.id===1));assert(r.some(x=>x.id===2));assert(I.analyze({dates,entries:entries([2,2,2,null])}).some(x=>x.id===1));});
test('same day duplicates cannot establish stable source',()=>{assert(!I.analyze({dates,entries:entries([2,2,2]).map(e=>({...e,date:dates[0]}))}).some(x=>x.id===1));});
test('configured habit energy is not repeated independent ratings',()=>{assert(!I.analyze({dates,entries:entries([2,2,2],'Чтение','habit')}).some(x=>x.id===1));});
test('disabled energy and tasks suppress sources',()=>{for(const settings of [{energy:false},{tasks:false}])assert.equal(I.analyze({dates,entries:entries([2,2,2]),settings}).length,0);});
test('trend requires full halves and seven rated days each',()=>{const e=entries([...Array(14).fill(-2),...Array(14).fill(3)]);assert(I.analyze({dates,entries:e}).some(x=>x.id===9));assert(!I.analyze({dates:dates.slice(0,21),entries:e}).some(x=>x.id===9));});
test('missing days break negative streaks',()=>{assert(!I.analyze({dates,entries:entries([-1,-1,null,-1,-1,null,-1,-1])}).some(x=>x.id===14));assert(I.analyze({dates,entries:entries([-1,-1,-1,null,-1,-1,-1])}).some(x=>x.id===14));});
test('selection deduplicates and limits group',()=>{const r=I.select(Array.from({length:8},(_,i)=>({group:'sources',key:String(i%4)})));assert.equal(r.length,2);});

test('sphere absence is not life absence and disabled spheres suppress rules',()=>{const spheres=[{name:'Дом',dates:new Set(dates.slice(0,8)),scores:[2,2,2]},{name:'Работа',dates:new Set(),scores:[]}];assert(I.analyze({dates,spheres}).some(x=>x.id===24));assert(!I.analyze({dates,spheres,settings:{spheres:false}}).some(x=>x.id===24));});
test('links exclude activity own score',()=>{const e=[...entries(Array(10).fill(1),'Other'),...entries(Array(5).fill(10),'Walk')];assert(!I.analyze({dates,entries:e}).some(x=>x.id===29));});
