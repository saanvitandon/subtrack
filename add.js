/* add.js — runs on add.html */

document.addEventListener('DOMContentLoaded', function() {

  var session = requireAuth();
  if (!session) return;

  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  var SUBS_KEY   = userSubsKey(session.username);
  var NEXTID_KEY = userNextIdKey(session.username);

  function loadSubs() { try { return JSON.parse(localStorage.getItem(SUBS_KEY) || '[]'); } catch(e) { return []; } }
  function loadNid()  { try { return parseInt(localStorage.getItem(NEXTID_KEY) || '1', 10); } catch(e) { return 1; } }

  var subscriptions = loadSubs();
  var nextId        = loadNid();

  initTheme();
  updateHeaderStats(subscriptions);
  buildCatPicker('f-cat-picker', 'f-cat');

  document.getElementById('sub-form').addEventListener('submit', function(e) {
    e.preventDefault();

    var name     = document.getElementById('f-name').value.trim();
    var costStr  = document.getElementById('f-cost').value;
    var cost     = parseFloat(costStr);
    var cycle    = document.getElementById('f-cycle').value;
    var category = document.getElementById('f-cat').value;

    if (!name) { showToast('Please enter a subscription name.', true); return; }
    if (costStr === '' || isNaN(cost) || cost < 0) { showToast('Please enter a valid cost.', true); return; }

    subscriptions.push({ id: nextId, name: name, cost: cost, cycle: cycle, category: category });
    nextId++;

    localStorage.setItem(SUBS_KEY,   JSON.stringify(subscriptions));
    localStorage.setItem(NEXTID_KEY, String(nextId));

    showToast('"' + name + '" added!');
    setTimeout(function() { window.location.href = 'index.html'; }, 900);
  });

});