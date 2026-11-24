// Runs before app.js; never requests a real token or production storage key.
Auth.login();
DB.init('SANDBOX');
if (!localStorage.getItem('planer_test_SANDBOX_demo_seeded')) {
  const today=DB.localDate();
  const monday=DB.parseDate(today);
  monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
  const first=DB.localDate(monday);
  DB.setMeta({startDate:first});
  DB.saveTasks(1,1,[{id:101,name:'Прогулка',score:3},{id:102,name:'Долгая встреча',score:-5}]);
  DB.saveHabits([
    {id:201,name:'Читать 20 минут',sphereId:'growth',energy:3,createdOn:first,createdAt:new Date().toISOString()},
    {id:202,name:'Дыхательная практика',sphereId:'energy',energy:5,createdOn:first,createdAt:new Date().toISOString()}
  ]);
  DB.toggleCompletionByDate(201,today);
  localStorage.setItem('planer_test_SANDBOX_demo_seeded','1');
}