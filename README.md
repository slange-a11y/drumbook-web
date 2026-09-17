# drumbook-web

Die Website zur iOS-App **Drumbook**, einem Übetagebuch fürs Schlagzeug.

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
    assets/style.css    Das gesamte Aussehen, ein einziges Stylesheet
    assets/form.js      Das Formular für die Warteliste
    assets/zurueck.js   Benennt den Zurück-Link nach der Seite, von der du kamst
    assets/anim.js      Der durchlaufende Takt und die Abschnitte beim Scrollen
    assets/shots/       Bildschirmfotos aus dem Simulator
    assets/foto/        Stimmungsbilder (Adobe Stock, lizenziert)
    tools/apps-script/  Der Empfang für das Formular + Einrichtungsanleitung
    .nojekyll           Sagt GitHub Pages: einfach ausliefern, nicht bauen

Reines HTML und CSS plus ein kleines Skript fürs Formular. Kein Framework,
kein Build-Schritt, keine externen Schriften: was die Seite lädt, liegt in
diesem Repo. Damit stimmt auch die Aussage in der Datenschutzerklärung, dass
beim Aufruf nichts von fremden Servern nachgeladen wird; zu Google geht erst
etwas, wenn jemand das Formular tatsächlich abschickt.

## Ändern

Datei bearbeiten, committen, pushen. GitHub Pages liefert die neue Fassung
nach etwa einer Minute aus.

## Neuigkeiten pflegen

Ein Eintrag je Build, neueste zuerst. Die Vorlage steht schon in der Datei:
`<article class="news__entry">` kopieren, Datum, Schlagwort, Überschrift und
Text austauschen.

Die Rohfassung steht im App-Repo unter `Tools/testhinweise/<build>.de.md` und
`.en.md`: dieselbe Sache in beiden Sprachen, im selben Ton. Daraus wird der
Eintrag gekürzt, **auf das, was der Nutzer davon hat, nicht darauf, wie es
gebaut ist.** Die Testhinweise erklären das Innenleben; die Website tut das
bewusst nicht.

Vier Stellen gehören zusammen und dürfen nicht auseinanderlaufen:

1. `neuigkeiten.html`: der vollständige Eintrag.
2. `en/news.html`: derselbe Eintrag auf Englisch.
3. `index.html`, Abschnitt `#neues`: die drei jüngsten als kurze Karte.
4. `en/index.html`, Abschnitt `#news`: dasselbe auf Englisch.

Wandert etwas aus „Steht noch aus" nach „Läuft und wird benutzt", gehört es in
beiden Sprachen umgehängt, und wenn es den Datenschutz berührt (wie der
Abgleich über iCloud), auch in `datenschutz.html` und `en/legal.html`.

## Zwei Hausregeln für den Text

**Keine langen Gedankenstriche.** Am 17.09.2026 sind 280 davon aus elf Seiten
verschwunden, weil sie inzwischen als Maschinenschrift gelesen werden. Wo einer
stehen möchte, gehört ein Komma, ein Doppelpunkt, ein Semikolon oder ein Punkt
hin. Die Gegenprobe über alle Seiten (findet nichts, wenn alles sauber ist;
die Anleitungen unter `tools/` sind bewusst ausgenommen, die liest kein
Besucher):

    grep -rn "$(printf '\342\200\224')" --include="*.html" .

## Bilder auf der Seite

Ein Foto ist nie eine Kachel zwischen zwei Abschnitten, sondern der Grund,
auf dem ein Abschnitt steht (`.buehne`). Der Inhalt liegt darauf, das Bild
läuft beim Scrollen langsamer mit. Die Bewegung macht die Scroll-Zeitachse
von CSS (`animation-timeline: view()`); wo ein Browser sie nicht kennt,
springt eine schlanke Fassung in `anim.js` ein, und wer weniger Bewegung
eingestellt hat, sieht ein ruhiges Standbild.

Drei Dinge, die dabei teuer gelernt wurden:

1. **`overflow: clip`, nicht `hidden`.** `hidden` macht den Abschnitt selbst
   zu einem Scroll-Container; die Zeitachse misst dann gegen einen Kasten, in
   dem sich nie etwas bewegt, und das Bild steht still.
2. **Kein Gesicht hinter Fließtext.** Der Schlussaufruf trägt ein ganzes
   Formular, deshalb sitzt der Ausschnitt dort auf den Bühnenlichtern und das
   Bild bekommt Tiefenunschärfe. Über einem Porträt liest sich kein Absatz.
3. **Auf dem Handy trägt das Bild nur den Kopf des Abschnitts.** Ein Abschnitt
   wird dort schnell doppelt so hoch wie breit; ein Querformat-Motiv würde
   darin zu einem Streifen gezerrt, auf dem nichts zu erkennen ist.

**Das Gesicht ist der Grund, warum das Foto da ist.** Oben in jeder Bühne
steht deshalb eine Zone, in der nur das Bild steht: kein Text, kaum Schleier
(`--kopfraum`). Darunter beginnt der Text, und dort wird der Schleier dicht.
Liegt eine Überschrift auf dem Gesicht und ein Schleier darüber, kann man das
Foto auch weglassen.

Wo das Gesicht sitzt, ist je Motiv verschieden und steht als
`object-position` an einer Klasse je Bild (`.buehne--gegenlicht`,
`.buehne--lachen`, `.buehne--probe`). **Auf schmalen Schirmen gelten eigene
Werte:** dort wird links und rechts beschnitten statt oben und unten, und das
Gesicht rutscht sonst aus dem Bild.

