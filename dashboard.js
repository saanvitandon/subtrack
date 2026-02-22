document.addEventListener('DOMContentLoaded', function() {

  var session = requireAuth();
  if (!session) return; // requireAuth redirects to login.html if no session

  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  var pageSub = document.querySelector('.header-left p');
  if (pageSub) pageSub.textContent = 'Hello, ' + session.username + ' 👋';

  var SUBS_KEY   = userSubsKey(session.username);
  var NEXTID_KEY = userNextIdKey(session.username);

  function loadSubs()   { try { return JSON.parse(localStorage.getItem(SUBS_KEY) || '[]'); } catch(e) { return []; } }
  function loadNid()    { try { return parseInt(localStorage.getItem(NEXTID_KEY) || '1', 10); } catch(e) { return 1; } }
  function saveSubs(s, n) { localStorage.setItem(SUBS_KEY, JSON.stringify(s)); localStorage.setItem(NEXTID_KEY, String(n)); }

  var subscriptions = loadSubs();
  var nextId        = loadNid();

  initTheme();
  updateHeaderStats(subscriptions);
  renderCards();
  buildCatPicker('edit-cat-picker', 'edit-cat');

  /* ── Render cards ── */
  function renderCards() {
    var container  = document.getElementById('cards-container');
    var countLabel = document.getElementById('dash-count-label');
    container.innerHTML = '';
    var count = subscriptions.length;
    if (countLabel) countLabel.textContent = count === 1 ? '1 service' : count + ' services';

    if (count === 0) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="big">&#8709;</div>' +
          '<p>No subscriptions yet. <a href="add.html" style="color:var(--accent)">Add one</a> to get started.</p>' +
        '</div>';
      return;
    }

    for (var i = 0; i < subscriptions.length; i++) {
      (function(sub) {
        var cat        = getCat(sub.category);
        var badgeClass = sub.cycle === 'yearly' ? 'badge-yearly' : 'badge-monthly';
        var cycleLabel = sub.cycle === 'yearly'
          ? '&asymp; &#8377;' + (sub.cost / 12).toFixed(2) + '/mo'
          : 'per month';

        var card = document.createElement('div');
        card.className = 'sub-card';
        card.dataset.id = sub.id;
        card.style.setProperty('--accent', cat.color);

        card.innerHTML =
          '<div class="card-top">' +
            '<div>' +
              '<div class="card-name">' + escapeHtml(sub.name) + '</div>' +
              '<div class="card-category">' +
                '<img class="cat-icon-img" src="' + catSvgUrl(sub.category) + '" alt="" />' +
                escapeHtml(sub.category) +
              '</div>' +
            '</div>' +
            '<div class="card-badge ' + badgeClass + '">' + sub.cycle + '</div>' +
          '</div>' +
          '<div class="card-bottom">' +
            '<div>' +
              '<div class="card-cost-label">Cost</div>' +
              '<div class="card-cost">&#8377;' + parseFloat(sub.cost).toFixed(2) + '</div>' +
              '<div class="card-cost-cycle">' + cycleLabel + '</div>' +
            '</div>' +
            '<div class="card-actions">' +
              '<button class="edit-btn"   data-id="' + sub.id + '" title="Edit">&#9998;</button>' +
              '<button class="delete-btn" data-id="' + sub.id + '" title="Delete">&#x2715;</button>' +
            '</div>' +
          '</div>';

        container.appendChild(card);
      })(subscriptions[i]);
    }

    var editBtns = container.querySelectorAll('.edit-btn');
    for (var e = 0; e < editBtns.length; e++) {
      editBtns[e].addEventListener('click', function() { openEditForm(parseInt(this.dataset.id, 10)); });
    }
    var delBtns = container.querySelectorAll('.delete-btn');
    for (var d = 0; d < delBtns.length; d++) {
      delBtns[d].addEventListener('click', function() { deleteSub(parseInt(this.dataset.id, 10)); });
    }
  }

  function deleteSub(id) {
    var target = null;
    for (var i = 0; i < subscriptions.length; i++) {
      if (subscriptions[i].id === id) { target = subscriptions[i]; break; }
    }
    subscriptions = subscriptions.filter(function(s) { return s.id !== id; });
    saveSubs(subscriptions, nextId);
    updateHeaderStats(subscriptions);
    renderCards();
    if (target) showToast('"' + target.name + '" removed.');
  }

  function openEditForm(id) {
    var sub = null;
    for (var i = 0; i < subscriptions.length; i++) {
      if (subscriptions[i].id === id) { sub = subscriptions[i]; break; }
    }
    if (!sub) return;
    document.getElementById('edit-id').value    = sub.id;
    document.getElementById('edit-name').value  = sub.name;
    document.getElementById('edit-cost').value  = sub.cost;
    document.getElementById('edit-cycle').value = sub.cycle;
    setCatPicker('edit-cat-picker', 'edit-cat', sub.category);
    document.getElementById('edit-overlay').style.display = 'flex';
  }

  function closeEditForm() {
    document.getElementById('edit-overlay').style.display = 'none';
  }

  document.getElementById('edit-close-btn').addEventListener('click', closeEditForm);
  document.getElementById('edit-overlay').addEventListener('click', function(e) { if (e.target === this) closeEditForm(); });

  document.getElementById('edit-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var id       = parseInt(document.getElementById('edit-id').value, 10);
    var name     = document.getElementById('edit-name').value.trim();
    var costStr  = document.getElementById('edit-cost').value;
    var cost     = parseFloat(costStr);
    var cycle    = document.getElementById('edit-cycle').value;
    var category = document.getElementById('edit-cat').value;

    if (!name) { showToast('Please enter a name.', true); return; }
    if (costStr === '' || isNaN(cost) || cost < 0) { showToast('Please enter a valid cost.', true); return; }

    for (var i = 0; i < subscriptions.length; i++) {
      if (subscriptions[i].id === id) {
        subscriptions[i] = { id: id, name: name, cost: cost, cycle: cycle, category: category };
        break;
      }
    }
    saveSubs(subscriptions, nextId);
    updateHeaderStats(subscriptions);
    renderCards();
    closeEditForm();
    showToast('"' + name + '" updated!');
  });

});