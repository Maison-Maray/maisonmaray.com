/* =========================================================
   MAISON MARAY — formulaires (Web3Forms) + calendriers
   =========================================================
   Clé d'accès Web3Forms (publique, utilisable côté client).
   Les deux formulaires (contact + investir) l'utilisent.
   Pour changer l'adresse de réception des messages :
   https://app.web3forms.com → réglages du formulaire.

   Le calendrier est généré dynamiquement (mois courant + 2),
   via une seule fonction `initCalendar` appliquée à tout
   élément [data-cal] — funnel de contact.html ET home.
   ========================================================= */
(function () {
  'use strict';

  var WEB3FORMS_ACCESS_KEY = '54a7e5a2-8b8f-4947-b5cd-da0c45477413';
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var keyMissing = !WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY.indexOf('COLLER-ICI') === 0;

  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Envoie un FormData à Web3Forms, renvoie une Promise<{success, message}>
  function send(formData) {
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData
    }).then(function (r) { return r.json(); });
  }

  // Affiche un message d'état sous le formulaire
  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.dataset.kind = kind || '';
    el.style.display = text ? 'block' : 'none';
  }

  /* ---------------------------------------------------------
     Calendrier dynamique réutilisable
     Mois courant + 2 mois suivants, week-ends et jours passés
     désactivés, aucune présélection. S'applique à tout [data-cal]
     contenant [data-cal-grid] / [data-cal-label] et, en option,
     [data-cal-prev] / [data-cal-next] / [data-cal-slots].
     --------------------------------------------------------- */
  function initCalendar(cal, opts) {
    opts = opts || {};
    var grid = cal.querySelector('[data-cal-grid]');
    var label = cal.querySelector('[data-cal-label]');
    var prevBtn = cal.querySelector('[data-cal-prev]');
    var nextBtn = cal.querySelector('[data-cal-next]');
    var slotBtns = [].slice.call(cal.querySelectorAll('[data-cal-slots] button'));
    if (!grid || !label) return null;

    var MAX_OFFSET = 2;
    var offset = 0;
    var selected = null; // { y, m, d }
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    function selectionInfo() {
      var slotBtn = cal.querySelector('[data-cal-slots] button.on');
      var slot = slotBtn ? slotBtn.textContent.trim() : null;
      if (!selected) return { date: null, slot: slot, text: '' };
      var dt = new Date(selected.y, selected.m, selected.d);
      var txt = dt.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      return { date: dt, slot: slot, text: txt + (slot ? ' · ' + slot : '') };
    }

    function emitChange() {
      if (opts.onChange) opts.onChange(selectionInfo());
    }

    function render() {
      var base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      var y = base.getFullYear();
      var m = base.getMonth();
      label.textContent = MOIS[m].charAt(0).toUpperCase() + MOIS[m].slice(1) + ' ' + y;
      if (prevBtn) prevBtn.disabled = offset <= 0;
      if (nextBtn) nextBtn.disabled = offset >= MAX_OFFSET;

      grid.innerHTML = '';
      JOURS.forEach(function (j) {
        var h = document.createElement('span');
        h.className = 'dow';
        h.textContent = j;
        grid.appendChild(h);
      });
      // décalage lundi = 0
      var firstDow = (base.getDay() + 6) % 7;
      for (var i = 0; i < firstDow; i++) grid.appendChild(document.createElement('span'));
      var daysInMonth = new Date(y, m + 1, 0).getDate();
      for (var day = 1; day <= daysInMonth; day++) {
        var cell = document.createElement('span');
        cell.className = 'd';
        cell.textContent = day;
        var date = new Date(y, m, day);
        var wd = date.getDay();
        if (date < today || wd === 0 || wd === 6) {
          cell.classList.add('off');
        } else {
          cell.dataset.day = day;
          if (selected && selected.y === y && selected.m === m && selected.d === day) {
            cell.classList.add('sel');
          }
        }
        grid.appendChild(cell);
      }
    }

    grid.addEventListener('click', function (e) {
      var cell = e.target.closest('.d');
      if (!cell || !cell.dataset.day) return;
      var base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      selected = { y: base.getFullYear(), m: base.getMonth(), d: parseInt(cell.dataset.day, 10) };
      grid.querySelectorAll('.d.sel').forEach(function (x) { x.classList.remove('sel'); });
      cell.classList.add('sel');
      emitChange();
    });

    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (offset > 0) { offset--; render(); }
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (offset < MAX_OFFSET) { offset++; render(); }
    });

    slotBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        slotBtns.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        emitChange();
      });
    });

    render();

    return {
      getSelection: selectionInfo,
      // Pré-sélectionne une date (Date) + un créneau (string) — sert à
      // reprendre dans le funnel le choix fait sur le calendrier de la home.
      setSelection: function (dateObj, slotStr) {
        if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
          var dd = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
          var monthsDiff = (dd.getFullYear() - today.getFullYear()) * 12 +
            (dd.getMonth() - today.getMonth());
          if (dd >= today && monthsDiff >= 0 && monthsDiff <= MAX_OFFSET) {
            offset = monthsDiff;
            selected = { y: dd.getFullYear(), m: dd.getMonth(), d: dd.getDate() };
            render();
          }
        }
        if (slotStr) {
          slotBtns.forEach(function (x) {
            x.classList.toggle('on', x.textContent.trim() === slotStr);
          });
        }
        emitChange();
      }
    };
  }

  /* ---------------------------------------------------------
     1. Formulaire « dossier » — investir.html
     --------------------------------------------------------- */
  var invForm = document.querySelector('.inv-form');
  if (invForm) {
    var invStatus = invForm.querySelector('[data-form-status]');
    invForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (invForm.querySelector('[name="botcheck"]') && invForm.querySelector('[name="botcheck"]').checked) return;

      var btn = invForm.querySelector('button[type="submit"]');
      var label = btn ? btn.innerHTML : '';

      if (keyMissing) {
        setStatus(invStatus, 'Configuration en cours — clé Web3Forms manquante.', 'error');
        return;
      }

      if (btn) { btn.disabled = true; btn.innerHTML = 'Envoi…'; }
      setStatus(invStatus, '', '');

      send(new FormData(invForm))
        .then(function (res) {
          if (res.success) {
            invForm.reset();
            setStatus(invStatus, 'Merci. Nous revenons vers vous sous 24 h.', 'ok');
          } else {
            setStatus(invStatus, "L'envoi a échoué. Écrivez-nous à contact@maisonmaray.com.", 'error');
          }
        })
        .catch(function () {
          setStatus(invStatus, "L'envoi a échoué. Écrivez-nous à contact@maisonmaray.com.", 'error');
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
        });
    });
  }

  /* ---------------------------------------------------------
     2. Funnel 3 étapes — contact.html
     --------------------------------------------------------- */
  var funnel = document.querySelector('[data-funnel]');
  if (funnel) {
    var creneauInput = funnel.querySelector('[name="creneau"]');
    var funnelCal = funnel.querySelector('[data-cal]');
    var calApi = funnelCal ? initCalendar(funnelCal, {
      onChange: function (sel) {
        if (creneauInput) creneauInput.value = sel.text;
      }
    }) : null;

    // Reprise du choix fait depuis le calendrier de la home (index.html)
    if (calApi) {
      var params = new URLSearchParams(location.search);
      var dateParam = params.get('date');
      var heureParam = params.get('heure');
      var parts = dateParam ? dateParam.split('-') : [];
      if (parts.length === 3) {
        calApi.setSelection(new Date(+parts[0], +parts[1] - 1, +parts[2]), heureParam);
        // L'utilisateur a déjà choisi son créneau → avancer jusqu'à l'étape 3.
        // On déclenche les vrais boutons « Continuer » pour rester en phase
        // avec la navigation gérée dans site.js.
        var nextNav = funnel.querySelector('[data-next]');
        if (nextNav) { nextNav.click(); nextNav.click(); }
      }
    }

    var funnelStatus = funnel.querySelector('[data-form-status]');

    funnel.addEventListener('submit', function (e) {
      e.preventDefault();
      if (funnel.querySelector('[name="botcheck"]') && funnel.querySelector('[name="botcheck"]').checked) return;

      var submitBtn = funnel.querySelector('button[type="submit"]');
      var label = submitBtn ? submitBtn.innerHTML : '';

      var showDone = function () {
        funnel.querySelectorAll('.f-step').forEach(function (s) { s.classList.remove('on'); });
        var done = document.getElementById('f-done');
        if (done) done.classList.add('on');
        funnel.querySelectorAll('.f-dot').forEach(function (d) { d.classList.add('on'); });
      };

      if (keyMissing) {
        setStatus(funnelStatus, 'Configuration en cours — clé Web3Forms manquante.', 'error');
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Envoi…'; }
      setStatus(funnelStatus, '', '');

      // Consolide les cases cochées en un seul champ lisible
      var fd = new FormData(funnel);
      var besoins = fd.getAll('besoins');
      fd.delete('besoins');
      fd.append('Projet', besoins.length ? besoins.join(', ') : '—');

      send(fd)
        .then(function (res) {
          if (res.success) {
            showDone();
          } else {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = label; }
            setStatus(funnelStatus, "L'envoi a échoué. Écrivez-nous à contact@maisonmaray.com.", 'error');
          }
        })
        .catch(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = label; }
          setStatus(funnelStatus, "L'envoi a échoué. Écrivez-nous à contact@maisonmaray.com.", 'error');
        });
    });
  }

  /* ---------------------------------------------------------
     3. Calendriers autonomes (home) — renvoient vers le funnel
        de contact.html avec le créneau choisi pré-rempli.
     --------------------------------------------------------- */
  document.querySelectorAll('[data-cal]').forEach(function (cal) {
    if (cal.closest('[data-funnel]')) return; // déjà géré par le funnel
    var confirmBtn = cal.querySelector('[data-cal-confirm]');
    var api = initCalendar(cal, {});
    if (!api || !confirmBtn) return;
    confirmBtn.addEventListener('click', function () {
      var sel = api.getSelection();
      var url = 'contact.html';
      if (sel.date) {
        var mo = ('0' + (sel.date.getMonth() + 1)).slice(-2);
        var da = ('0' + sel.date.getDate()).slice(-2);
        url += '?date=' + sel.date.getFullYear() + '-' + mo + '-' + da;
        if (sel.slot) url += '&heure=' + encodeURIComponent(sel.slot);
      }
      location.href = url;
    });
  });
})();
