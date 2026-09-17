/* Drumbook — Bewegung beim Scrollen.
 *
 * Die Klasse .reveal wird hier vergeben und nicht ins HTML geschrieben. Der
 * Grund: Steht sie im Markup, ist der Text ohne JavaScript unsichtbar — und
 * eine Seite, die ihren Inhalt hinter einer Animation versteckt, ist kaputt.
 * So bleibt ohne JavaScript einfach alles stehen, wo es hingehört.
 *
 * Wer im System weniger Bewegung eingestellt hat, wird hier gar nicht erst
 * angefasst.
 */

(function () {
    'use strict';

    var ruhig = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (ruhig || !('IntersectionObserver' in window)) return;

    var wurzel = document.documentElement;
    wurzel.classList.add('js-anim');

    // Was aufgeht, und in welchen Gruppen es versetzt einsetzt.
    var gruppen = [
        '.notice',
        '.head',
        '.problems > .problem',
        '.feature',
        '.grid > .card',
        '.flash > .flash__item',
        '.more > .more__card',
        '.privacy',
        '.teacher__split',
        '.teacher__grid > .teacher__card',
        '.anmerkung',
        '.status > .status__col',
        '.faq',
        '.final__in'
    ];

    var beobachter = new IntersectionObserver(function (eintraege) {
        eintraege.forEach(function (eintrag) {
            if (!eintrag.isIntersecting) return;
            var el = eintrag.target;
            var verzug = parseInt(el.getAttribute('data-verzug') || '0', 10);
            setTimeout(function () { el.classList.add('sichtbar'); }, verzug);
            beobachter.unobserve(el);
        });
    }, {
        // Etwas früher auslösen, damit nichts erst mitten im Bild aufgeht.
        rootMargin: '0px 0px -4% 0px',
        threshold: 0.08
    });

    var beobachtet = [];

    gruppen.forEach(function (wahl) {
        var elemente = document.querySelectorAll(wahl);
        Array.prototype.forEach.call(elemente, function (el, i) {
            // Was beim Laden schon im Bild steht, bleibt einfach da — sonst
            // blitzt der Hero beim Öffnen auf.
            if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
            el.classList.add('reveal');
            // Nur innerhalb einer Reihe versetzen, und nie länger als 240 ms.
            if (i > 0) el.setAttribute('data-verzug', String(Math.min(i * 80, 240)));
            beobachter.observe(el);
            beobachtet.push(el);
        });
    });

    // Der Hero zeigt eine laufende Session. Das Abspielen steht bewusst hier
    // und nicht als autoplay im Markup: wer weniger Bewegung eingestellt hat,
    // ist oben schon ausgestiegen und sieht das Standbild — so wie jemand
    // ganz ohne JavaScript.
    var film = document.querySelector('.phone--hero video');
    if (film) {
        film.muted = true;              // manche Browser wollen das als Eigenschaft
        var anlaufen = function () {
            var p = film.play();
            if (p && p.catch) p.catch(function () {});
        };
        anlaufen();
        // Kommt der erste Versuch zu frueh, weil noch nichts geladen ist,
        // scheitert er still. Dann eben, sobald genug da ist — sonst bliebe
        // das Standbild fuer immer stehen.
        film.addEventListener('canplay', anlaufen, { once: true });
        // Ausserhalb des Bildes anhalten. Spart Akku, und sehen kann es niemand.
        new IntersectionObserver(function (eintraege) {
            eintraege.forEach(function (e) {
                if (e.isIntersecting) { film.play(); } else { film.pause(); }
            });
        }, { threshold: 0.15 }).observe(film);
    }

    // Sicherheitsgurt. Sollte der Beobachter aus irgendeinem Grund nicht
    // auslösen — ein Browser, der sich anders verhält als erwartet, eine
    // Eigenart beim Zurückkehren aus dem Seiten-Cache —, dann darf das nicht
    // dazu führen, dass Text unsichtbar bleibt. Nach vier Sekunden wird
    // aufgedeckt, was bis dahin nicht von selbst aufgegangen ist.
    setTimeout(function () {
        beobachtet.forEach(function (el) {
            if (!el.classList.contains('sichtbar')) el.classList.add('sichtbar');
        });
    }, 4000);

    // Tiefe unter den Bühnen — nur für Browser, welche die Scroll-Zeitachse
    // von CSS noch nicht kennen (Firefox, Safari vor 26). Alle anderen
    // bekommen sie im Stylesheet, und dort läuft sie im Compositor: ruhiger,
    // als ein Scroll-Listener je sein kann. Deshalb steht hier nur der
    // Nachbau, nicht der Regelfall.
    var kenntZeitachse = window.CSS && CSS.supports &&
                         CSS.supports('animation-timeline', 'view()');
    var fotos = document.querySelectorAll('.buehne__foto');

    if (!kenntZeitachse && fotos.length) {
        var imBild = [];
        var tiefe = window.innerWidth < 620 ? 56 : 88;

        var buehnenBeobachter = new IntersectionObserver(function (eintraege) {
            eintraege.forEach(function (e) {
                var i = imBild.indexOf(e.target);
                if (e.isIntersecting && i === -1) imBild.push(e.target);
                if (!e.isIntersecting && i !== -1) imBild.splice(i, 1);
            });
            if (imBild.length) stellen();
        });
        Array.prototype.forEach.call(fotos, function (f) {
            buehnenBeobachter.observe(f);
        });

        var stelltGerade = false;
        var stellen = function () {
            var fenster = window.innerHeight;
            imBild.forEach(function (f) {
                var r = f.getBoundingClientRect();
                // -1 = Bühne steht unten am Rand, +1 = oben hinaus.
                var lauf = (fenster / 2 - (r.top + r.height / 2)) /
                           ((fenster + r.height) / 2);
                lauf = Math.max(-1, Math.min(1, lauf));
                // Dieselben zwei Bewegungen wie im Stylesheet: Weg und Zoom.
                var zoom = (1.04 - lauf * 0.04).toFixed(3);
                f.style.transform = 'translate3d(0,' + (lauf * tiefe).toFixed(1) +
                                    'px,0) scale(' + zoom + ')';
            });
            stelltGerade = false;
        };

        window.addEventListener('scroll', function () {
            if (stelltGerade || !imBild.length) return;
            stelltGerade = true;
            window.requestAnimationFrame(stellen);
        }, { passive: true });
        window.addEventListener('resize', function () {
            tiefe = window.innerWidth < 620 ? 56 : 88;
            stellen();
        }, { passive: true });
        stellen();
    }

    // Der Strich unter der Kopfzeile zeigt, wo man im Stück steht.
    var spur = document.querySelector('.nav__spur i');
    if (spur) {
        var laeuftGerade = false;
        var messen = function () {
            var hoehe = document.documentElement.scrollHeight - window.innerHeight;
            var anteil = hoehe > 0 ? (window.scrollY / hoehe) : 0;
            spur.style.width = Math.max(0, Math.min(1, anteil)) * 100 + '%';
            laeuftGerade = false;
        };
        window.addEventListener('scroll', function () {
            if (laeuftGerade) return;
            laeuftGerade = true;
            window.requestAnimationFrame(messen);
        }, { passive: true });
        messen();
    }

    // Der Zeiger über dem Notenband läuft nur, solange das Bild zu sehen ist —
    // eine Animation, die im Hintergrund weiterläuft, kostet Akku und zeigt
    // niemandem etwas.
    var band = document.querySelector('.phone--band');
    if (band) {
        new IntersectionObserver(function (eintraege) {
            eintraege.forEach(function (e) {
                band.classList.toggle('laeuft', e.isIntersecting);
            });
        }, { threshold: 0.3 }).observe(band);
    }

    // Die Uhr aus der Session läuft wirklich — aber nur im Blickfeld, und sie
    // fängt von vorn an, statt bei null stehenzubleiben.
    var uhr = document.querySelector('[data-uhr]');
    if (uhr) {
        var start = parseInt(uhr.getAttribute('data-uhr'), 10) || 888;
        var rest = start;
        var takt = null;
        var zeigen = function () {
            var m = Math.floor(rest / 60), s = rest % 60;
            uhr.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        };
        new IntersectionObserver(function (eintraege) {
            eintraege.forEach(function (e) {
                if (e.isIntersecting && !takt) {
                    takt = window.setInterval(function () {
                        rest = rest > 0 ? rest - 1 : start;
                        zeigen();
                    }, 1000);
                } else if (!e.isIntersecting && takt) {
                    window.clearInterval(takt);
                    takt = null;
                }
            });
        }, { threshold: 0.4 }).observe(uhr);
    }

    // Kommt jemand über den Zurück-Knopf zurück, ist der Zustand oft
    // eingefroren. Dann sofort alles aufdecken.
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        beobachtet.forEach(function (el) { el.classList.add('sichtbar'); });
    });
})();