**Im Hero steht kein Telefon mehr.** Es stand rechts und hat sich mit dem
Motiv um dieselbe Fläche gestritten: Textspalte und Telefonspalte teilen sich
die Breite ohne Lücke, und wo die Grenze liegt, hängt am Fenster — bei 1280
stand das Gesicht neben dem Gerät, bei 1870 mitten darin. Die Aufnahme der
laufenden Session läuft jetzt im Abschnitt „Die Uhr denkt mit", wo sie
inhaltlich hingehört, und startet erst, wenn man sie sieht.

**Hinter der ganzen Seite liegt ein Raum:** zwei warme Lichtinseln und ein
Hauch Kaltlicht von unten (`body::before`, fest im Fenster, nicht im
Dokument — der Inhalt scrollt hindurch), dazu ein feines Korn
(`body::after`). Beides liegt hinter dem Inhalt und legt sich nie über Text.
Das ist der Grund, warum die langen Strecken zwischen den Bildern nicht mehr
tot wirken.

**Der Hero ist ein Sonderfall.** Dort ist das Bild breiter als der Kasten
(`width: 136%`, links bündig). Der Grund: Ein Querformat in einem noch
breiteren Kasten wird oben und unten beschnitten, und `object-position` kann
waagerecht dann gar nichts ausrichten — die Schlagzeugerin säße fest bei
47 Prozent der Breite, genau hinter dem Fließtext. Breiter gerechnet wandert
sie in die Lücke zwischen Text und Telefon und darf dort hell bleiben.
Unter 900 px steht der Text über der vollen Breite, es gibt keine Lücke mehr:
dort steht das Bild wieder gerade und der Schleier wird nach unten dicht.

**Wie weit ein Motiv reicht, steuert `--bild`** auf der Bühne. Unter einer
Überschrift mit Vorspann darf es weit hineinlaufen (620 px), wo gleich darunter
ein Kartenraster beginnt, muss es vorher enden (`.buehne--knapp`, 400 px) —
sonst sieht man nur noch Fetzen zwischen den Karten. Der Schleier rechnet mit
derselben Zahl und läuft genau dort in den Seitengrund aus.

**Der Schleier gehört auf den Abschnitt, nicht auf das Foto.** Läge er auf dem
Foto, wanderte er beim Scrollen mit und die dunkle Zone liefe dem Text davon.

Die Dateien liegen in `assets/foto/` als 1800er und 900er Fassung. Neue Bilder
so aufbereiten: `sips -Z 1800 -s format jpeg -s formatOptions 68`. Zuschnitt
macht `object-fit: cover` im Stylesheet, nicht `sips` (dessen `--cropOffset`
schneidet aus der Mitte).

**Aufzählungen von dem, was es nicht gibt, sparsam.** „Kein Konto, kein
Passwort, kein Server" sitzt einmal. Dreimal hintereinander klingt es gebaut.

## Das Formular

Die Warteliste läuft über eine Google-Apps-Script-Web-App, die in eine
Tabelle schreibt und dir eine Mail schickt. **Steht und ist getestet**
(01.09.2026): Projekt „Drumbook, Warteliste" im TE-Printline-Workspace,
Version 1, Zugriff „Jeder". Die Eintragungen landen im Blatt `Warteliste`
derselben Tabelle.

Das Formular erscheint nur, solange in `data-endpoint` eine gültige Adresse
steht. Wird sie entfernt, fällt die Seite von selbst auf den Mail-Knopf
zurück.

Anleitung: [`tools/apps-script/README.md`](tools/apps-script/README.md).

Die Logik des Skripts lässt sich ohne Google prüfen; die Google-Dienste
werden durch Attrappen ersetzt und die Datei in JavaScriptCore ausgeführt.
Achtung: Node.js half hier nicht weiter, es lief ohne jede Ausgabe.

## Noch zu erledigen

- Die zwei Testzeilen im Blatt `Warteliste` löschen, wenn sie stören.
- Bildschirmfotos erneuern, wenn sich die App sichtbar ändert.

## Bildschirmfotos neu erzeugen

Die Bilder stammen aus dem Simulator mit erfundenen, aber plausiblen Übedaten,
nicht aus der echten Datenbank. Der Datensatz liegt **im App-Repo** und ist
wiederholbar:

    Tools/demo-daten.sh <blatt.pdf>            # deutsch
    SPRACHE=en Tools/demo-daten.sh <blatt.pdf> # englisch

Vorgehen:

1. App für den Simulator bauen und installieren
   (`xcodebuild … -sdk iphonesimulator`, dann `xcrun simctl install`).
2. `Tools/demo-daten.sh` füllt den Speicher und setzt Lehrername, Wochenziel
   und Standard-Session. Für Englisch zusätzlich die **Gerätesprache**
   umstellen, sonst steht auf dem iPad das deutsche Datum in der Statusleiste:
   `xcrun simctl spawn <udid> defaults write "Apple Global Domain" AppleLanguages -array "en-GB"`,
   dasselbe mit `AppleLocale`, danach Gerät neu starten.
3. Statusleiste festsetzen:
   `xcrun simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3`
4. Aufnehmen mit `xcrun simctl io <udid> screenshot`.
5. **Querformat:** `simctl` kann nicht drehen. Über das Menü der Simulator-App
   (`Device ▸ Rotate Left`) drehen; vorher das richtige Fenster nach vorn
   holen, sonst dreht sich das andere Gerät. Die Aufnahme kommt weiterhin im
   Hochformat-Rahmen an und muss nachträglich gedreht werden (`sips -r 270`).
6. Verkleinern und als JPEG sichern (Qualität 84):
   iPhone hoch 700 px, iPhone quer 1100 px, iPad hoch 820 px, iPad quer 1300 px.

Der Satz besteht aus vierzehn Bildern je Sprache: zehn iPhone-Hochformat, eines
iPhone-Querformat, zwei iPad-Hochformat, eines iPad-Querformat.

