/* Drumbook — das Formular für die Warteliste.
 *
 * Schickt die Eintragung an eine Google-Apps-Script-Web-App. Zwei Dinge sind
 * dabei nicht offensichtlich:
 *
 * 1. Der Inhaltstyp ist text/plain, obwohl JSON im Rumpf steht. Mit
 *    application/json schickt der Browser vorab eine OPTIONS-Anfrage —
 *    die beantwortet Apps Script nicht, und dann scheitert alles an CORS,
 *    bevor das Skript überhaupt läuft.
 *
 * 2. Das Formular ist versteckt, bis hier ein gültiger Endpunkt gefunden
 *    wurde. Solange in data-endpoint noch der Platzhalter steht, bleibt es
 *    beim Mailweg — besser ein schlichter Knopf als ein Formular, das ins
 *    Leere läuft.
 */

(function () {
    'use strict';

    var form = document.querySelector('.form--js');
    if (!form) return;

    var endpunkt = form.getAttribute('data-endpoint') || '';
    if (endpunkt.indexOf('https://script.google.com/') !== 0) return;

    // Ab hier: Formular zeigen, Mailweg ausblenden.
    document.documentElement.classList.add('formular-bereit');

    var status = form.querySelector('.form__status');
    var knopf = form.querySelector('button[type="submit"]');
    var feldEmail = form.querySelector('[name="email"]');
    var sprache = document.documentElement.lang === 'en' ? 'en' : 'de';

    var texte = {
        de: {
            laeuft:  'Wird gesendet …',
            knopf:   knopf ? knopf.textContent.trim() : 'Eintragen',
            email:   'Bitte trag eine E-Mail-Adresse ein, an die ich schreiben kann.',
            haken:   'Ohne den Haken darf ich deine Adresse nicht speichern.',
            fehler:  'Das hat gerade nicht geklappt. Schreib mir stattdessen an ' +
                     '<a href="mailto:silvio@drumbook.de">silvio@drumbook.de</a>.',
            danke:   'Danke — du stehst auf der Liste.',
            zusatz:  'Du hörst wieder von mir, wenn Drumbook zum Ausprobieren bereitsteht.'
        },
        en: {
            laeuft:  'Sending …',
            knopf:   knopf ? knopf.textContent.trim() : 'Sign up',
            email:   'Please enter an email address I can write to.',
            haken:   'Without the tick I am not allowed to store your address.',
            fehler:  'That did not work just now. Write to ' +
                     '<a href="mailto:silvio@drumbook.de">silvio@drumbook.de</a> instead.',
            danke:   'Thanks — you are on the list.',
            zusatz:  'You will hear from me when Drumbook is ready to try.'
        }
    }[sprache];

    function melden(zustand, html) {
        if (!status) return;
        status.innerHTML = html;
        status.setAttribute('data-state', zustand);
    }

    form.addEventListener('submit', function (ereignis) {
        ereignis.preventDefault();

        var daten = new FormData(form);
        var email = (daten.get('email') || '').toString().trim();
        var einwilligung = form.querySelector('[name="einwilligung"]').checked;

        if (!email || !feldEmail.checkValidity()) {
            feldEmail.setAttribute('aria-invalid', 'true');
            feldEmail.focus();
            melden('fehler', texte.email);
            return;
        }
        feldEmail.removeAttribute('aria-invalid');

        if (!einwilligung) {
            melden('fehler', texte.haken);
            return;
        }

        if (knopf) {
            knopf.disabled = true;
            knopf.textContent = texte.laeuft;
        }
        melden(null, '');
        if (status) status.removeAttribute('data-state');

        fetch(endpunkt, {
            method: 'POST',
            // Siehe Kommentar oben — text/plain ist hier kein Versehen.
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                email:        email,
                name:         (daten.get('name') || '').toString().trim(),
                nachricht:    (daten.get('nachricht') || '').toString().trim(),
                website:      (daten.get('website') || '').toString(),  // Honigtopf
                einwilligung: true,
                sprache:      sprache
            })
        })
        .then(function (antwort) { return antwort.json(); })
        .then(function (ergebnis) {
            if (!ergebnis || !ergebnis.ok) {
                throw new Error(ergebnis && ergebnis.meldung ? ergebnis.meldung : 'abgelehnt');
            }
            form.setAttribute('data-fertig', '');
            melden('ok', '<strong>' + (ergebnis.meldung || texte.danke) + '</strong><br>' + texte.zusatz);
        })
        .catch(function () {
            melden('fehler', texte.fehler);
            if (knopf) {
                knopf.disabled = false;
                knopf.textContent = texte.knopf;
            }
        });
    });
})();
