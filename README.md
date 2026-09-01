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
    assets/shots/       Bildschirmfotos aus dem Simulator
    .nojekyll           Sagt GitHub Pages: einfach ausliefern, nicht bauen

Reines HTML und CSS. Kein Framework, kein Build-Schritt, kein JavaScript,
keine externen Schriften — was die Seite lädt, liegt in diesem Repo. Damit
stimmt auch die Aussage in der Datenschutzerklärung, dass nichts von fremden
Servern nachgeladen wird.

## Ändern

Datei bearbeiten, committen, pushen. GitHub Pages liefert die neue Fassung
nach etwa einer Minute aus.

## Noch zu erledigen

- **Anschrift im Impressum** und in der Datenschutzerklärung eintragen
  (die Stellen sind mit `[…]` markiert und auf der Seite sichtbar).
- Bildschirmfotos erneuern, wenn sich die App sichtbar ändert.
- Wenn die Warteliste per `mailto:` zu mühsam wird: ein Formular
  (z. B. Formspree) einsetzen — dann muss der Abschnitt „Kontaktaufnahme"
  in der Datenschutzerklärung angepasst werden.

## Bildschirmfotos neu erzeugen

Die Bilder stammen aus dem iPhone-Simulator mit erfundenen, aber plausiblen
Übedaten — nicht aus der echten Datenbank. Vorgehen: App für den Simulator
bauen, `Library/Application Support/default.store` im App-Container mit einem
kleinen Swift-Programm füllen, Statusleiste über
`xcrun simctl status_bar … --time 9:41` festsetzen, dann mit
`xcrun simctl io <udid> screenshot` aufnehmen und auf 800 px Breite
verkleinern.
