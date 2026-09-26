/*
 * Kopiert den Text einer Vorlage in die Zwischenablage (#241).
 *
 *   <button data-kopiere="elterntext" data-kopiert="Kopiert"
 *           data-markiert="Markiert, jetzt kopieren">Text kopieren</button>
 *
 * Kopiert werden die Absätze der Vorlage, getrennt durch eine Leerzeile, ohne
 * die Zeilenumbrüche aus dem HTML. Wo der Browser die Zwischenablage nicht
 * freigibt, wird der Text markiert, damit er sich von Hand kopieren lässt.
 */
(function () {
    function markiere(quelle) {
        var bereich = document.createRange();
        bereich.selectNodeContents(quelle);
        var auswahl = window.getSelection();
        auswahl.removeAllRanges();
        auswahl.addRange(bereich);
    }

    document.addEventListener('click', function (e) {
        var knopf = e.target.closest('[data-kopiere]');
        if (!knopf) return;
        var quelle = document.getElementById(knopf.getAttribute('data-kopiere'));
        if (!quelle) return;

        var text = Array.prototype.map.call(quelle.querySelectorAll('p'), function (p) {
            return p.textContent.replace(/\s+/g, ' ').trim();
        }).join('\n\n');

        var vorher = knopf.textContent;
        function melde(meldung) {
            knopf.textContent = meldung;
            setTimeout(function () { knopf.textContent = vorher; }, 2400);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                melde(knopf.getAttribute('data-kopiert'));
            }, function () {
                markiere(quelle);
                melde(knopf.getAttribute('data-markiert'));
            });
        } else {
            markiere(quelle);
            melde(knopf.getAttribute('data-markiert'));
        }
    });
})();
