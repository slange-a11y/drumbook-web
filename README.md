# drumbook-web

Die Website zur iOS-App **Drumbook** — ein Übetagebuch fürs Schlagzeug.

Öffentlich erreichbar unter <https://drumbook.de/>.
Der Quellcode der App liegt getrennt davon im privaten Repo `slange-a11y/drumbook`.

## Aufbau

    index.html          Startseite (Deutsch)
    neuigkeiten.html    Neuigkeiten (Deutsch)
    impressum.html      Impressum
    datenschutz.html    Datenschutzerklärung
    en/index.html       Startseite (Englisch)
    en/news.html        Neuigkeiten (Englisch)
    en/legal.html       Imprint & privacy (Englisch, Übersetzung)
    assets/style.css    Das gesamte Aussehen — ein einziges Stylesheet
    assets/form.js      Das Formular für die Warteliste (das einzige Skript)
    assets/shots/       Bildschirmfotos aus dem Simulator
    tools/apps-script/  Der Empfang für das Formular + Einrichtungsanleitung
    .nojekyll           Sagt GitHub Pages: einfach ausliefern, nicht bauen

Reines HTML und CSS plus ein kleines Skript fürs Formular. Kein Framework,
kein Build-Schritt, keine externen Schriften — was die Seite lädt, liegt in
diesem Repo. Damit stimmt auch die Aussage in der Datenschutzerklärung, dass
beim Aufruf nichts von fremden Servern nachgeladen wird; zu Google geht erst
etwas, wenn jemand das Formular tatsächlich abschickt.

## Ändern

Datei bearbeiten, committen, pushen. GitHub Pages liefert die neue Fassung
nach etwa einer Minute aus.

## Neuigkeiten pflegen

Ein Eintrag je Build, neueste zuerst. Die Vorlage steht schon in der Datei —
`<article class="news__entry">` kopieren, Datum, Schlagwort, Überschrift und
Text austauschen.

Die Rohfassung steht im App-Repo unter `Tools/testhinweise/<build>.de.md` und
`.en.md`: dieselbe Sache in beiden Sprachen, im selben Ton. Daraus wird der
Eintrag gekürzt — **auf das, was der Nutzer davon hat, nicht darauf, wie es
gebaut ist.** Die Testhinweise erklären das Innenleben; die Website tut das
bewusst nicht.

Vier Stellen gehören zusammen und dürfen nicht auseinanderlaufen:

1. `neuigkeiten.html` — der vollständige Eintrag.
2. `en/news.html` — derselbe Eintrag auf Englisch.
3. `index.html`, Abschnitt `#neues` — die drei jüngsten als kurze Karte.
4. `en/index.html`, Abschnitt `#news` — dasselbe auf Englisch.

Wandert etwas aus „Steht noch aus" nach „Läuft und wird benutzt", gehört es in
beiden Sprachen umgehängt — und wenn es den Datenschutz berührt (wie der
Abgleich über iCloud), auch in `datenschutz.html` und `en/legal.html`.

## Das Formular

Die Warteliste läuft über eine Google-Apps-Script-Web-App, die in eine
Tabelle schreibt und dir eine Mail schickt. **Steht und ist getestet**
(01.09.2026): Projekt „Drumbook — Warteliste" im TE-Printline-Workspace,
Version 1, Zugriff „Jeder". Die Eintragungen landen im Blatt `Warteliste`
derselben Tabelle.

Das Formular erscheint nur, solange in `data-endpoint` eine gültige Adresse
steht. Wird sie entfernt, fällt die Seite von selbst auf den Mail-Knopf
zurück.

Anleitung: [`tools/apps-script/README.md`](tools/apps-script/README.md).

Die Logik des Skripts lässt sich ohne Google prüfen — die Google-Dienste
werden durch Attrappen ersetzt und die Datei in JavaScriptCore ausgeführt.
Achtung: Node.js half hier nicht weiter, es lief ohne jede Ausgabe.

## Noch zu erledigen

- Die zwei Testzeilen im Blatt `Warteliste` löschen, wenn sie stören.
- Bildschirmfotos erneuern, wenn sich die App sichtbar ändert.

## Bildschirmfotos neu erzeugen

Die Bilder stammen aus dem iPhone-Simulator mit erfundenen, aber plausiblen
Übedaten — nicht aus der echten Datenbank. Vorgehen: App für den Simulator
bauen, `Library/Application Support/default.store` im App-Container mit einem
kleinen Swift-Programm füllen, Statusleiste über
`xcrun simctl status_bar … --time 9:41` festsetzen, dann mit
`xcrun simctl io <udid> screenshot` aufnehmen und auf 800 px Breite
verkleinern.
