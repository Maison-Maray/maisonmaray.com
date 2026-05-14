/* =========================================================
   MAISON MARAY — envoi des formulaires (Web3Forms)
   =========================================================
   Clé d'accès Web3Forms (publique, utilisable côté client).
   Les deux formulaires (contact + investir) l'utilisent.
   Pour changer l'adresse de réception des messages :
   https://app.web3forms.com → réglages du formulaire.
   ========================================================= */
(function () {
  'use strict';

  var WEB3FORMS_ACCESS_KEY = '54a7e5a2-8b8f-4947-b5cd-da0c45477413';
  var ENDPOINT = 'https://api.web3forms.com/submit';

  var keyMissing = !WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY.indexOf('COLLER-ICI') === 0;

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

    // Calendrier : sélection du jour
    var cal = funnel.querySelector('.f-mini-cal');
    if (cal) {
      var monthLabel = cal.querySelector('.head span') ? cal.querySelector('.head span').textContent.trim() : '';
      var updateCreneau = function () {
        var day = cal.querySelector('.grid .d.sel');
        var slot = cal.querySelector('.slots button.on');
        if (creneauInput) {
          creneauInput.value = (day ? day.textContent.trim() + ' ' + monthLabel : '') +
            (slot ? ' · ' + slot.textContent.trim() : '');
        }
      };
      cal.querySelectorAll('.grid .d').forEach(function (d) {
        if (d.classList.contains('off')) return;
        d.addEventListener('click', function () {
          cal.querySelectorAll('.grid .d.sel').forEach(function (x) { x.classList.remove('sel'); });
          d.classList.add('sel');
          updateCreneau();
        });
      });
      cal.querySelectorAll('.slots button').forEach(function (b) {
        b.addEventListener('click', function () {
          cal.querySelectorAll('.slots button.on').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          updateCreneau();
        });
      });
      updateCreneau();
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
})();
