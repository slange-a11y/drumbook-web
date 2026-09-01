# drumbook-web

Die Website zur iOS-App **Drumbook** — ein Übetagebuch fürs Schlagzeug.

Öffentlich erreichbar unter <https://slange-a11y.github.io/drumbook-web/>.
Der Quellcode der App liegt getrennt davon im privaten Repo `slange-a11y/drumbook`.

## Aufbau

    index.html          Startseite (Deutsch)
    impressum.html      Impressum
    datenschutz.html    Datenschutzerklärung
    en/index.html       Startseite (Englisch)
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

## Das Formular

Die Warteliste läuft über eine Google-Apps-Script-Web-App, die in eine
Tabelle schreibt und dir eine Mail schickt. **Sie ist noch nicht
scharfgeschaltet:** solange in `index.html` und `en/index.html` der
Platzhalter `HIER_DIE_EXEC_ADRESSE_EINTRAGEN` steht, bleibt das Formular
unsichtbar und die Seite zeigt weiterhin den Mail-Knopf. Es ist also nichts
kaputt, wenn du es dabei belässt.

Anleitung: [`tools/apps-script/README.md`](tools/apps-script/README.md).

Die Logik des Skripts lässt sich ohne Google prüfen — die Google-Dienste
werden durch Attrappen ersetzt und die Datei in JavaScriptCore ausgeführt.
Achtung: Node.js half hier nicht weiter, es lief ohne jede Ausgabe.

## Noch zu erledigen

- **Anschrift im Impressum** und in der Datenschutzerklärung eintragen
  (die Stellen sind mit `[…]` markiert und auf der Seite sichtbar).
- **Das Formular scharfschalten**, sobald die Web-App im TE-Printline-Workspace
  bereitsteht (dort gilt der AV-Vertrag; entschieden am 01.09.2026). Anbieter
  der Website bleibt davon unberührt Silvio Lange als Privatperson.
- Bildschirmfotos erneuern, wenn sich die App sichtbar ändert.

## Bildschirmfotos neu erzeugen

Die Bilder stammen aus dem iPhone-Simulator mit erfundenen, aber plausiblen
Übedaten — nicht aus der echten Datenbank. Vorgehen: App für den Simulator
bauen, `Library/Application Support/default.store` im App-Container mit einem
kleinen Swift-Programm füllen, Statusleiste über
`xcrun simctl status_bar … --time 9:41` festsetzen, dann mit
`xcrun simctl io <udid> screenshot` aufnehmen und auf 800 px Breite
verkleinern.
