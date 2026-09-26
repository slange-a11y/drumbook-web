/*
 * Drumbook zum Ausprobieren (/ausprobieren/, /en/try/, #247).
 *
 * Fuenf Kapitel, gebaut aus echten Aufnahmen der App (Simulator, Demo-Daten)
 * und aus zwei nachgebauten Bildschirmen, die sich bewegen und klingen: der
 * Session und dem Notenband. Die Texte je Sprache stehen in window.DEMO auf
 * der jeweiligen Seite.
 *
 * Der Klick ist derselbe wie in der App: ein Sinus mit schnellem Abfall und
 * einem kurzen Anschlag, 1800 Hz auf der Eins, sonst 1200 Hz, 45 ms lang
 * (MetronomeEngine.renderClick). Er entsteht im Browser; die Seite laedt
 * nichts nach, setzt kein Cookie und speichert nichts.
 *
 * Taktgenau ueber das Vorausplanen auf der Uhr des AudioContext: Ein Timer
 * alle 25 ms legt die Schlaege der naechsten 120 ms fest („A Tale of Two
 * Clocks", web.dev). Die Anzeige folgt ueber requestAnimationFrame.
 */
(function () {
    "use strict";

    var D = window.DEMO;
    if (!D) return;
    var $ = function (id) { return document.getElementById(id); };

    // ------------------------------------------------------------ Ton

    var ctx = null, puffer = {};

    function audio() {
        if (!ctx) {
            // Ab iOS 16.4: Ton auch bei eingeschaltetem Stummschalter, wie in der App.
            try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            puffer.betont = klickPuffer(1800, 0.95);
            puffer.normal = klickPuffer(1200, 0.8);
        }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
    }

    function klickPuffer(frequenz, lautstaerke) {
        var rate = ctx.sampleRate, dauer = 0.045;
        var laenge = Math.round(dauer * rate);
        var b = ctx.createBuffer(1, laenge, rate), d = b.getChannelData(0);
        var abfall = dauer / 2.6, schritt = 2 * Math.PI * frequenz / rate;
        for (var i = 0; i < laenge; i++) {
            var v = Math.sin(schritt * i) * Math.exp(-(i / rate) / abfall);
            if (i < 40) v += (1 - i / 40) * 0.35 * (i % 2 === 0 ? 1 : -1);
            d[i] = Math.max(-1, Math.min(1, v * lautstaerke));
        }
        return b;
    }

    var takt = { laeuft: false, bpm: 70, nr: 0, naechster: 0, timer: null, schlange: [], beiSchlag: null };

    function taktStart(bpm, vorzaehler, beiSchlag) {
        if (!audio()) return false;
        taktStopp();
        takt.bpm = bpm;
        takt.nr = -vorzaehler;
        takt.naechster = ctx.currentTime + 0.15;
        takt.beiSchlag = beiSchlag;
        takt.laeuft = true;
        takt.timer = setInterval(planen, 25);
        planen();
        requestAnimationFrame(taktSchleife);
        // Gibt der Browser den Ton nicht frei, steht die Uhr des AudioContext
        // still: Der Knopf zeigte „Anhalten", aber nichts bewegte sich. Dann
        // lieber anhalten und sagen, was zu tun ist.
        var start = ctx.currentTime;
        setTimeout(function () {
            if (takt.laeuft && ctx.currentTime === start) {
                taktStopp();
                if (window.DEMO_TON_GESPERRT) window.DEMO_TON_GESPERRT();
            }
        }, 900);
        return true;
    }

    function planen() {
        while (takt.naechster < ctx.currentTime + 0.12) {
            var imTakt = ((takt.nr % 4) + 4) % 4;
            var q = ctx.createBufferSource();
            q.buffer = imTakt === 0 ? puffer.betont : puffer.normal;
            q.connect(ctx.destination);
            q.start(takt.naechster);
            takt.schlange.push({ zeit: takt.naechster, nr: takt.nr, quelle: q });
            takt.naechster += 60 / takt.bpm;
            takt.nr++;
        }
    }

    function taktSchleife() {
        if (!takt.laeuft) return;
        var jetzt = ctx.currentTime, aktuell = null;
        while (takt.schlange.length && takt.schlange[0].zeit <= jetzt) aktuell = takt.schlange.shift();
        if (aktuell && takt.beiSchlag) takt.beiSchlag(aktuell.nr);
        if (takt.laeuft) requestAnimationFrame(taktSchleife);
    }

    function taktStopp() {
        if (!takt.laeuft) return;
        takt.laeuft = false;
        clearInterval(takt.timer);
        // Was schon geplant ist, aber noch nicht erklungen, wieder abbestellen.
        takt.schlange.forEach(function (s) { try { s.quelle.stop(); } catch (e) {} });
        takt.schlange = [];
    }

    // ------------------------------------------------------------ Hinweise

    var schirm = $("demo-schirm");
    var blaseEl = $("blase");
    var zeitgeber = [];

    function spaeter(fn, ms) { zeitgeber.push(setTimeout(fn, ms)); }
    function aufraeumen() { zeitgeber.forEach(clearTimeout); zeitgeber = []; }

    /* ort: { oben: y } setzt die Blase mit ihrer Oberkante auf y Prozent und
       den Pfeil nach oben; { unten: y } setzt ihre Unterkante auf y Prozent
       und den Pfeil nach unten. pfeil: x Prozent des Bildschirms, oder weg. */
    function blase(text, ort, pfeil) {
        if (!text) { blaseEl.hidden = true; return; }
        blaseEl.textContent = text;
        blaseEl.className = "blase";
        blaseEl.style.top = ort.oben != null ? ort.oben + "%" : "auto";
        blaseEl.style.bottom = ort.unten != null ? (100 - ort.unten) + "%" : "auto";
        if (pfeil != null) {
            blaseEl.classList.add(ort.oben != null ? "oben" : "unten");
            blaseEl.style.setProperty("--pfeil", ((pfeil - 7) / 86 * 100) + "%");
        }
        blaseEl.hidden = false;
    }

    function jetzt(text) { $("kapitel-text").textContent = text; }

    // ------------------------------------------------------------ Szenen

    var szenen = {
        bild: $("sz-bild"), session: $("sz-session"), abschluss: $("sz-abschluss"),
        erinnerung: $("sz-erinnerung"), noten: $("sz-noten")
    };
    var kapitelVon = { frage: 0, angebot: 0, session: 1, abschluss: 1, erinnerung: 1,
                       heute: 2, noten: 3, auswahl: 4, bericht: 4 };
    var ersteSzene = ["frage", "session", "heute", "noten", "auswahl"];
    var aktuell = null, fertig = {}, besucht = {};

    function zeige(name) { for (var k in szenen) szenen[k].hidden = (k !== name); }

    function gehe(name, zusatz) {
        aufraeumen();
        taktStopp();
        sessionUhrStopp();
        blase(null);
        if (aktuell && kapitelVon[name] > kapitelVon[aktuell]) fertig[kapitelVon[aktuell]] = true;
        aktuell = name;
        besucht[name] = true;
        var k = kapitelVon[name];
        steuerung(k);
        Array.prototype.forEach.call(document.querySelectorAll("#kapitel-liste li"), function (li) {
            var n = +li.getAttribute("data-kapitel");
            if (n === k) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
            li.classList.toggle("fertig", !!fertig[n] && n !== k);
        });
        jetzt(D.jetzt[name]);
        if (bilder[name]) bildSzene(name, zusatz);
        else if (name === "session") sessionBetreten();
        else if (name === "abschluss") abschlussBetreten();
        else if (name === "erinnerung") erinnerungBetreten();
        else if (name === "noten") notenBetreten();
    }

    // ------------------------------------------------------------ Aufnahmen

    /* Flaechen in Prozent des Bildschirms (402 x 874 Punkt), gemessen an den
       Aufnahmen aus dem Simulator. */
    var bilder = {
        frage: {
            flaechen: [
                { x: 6, y: 78.3, w: 88, h: 5.8, name: D.namen.ja, zu: "angebot" },
                { x: 6, y: 85.3, w: 88, h: 5.8, name: D.namen.nein, zu: "angebot", zeigen: true }
            ],
            blase: { oben: 11 }
        },
        angebot: {
            flaechen: [
                { x: 6, y: 78.3, w: 88, h: 5.8, name: D.namen.fuenf, zu: "session", zeigen: true },
                { x: 6, y: 85.3, w: 88, h: 5.8, name: D.namen.umschauen, zu: "heute", zusatz: "umschauen" }
            ],
            blase: { oben: 11 }
        },
        heute: {
            flaechen: [
                { x: 4, y: 19.2, w: 92, h: 15.3, name: D.namen.karte, zeigen: true,
                  blase: { text: D.blasen.karte, oben: 35.5, pfeil: 50 }, danach: "setlists" },
                { x: 4, y: 39.8, w: 92, h: 4.6, name: D.namen.ueben,
                  blase: { text: D.blasen.ueben, oben: 45, pfeil: 30 } },
                { id: "setlists", x: 24, y: 91.6, w: 15, h: 6.6, name: D.namen.setlists, zu: "noten" },
                { id: "verlauf", x: 77, y: 91.6, w: 16, h: 6.6, name: D.namen.verlauf, zu: "auswahl" },
                // Die uebrigen Reiter gibt es in der Demo nicht. Ohne Antwort
                // saehe ein Tipper darauf aus, als haenge die Seite.
                { x: 6, y: 91.6, w: 16, h: 6.6, name: D.namen.heuteReiter, blase: { text: D.blasen.reiter, unten: 90, pfeil: 50 } },
                { x: 41, y: 91.6, w: 16, h: 6.6, name: D.namen.bibliothek, blase: { text: D.blasen.reiter, unten: 90, pfeil: 50 } },
                { x: 59, y: 91.6, w: 16, h: 6.6, name: D.namen.unterricht, blase: { text: D.blasen.reiter, unten: 90, pfeil: 50 } }
            ],
            blase: { oben: 35.5, pfeil: 50 }
        },
        auswahl: {
            flaechen: [
                { x: 5, y: 88.9, w: 90, h: 6.4, name: D.namen.erstellen, zu: "bericht", zeigen: true }
            ],
            blase: { unten: 87.5, pfeil: 50 }
        },
        bericht: {
            flaechen: [
                { x: 82.5, y: 8.9, w: 15, h: 7.4, name: D.namen.teilen, zeigen: true,
                  blase: { text: D.blasen.teilen, oben: 18, pfeil: 90 }, ende: true }
            ],
            blase: { oben: 18, pfeil: 90 }
        }
    };

    var bildEl = $("sz-bild-img");

    function bildSzene(name, zusatz) {
        var cfg = bilder[name];
        zeige("bild");
        bildEl.src = D.bilder + (name === "frage" ? "welcome-frage" : name === "angebot" ? "welcome-angebot"
                                 : name === "auswahl" ? "bericht-auswahl" : name) + ".webp";
        bildEl.alt = D.alt[name];
        Array.prototype.forEach.call(szenen.bild.querySelectorAll(".flaeche"), function (f) { f.remove(); });
        var knoepfe = {};
        cfg.flaechen.forEach(function (f) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "flaeche" + (f.zeigen ? " zeigen" : "");
            b.style.left = f.x + "%"; b.style.top = f.y + "%";
            b.style.width = f.w + "%"; b.style.height = f.h + "%";
            b.setAttribute("aria-label", f.name);
            b.addEventListener("click", function () {
                if (f.zu) { gehe(f.zu, f.zusatz); return; }
                if (f.blase) blase(f.blase.text, f.blase, f.blase.pfeil);
                if (f.danach && knoepfe[f.danach]) {
                    Array.prototype.forEach.call(szenen.bild.querySelectorAll(".flaeche"), function (x) { x.classList.remove("zeigen"); });
                    knoepfe[f.danach].classList.add("zeigen");
                    jetzt(D.jetzt.heuteDanach);
                }
                if (f.ende) { fertig[4] = true; jetzt(D.jetzt.ende); }
            });
            if (f.id) knoepfe[f.id] = b;
            szenen.bild.appendChild(b);
        });
        var text = D.blasen[name], ort = cfg.blase;
        if (name === "heute" && zusatz) text = D.blasen[zusatz === "umschauen" ? "heuteUmschauen" : "heuteSpaeter"];
        // War das Notenband schon dran, geht es von hier zum Bericht weiter.
        // Bis 27.09.2026 fing „Heute" nach der Rueckkehr wieder bei der Karte
        // an, und die fuehrte zurueck ins Notenband: eine Schleife.
        if (name === "heute" && besucht.noten && !besucht.auswahl) {
            Array.prototype.forEach.call(szenen.bild.querySelectorAll(".flaeche"), function (x) { x.classList.remove("zeigen"); });
            knoepfe.verlauf.classList.add("zeigen");
            text = D.blasen.heuteNachNoten;
            ort = { unten: 90, pfeil: 85 };
            jetzt(D.jetzt.heuteNachNoten);
        }
        blase(text, ort, ort.pfeil);
    }

    // ------------------------------------------------------------ Session

    var sess = { soll: 300, geuebt: 0, uhr: false, letzte: 0, pause: false, bpm: 70, beginn: null, tempoGeaendert: false };
    var lichter = Array.prototype.slice.call($("k-lichter").children);
    var zahlEl = null, uhrRaf = null;

    function mmss(s) {
        s = Math.max(0, Math.floor(s));
        var m = Math.floor(s / 60), r = s % 60;
        return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
    }

    function zeichneSession() {
        var rest = sess.soll - sess.geuebt;
        $("s-uhr").textContent = mmss(rest);
        $("s-rest").textContent = D.rest(mmss(rest));
        $("s-plan").textContent = D.plan(Math.round(sess.soll / 60));
        var anteil = Math.min(1, sess.geuebt / sess.soll) * 100 + "%";
        $("s-balken").style.width = anteil;
        $("s-mini").style.width = anteil;
        $("s-zeit").textContent = mmss(sess.geuebt);
        $("s-soll").textContent = D.von(mmss(sess.soll));
    }

    function zeigeLichter() {
        if (zahlEl) { zahlEl.remove(); zahlEl = null; }
        lichter.forEach(function (l) { l.hidden = false; });
    }

    function sessionSchlag(nr) {
        if (nr < 0) {
            lichter.forEach(function (l) { l.hidden = true; });
            if (!zahlEl) { zahlEl = document.createElement("span"); zahlEl.className = "zahl"; $("k-lichter").appendChild(zahlEl); }
            zahlEl.textContent = -nr;
            return;
        }
        zeigeLichter();
        lichter.forEach(function (l, i) { l.classList.toggle("an", i === nr % 4); });
        // Die Uhr beginnt mit der Eins nach dem Vorzaehler.
        if (!sess.uhr && !sess.pause) sessionUhrStart();
    }

    function sessionUhrStart() {
        sess.uhr = true;
        sess.letzte = performance.now();
        var schleife = function () {
            if (!sess.uhr) return;
            var t = performance.now();
            sess.geuebt += (t - sess.letzte) / 1000;
            sess.letzte = t;
            zeichneSession();
            if (sess.geuebt >= sess.soll) { gehe("abschluss"); return; }
            uhrRaf = requestAnimationFrame(schleife);
        };
        uhrRaf = requestAnimationFrame(schleife);
    }

    function sessionUhrStopp() {
        sess.uhr = false;
        if (uhrRaf) cancelAnimationFrame(uhrRaf);
    }

    var ICON = {
        stopp: '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.6" y="1.6" width="6.8" height="6.8" rx="1.2" fill="currentColor"/></svg>',
        play: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.6 1.2v7.6L9.2 5z" fill="currentColor"/></svg>',
        pause: '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.8" y="1.2" width="2.3" height="7.6" rx=".6" fill="currentColor"/><rect x="5.9" y="1.2" width="2.3" height="7.6" rx=".6" fill="currentColor"/></svg>'
    };

    function klickKnopf(an) {
        var k = $("k-start");
        k.innerHTML = an ? ICON.stopp : ICON.play;
        k.className = "rund " + (an ? "an" : "aus");
        k.setAttribute("aria-label", an ? D.namen.klickAus : D.namen.klickAn);
    }

    function klickStarten() {
        if (taktStart(sess.bpm, 4, sessionSchlag)) klickKnopf(true);
    }

    function klickAnhalten() {
        taktStopp();
        zeigeLichter();
        lichter.forEach(function (l) { l.classList.remove("an"); });
        klickKnopf(false);
    }

    function sessionBetreten() {
        zeige("session");
        sess.soll = 300; sess.geuebt = 0; sess.pause = false; sess.bpm = 70; sess.tempoGeaendert = false;
        sess.beginn = new Date();
        $("k-bpm").textContent = sess.bpm;
        $("s-pause").innerHTML = ICON.pause;
        $("s-pause").setAttribute("aria-label", D.namen.pause);
        zeichneSession();
        klickStarten();
        blase(D.blasen.session, { oben: 56 }, 31);
        spaeter(beendenZeigen, 24000);
    }

    function beendenZeigen() {
        if (aktuell !== "session") return;
        blase(D.blasen.beenden, { oben: 13.5 }, 87);
        jetzt(D.jetzt.beenden);
    }

    function tempo(delta) {
        sess.bpm = Math.max(30, Math.min(250, sess.bpm + delta));
        takt.bpm = sess.bpm;
        $("k-bpm").textContent = sess.bpm;
        if (!sess.tempoGeaendert) {
            sess.tempoGeaendert = true;
            blase(null);
            aufraeumen();
            spaeter(beendenZeigen, 12000);
        }
    }

    $("k-minus").addEventListener("click", function () { tempo(-1); });
    $("k-plus").addEventListener("click", function () { tempo(1); });
    $("k-start").addEventListener("click", function () {
        if (takt.laeuft) {
            klickAnhalten();
            // Ohne Klick laeuft die Session trotzdem, wie in der App.
            if (!sess.uhr && !sess.pause) sessionUhrStart();
        } else {
            klickStarten();
        }
    });
    $("s-pause").addEventListener("click", function () {
        sess.pause = !sess.pause;
        if (sess.pause) {
            sessionUhrStopp();
            klickAnhalten();
            $("s-pause").innerHTML = ICON.play;
            $("s-pause").setAttribute("aria-label", D.namen.weiter);
        } else {
            $("s-pause").innerHTML = ICON.pause;
            $("s-pause").setAttribute("aria-label", D.namen.pause);
            sessionUhrStart();
            klickStarten();
        }
    });
    $("s-mehr").addEventListener("click", function () { sess.soll += 120; zeichneSession(); });
    $("s-weiter").addEventListener("click", function () { gehe("abschluss"); });
    $("s-beenden").addEventListener("click", function () { gehe("abschluss"); });
    $("s-verwerfen").addEventListener("click", function () { gehe("angebot"); });

    // ------------------------------------------------------------ Abschluss

    function dauer(s) {
        s = Math.floor(s);
        return s < 60 ? s + " " + D.sek : Math.floor(s / 60) + " " + D.min;
    }

    function abschlussBetreten() {
        zeige("abschluss");
        $("a-zeit").textContent = dauer(sess.geuebt);
        $("a-gesichert").hidden = true;
        sterne(0);
        blase(D.blasen.abschluss, { unten: 87 }, 50);
    }

    var sternKnoepfe = Array.prototype.slice.call(document.querySelectorAll("#a-sterne .stern"));
    function sterne(n) { sternKnoepfe.forEach(function (s, i) { s.classList.toggle("an", i < n); s.setAttribute("aria-pressed", i < n); }); }
    sternKnoepfe.forEach(function (s, i) { s.addEventListener("click", function () { sterne(i + 1); }); });

    $("a-sichern").addEventListener("click", function () {
        blase(null);
        $("a-gesichert").hidden = false;
        spaeter(function () { gehe("erinnerung"); }, 1200);
    });

    // ------------------------------------------------------------ Erinnerungsfrage

    function erinnerungBetreten() {
        zeige("erinnerung");
        var beginn = sess.beginn || new Date();
        var vorschlag = new Date(beginn);
        vorschlag.setMinutes(Math.floor(beginn.getMinutes() / 15) * 15, 0, 0);
        var f = { hour: "2-digit", minute: "2-digit" };
        $("e-titel").textContent = D.morgen(vorschlag.toLocaleTimeString(D.locale, f));
        $("e-text").textContent = D.begonnen(beginn.toLocaleTimeString(D.locale, f));
    }
    $("e-ja").addEventListener("click", function () { gehe("heute", "spaeter"); });
    $("e-nein").addEventListener("click", function () { gehe("heute", "spaeter"); });

    // ------------------------------------------------------------ Notenband

    /* Lage der Notenzeilen im Bild (700 Pixel breit, 430 hoch), gemessen an
       den grauen Streifen zwischen den Zeilen, und die Takte je Zeile. Das ist
       die Karte ab Werk, wie die App sie an den Taktstrichen zaehlt.
       Bewusst nur die ersten fuenf von fuenfzehn Zeilen (Silvio, 27.09.2026:
       „1/3 reicht doch zur Veranschaulichung"). */
    var ZEILEN = [0, 84, 177, 266, 356];
    var TAKTE = [8, 4, 4, 4, 4];
    var BILDHOEHE = 430, BILDBREITE = 700;
    var ersterTakt = [], summe = 0;
    TAKTE.forEach(function (t) { ersterTakt.push(summe + 1); summe += t; });
    var ALLE_TAKTE = summe;

    /* basis: welcher Takt auf den ersten Schlag nach dem Vorzaehler faellt.
       Beim Anhalten bleibt die Stelle stehen, Play spielt ab dem Anfang der
       Zeile weiter; ein Tipper auf eine Zeile setzt basis neu. Bis 27.09.2026
       sprang Stopp auf Takt 1 zurueck, und wer weiter wollte, musste das
       ganze Stueck abwarten. */
    var noten = { bpm: 130, zeile: 0, basis: 1, letzterNr: 0, hinweis: false, amEnde: false };

    function zeileVonTakt(t) {
        for (var i = ersterTakt.length - 1; i >= 0; i--) if (t >= ersterTakt[i]) return i;
        return 0;
    }

    function setzeZeile(i) {
        noten.zeile = i;
        var fenster = $("n-fenster"), mass = fenster.clientWidth / BILDBREITE;
        var oben = ZEILEN[i] * mass;
        var unten = (i + 1 < ZEILEN.length ? ZEILEN[i + 1] : BILDHOEHE) * mass;
        var z = $("n-zeile");
        z.style.top = oben + "px"; z.style.height = (unten - oben) + "px"; z.hidden = false;
        // Die gespielte Zeile steht oben, darunter ist Platz zum Vorauslesen.
        // Das ist die Regel der App (gespielte Zeile ins obere Drittel), und
        // sie gilt bis zur letzten Zeile: Das Blatt rollt dafuer ueber sein
        // Ende hinaus, darunter bleibt Weiss. Auf Handybreite passt dieser
        // Ausschnitt sonst ganz ins Fenster, und es rollte gar nichts.
        var ziel = i === 0 ? 0 : Math.max(0, oben - fenster.clientHeight * 0.06);
        $("n-blatt").style.transform = "translateY(" + (-ziel) + "px)";
    }

    function zeigeTakt(t) { $("n-takt").textContent = D.takt + " " + t; }

    function playKnopf(an) {
        var k = $("n-play");
        k.innerHTML = an ? ICON.stopp : ICON.play;
        k.setAttribute("aria-label", an ? D.namen.notenAus : D.namen.notenAn);
    }

    function notenAnhalten() {
        taktStopp();
        $("n-zahl").hidden = true;
        playKnopf(false);
    }

    function notenSchlag(nr) {
        if (nr < 0) { $("n-zahl").textContent = -nr; $("n-zahl").hidden = false; return; }
        $("n-zahl").hidden = true;
        noten.letzterNr = nr;
        var t = noten.basis + Math.floor(nr / 4);
        if (t > ALLE_TAKTE) {
            notenAnhalten();
            noten.basis = 1;
            noten.amEnde = true;
            $("n-takt").textContent = D.ende;
            blase(D.blasen.notenEnde, { oben: 14.5 }, 9);
            jetzt(D.jetzt.notenEnde);
            return;
        }
        zeigeTakt(t);
        var z = zeileVonTakt(t);
        if (z !== noten.zeile) {
            setzeZeile(z);
            // Nach der ersten Zeile einmal zeigen, dass man springen und
            // jederzeit weitergehen kann, statt das Stueck abzuwarten.
            if (!noten.hinweis && z >= 1) {
                noten.hinweis = true;
                blase(D.blasen.notenSprung, { unten: 88 }, null);
                jetzt(D.jetzt.notenLaeuft);
                spaeter(function () { if (aktuell === "noten") blase(null); }, 7000);
            }
        }
    }

    function notenBetreten() {
        zeige("noten");
        notenAnhalten();
        noten.basis = 1; noten.hinweis = false; noten.amEnde = false;
        setzeZeile(0);
        $("n-zeile").hidden = true;
        zeigeTakt(1);
        $("n-bpm").textContent = noten.bpm;
        blase(D.blasen.noten, { unten: 88 }, 12);
    }

    $("n-play").addEventListener("click", function () {
        if (takt.laeuft) { notenAnhalten(); return; }
        blase(null);
        // Weiter ab dem Anfang der Zeile, bei der angehalten wurde; nach dem
        // Ende des Stuecks wieder von vorn.
        if (noten.amEnde) { noten.zeile = 0; noten.amEnde = false; }
        noten.basis = ersterTakt[noten.zeile];
        setzeZeile(noten.zeile);
        zeigeTakt(noten.basis);
        if (taktStart(noten.bpm, 4, notenSchlag)) playKnopf(true);
        jetzt(D.jetzt.notenLaeuft);
    });

    // „Stimmt die Zeile nicht, tippe die an, die du gerade spielst": dieselbe
    // Geste wie in der App. Hier dient sie zugleich zum Springen.
    $("n-fenster").addEventListener("click", function (e) {
        var fenster = $("n-fenster"), mass = fenster.clientWidth / BILDBREITE;
        var blattOben = $("n-blatt").getBoundingClientRect().top;
        var y = (e.clientY - blattOben) / mass;
        var i = 0;
        for (var k = ZEILEN.length - 1; k >= 0; k--) if (y >= ZEILEN[k]) { i = k; break; }
        if (y > BILDHOEHE) return;
        if (takt.laeuft) {
            // Der laufende Schlag gehoert ab sofort zum ersten Takt dieser Zeile.
            noten.basis = ersterTakt[i] - (takt.nr > 0 ? Math.floor(noten.letzterNr / 4) : 0);
        } else {
            noten.basis = ersterTakt[i];
        }
        noten.amEnde = false;
        setzeZeile(i);
        zeigeTakt(ersterTakt[i]);
    });

    $("n-minus").addEventListener("click", function () { noten.bpm = Math.max(40, noten.bpm - 2); takt.bpm = noten.bpm; $("n-bpm").textContent = noten.bpm; });
    $("n-plus").addEventListener("click", function () { noten.bpm = Math.min(220, noten.bpm + 2); takt.bpm = noten.bpm; $("n-bpm").textContent = noten.bpm; });
    $("n-zurueck").addEventListener("click", function () { gehe("heute"); });
    window.addEventListener("resize", function () { if (aktuell === "noten" && noten.zeile >= 0) setzeZeile(noten.zeile); });

    window.DEMO_TON_GESPERRT = function () {
        if (aktuell === "session") { klickKnopf(false); zeigeLichter(); }
        if (aktuell === "noten") { playKnopf(false); $("n-zahl").hidden = true; }
        blase(D.blasen.tonGesperrt, { oben: 40 }, null);
    };

    // ------------------------------------------------------------ Leiste unter dem Handy

    /* Zurueck: an den Anfang der Station, und von dort zur vorigen, wie die
       Zurueck-Taste eines Musikspielers. Weiter: zur naechsten Station. Auf
       dem Handy steht die Liste der Stationen unter der Buehne, ausser Sicht;
       ohne diese Leiste kam man aus einer Station nur ueber ihren eigenen Weg
       wieder heraus (gemeldet 27.09.2026). */
    function steuerung(k) {
        $("st-stand").textContent = D.station(k + 1, ersteSzene.length);
        $("st-zurueck").disabled = (k === 0 && aktuell === ersteSzene[0]);
        var letzte = k === ersteSzene.length - 1;
        $("st-weiter").textContent = letzte ? D.namen.vonVorn : D.namen.weiterStation;
    }

    $("st-zurueck").addEventListener("click", function () {
        var k = kapitelVon[aktuell];
        if (aktuell !== ersteSzene[k]) gehe(ersteSzene[k]);
        else if (k > 0) gehe(ersteSzene[k - 1]);
    });
    $("st-weiter").addEventListener("click", function () {
        var k = kapitelVon[aktuell];
        if (k === ersteSzene.length - 1) { fertig = {}; besucht = {}; aktuell = null; gehe("frage"); return; }
        fertig[k] = true;
        gehe(ersteSzene[k + 1]);
    });

    // ------------------------------------------------------------ Rahmen

    // Im Hintergrund plant der Browser den Timer nur noch jede Sekunde, der
    // Klick stolperte. Also anhalten, wie ein Tab, der weggelegt wird.
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden || !takt.laeuft) return;
        if (aktuell === "session") { klickAnhalten(); }
        else if (aktuell === "noten") { notenAnhalten(); }
    });

    Array.prototype.forEach.call(document.querySelectorAll("#kapitel-liste li"), function (li) {
        li.querySelector("button").addEventListener("click", function () {
            gehe(ersteSzene[+li.getAttribute("data-kapitel")]);
        });
    });
    $("neu-starten").addEventListener("click", function () { fertig = {}; besucht = {}; aktuell = null; gehe("frage"); });

    // Alle Aufnahmen vorab laden, damit beim Tippen nichts nachlaedt.
    ["welcome-frage", "welcome-angebot", "heute", "bericht-auswahl", "bericht"].forEach(function (n) {
        var i = new Image(); i.src = D.bilder + n + ".webp";
    });

    gehe("frage");
})();
