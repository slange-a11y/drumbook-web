/* Der Weg zurück.
   Im HTML steht ein gewöhnlicher Link mit festem Ziel. Wer direkt hier
   landet (QR-Code, Lesezeichen, Suchmaschine) oder ohne JavaScript surft,
   behält genau diesen Link. Wer dagegen von einer anderen Drumbook-Seite
   kommt, bekommt ihn umgeschrieben: benannt nach der Seite, von der er kam,
   und über den Zurück-Knopf des Browsers, damit die Scrollposition erhalten
   bleibt.

   Die Herkunft steht im Browser selbst, wird nur gelesen und geht nirgends
   hin. Die Aussage in der Datenschutzerklärung bleibt damit wahr. */

(function () {
    "use strict";

    var links = document.querySelectorAll("a.back");
    if (!links.length || !document.referrer) return;

    var her;
    try { her = new URL(document.referrer); } catch (e) { return; }
    if (her.origin !== location.origin) return;

    // Von derselben Seite gekommen (Neuladen, Anker): nichts ändern.
    if (her.pathname === location.pathname) return;

    var englisch = document.documentElement.lang === "en";

    // Pfad-Ende -> wie die Seite im Satz heißt.
    var namen = englisch ? {
        "/en/":                "to the home page",
        "/en/news.html":       "to the news",
        "/en/teacher/":        "to the teachers' page",
        "/en/start/":          "to the sign-up page",
        "/en/legal.html":      "to imprint & privacy",
        "/":                   "to the German home page"
    } : {
        "/":                   "zur Startseite",
        "/neuigkeiten.html":   "zu den Neuigkeiten",
        "/lehrer/":            "zur Seite für Lehrer",
        "/start/":             "zum Mittesten",
        "/impressum.html":     "zum Impressum",
        "/datenschutz.html":   "zum Datenschutz",
        "/en/":                "to the English page"
    };

    var pfad = her.pathname.replace(/index\.html$/, "");
    var name = namen[pfad] || (englisch ? "to the previous page" : "zur vorigen Seite");

    Array.prototype.forEach.call(links, function (a) {
        a.textContent = (englisch ? "Back " : "Zurück ") + name;
        a.href = her.href;

        a.addEventListener("click", function (e) {
            // Neuer Tab, neues Fenster, Rechtsklick: den Browser lassen.
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (history.length > 1) {
                e.preventDefault();
                history.back();
            }
        });
    });
})();
