document.addEventListener('DOMContentLoaded', function() {

  var session = requireAuth();
  if (!session) return;

  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  var SUBS_KEY = userSubsKey(session.username);
  var subscriptions;
  try { subscriptions = JSON.parse(localStorage.getItem(SUBS_KEY) || '[]'); }
  catch(e) { subscriptions = []; }

  initTheme();
  updateHeaderStats(subscriptions);
  renderAnalytics();

  function renderAnalytics() {
    var container = document.getElementById('analytics-content');

    if (subscriptions.length === 0) {
      container.innerHTML =
        '<div class="analytics-card full">' +
          '<div class="coming-soon">' +
            '<div class="big">&#9678;</div>' +
            '<div>Add subscriptions to see analytics</div>' +
          '</div>' +
        '</div>';
      return;
    }

    var totalM = calculateTotal(subscriptions);

    // Group by category
    var byCategory = {};
    for (var i = 0; i < subscriptions.length; i++) {
      var s  = subscriptions[i];
      var mo = s.cycle === 'yearly' ? s.cost / 12 : s.cost;
      byCategory[s.category] = (byCategory[s.category] || 0) + mo;
    }
    var catKeys = Object.keys(byCategory).sort(function(a,b){ return byCategory[b]-byCategory[a]; });

    var catRows = '';
    for (var c = 0; c < catKeys.length; c++) {
      var name = catKeys[c];
      var val  = byCategory[name];
      var pct  = totalM > 0 ? (val / totalM * 100).toFixed(1) : 0;
      var cat  = getCat(name);
      catRows +=
        '<div class="breakdown-item">' +
          '<div class="breakdown-row">' +
            '<div class="breakdown-name">' +
              '<img src="' + catSvgUrl(name) + '" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;" alt="" />' +
              escapeHtml(name) +
            '</div>' +
            '<div class="breakdown-val">&#8377;' + val.toFixed(2) + '/mo</div>' +
          '</div>' +
          '<div class="breakdown-bar-track">' +
            '<div class="breakdown-bar-fill" style="width:' + pct + '%;background:' + cat.color + '"></div>' +
          '</div>' +
        '</div>';
    }

    var mSubs = [], ySubs = [], mTotal = 0, yTotal = 0;
    for (var k = 0; k < subscriptions.length; k++) {
      if (subscriptions[k].cycle === 'monthly') { mSubs.push(subscriptions[k]); mTotal += subscriptions[k].cost; }
      else { ySubs.push(subscriptions[k]); yTotal += subscriptions[k].cost; }
    }

    var planBars = '';
    for (var p = 0; p < subscriptions.length; p++) {
      var sub  = subscriptions[p];
      var mo2  = sub.cycle === 'yearly' ? sub.cost / 12 : sub.cost;
      var pct2 = totalM > 0 ? (mo2 / totalM * 100).toFixed(1) : 0;
      var cat2 = getCat(sub.category);
      planBars +=
        '<div style="margin-bottom:10px;">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
            '<span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;">' +
              '<img src="' + catSvgUrl(sub.category) + '" style="width:12px;height:12px;" alt="" />' +
              escapeHtml(sub.name) +
            '</span>' +
            '<span style="font-family:\'DM Mono\',monospace;font-size:11px;color:' + cat2.color + '">&#8377;' + mo2.toFixed(2) + '/mo</span>' +
          '</div>' +
          '<div style="height:3px;background:var(--border);border-radius:3px;overflow:hidden;">' +
            '<div style="height:100%;width:' + pct2 + '%;background:' + cat2.color + ';border-radius:3px;transition:width 0.5s;"></div>' +
          '</div>' +
        '</div>';
    }

    var mCount = mSubs.length, yCount = ySubs.length, total = subscriptions.length;

    container.innerHTML =
      '<div class="analytics-card">' +
        '<h3>Spend by Category</h3>' +
        '<div class="breakdown-list">' + catRows + '</div>' +
      '</div>' +
      '<div class="analytics-card">' +
        '<h3>Billing Cycle <span>breakdown</span></h3>' +
        '<div class="cycle-stats">' +
          '<div class="cycle-item">' +
            '<div><div class="cycle-item-label">Monthly Plans</div>' +
            '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);">' + mCount + ' subscription' + (mCount!==1?'s':'') + '</div></div>' +
            '<div class="cycle-item-val">&#8377;' + mTotal.toFixed(2) + '</div>' +
          '</div>' +
          '<div class="cycle-item">' +
            '<div><div class="cycle-item-label">Yearly Plans</div>' +
            '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);">' + yCount + ' subscription' + (yCount!==1?'s':'') + '</div></div>' +
            '<div class="cycle-item-val">&#8377;' + yTotal.toFixed(2) + '/yr</div>' +
          '</div>' +
          '<div class="cycle-item" style="border-color:rgba(200,240,74,0.3)">' +
            '<div><div class="cycle-item-label">Annual Total</div>' +
            '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);">all plans annualised</div></div>' +
            '<div class="cycle-item-val" style="color:var(--accent);">&#8377;' + (totalM*12).toFixed(2) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="analytics-card full" style="display:flex;align-items:center;gap:48px;flex-wrap:wrap;">' +
        '<div>' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Total Monthly</div>' +
          '<div style="font-size:40px;font-weight:800;letter-spacing:-2px;color:var(--accent)">&#8377;' + totalM.toFixed(2) + '</div>' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--muted);margin-top:4px;">across ' + total + ' subscription' + (total!==1?'s':'') + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:200px;">' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Per plan contribution</div>' +
          planBars +
        '</div>' +
      '</div>';
  }

});