// Independent QA authentication. No Supabase access or production device binding.
const Auth = (() => {
  const SESSION_KEY = 'planner_test_session_v1';
  const TOKEN = 'SANDBOX';
  function currentToken() { return localStorage.getItem(SESSION_KEY) === TOKEN ? TOKEN : null; }
  function login() { localStorage.setItem(SESSION_KEY, TOKEN); return Promise.resolve({ok:true}); }
  function logout() { localStorage.removeItem(SESSION_KEY); }
  function verify() { return Promise.resolve('skip'); }
  function unlinkDevice() { logout(); return Promise.resolve({ok:true}); }
  return {currentToken, login, logout, verify, unlinkDevice,
    isLoggedIn:()=>Boolean(currentToken()), getDeviceId:()=> 'sandbox-only'};
})();