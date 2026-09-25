# drumbook-web

Die Website zur iOS-App **Drumbook**, einem Übetagebuch fürs Schlagzeug.

Öffentlich erreichbar unter <https://drumbook.de/>.
Der Quellcode der App liegt getrennt davon im privaten Repo `slange-a11y/drumbook`.

## Aufbau

    index.html          Startseite (Deutsch): verkauft, erklärt nicht
    so-funktionierts/   Alles im Detail (Deutsch): Technik, Geräte, Daten, Stand
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

Zwei Stellen gehören zusammen und dürfen nicht auseinanderlaufen:

1. `neuigkeiten.html`: der vollständige Eintrag.
2. `en/news.html`: derselbe Eintrag auf Englisch.

Seit dem Umbau vom 25.09.2026 hat die deutsche Startseite keine
Neuigkeiten-Karten mehr (die englische bis zu ihrem Umbau noch schon).

Wandert etwas aus „Steht noch aus" nach „Läuft und wird benutzt"
(`so-funktionierts/#stand`), gehört es in beiden Sprachen umgehängt, und wenn es den Datenschutz berührt (wie der
Abgleich über iCloud), auch in `datenschutz.html` und `en/legal.html`.

## Die Startseite verkauft (Umbau 25.09.2026)

Silvios Ansage: „mehr auf Marketing auslegen und weniger die Technik
erklären; wir wollen User gewinnen, und Lehrer, die unsere App empfehlen."
Die Startseite hatte 3.108 Wörter in zwölf Abschnitten und erklärte vor allem,
wie Drumbook gebaut ist. Jetzt rund 1.000 Wörter in dieser Reihenfolge:
Hero, Problem, vier Nutzen (Heute, Am Set, Zur Musik, Verlauf), Mit
Unterricht, Wer dahintersteckt, Preis, Fragen, Formular. Alles Technische
steht unter `so-funktionierts/`. **Neue Funktionen kommen dorthin; auf die
Startseite nur, wenn sie einen der vier Nutzen ändern.**

Entschieden dabei: Das Formular bleibt (kein öffentlicher TestFlight-Link),
es hat nur noch ein Pflichtfeld. Der Preis steht als Spanne da (3 bis 5 € im
Monat, im Test kostenlos). Die Vorstellung „Wer dahintersteckt" ist Text ohne
Foto. Der Hero trägt jetzt `lachen`, dieselbe Drummerin wie beim Start der
App; ihr Ausschnitt steht an `.hero--lachen`.

## Zwei Hausregeln für den Text

**Keine langen Gedankenstriche.** Am 17.09.2026 sind 280 davon aus elf Seiten
verschwunden, weil sie inzwischen als Maschinenschrift gelesen werden. Wo einer
stehen möchte, gehört ein Komma, ein Doppelpunkt, ein Semikolon oder ein Punkt
hin. Die Gegenprobe über alle Seiten (findet nichts, wenn alles sauber ist;
die Anleitungen unter `tools/` sind bewusst ausgenommen, die liest kein
Besucher):

    grep -rn "$(printf '\342\200\224')" --include="*.html" .

## Bilder auf der Seite

> **Die Hausregel, von Silvio am 19.09.2026:** „Bilder sorgen für Emotionen und
> müssen perfekt in der Seite funktionieren, um zu wirken." Ein Motiv, das als
> Kachel dasitzt, mit scharfer Kante abreißt oder als Fetzen in den nächsten
> Abschnitt leuchtet, wirkt nicht — es stört. Nach jeder Änderung an Bühnen,
> Maßen oder Schleiern gehört deshalb der Durchgang unten dazu, und zwar auf
> **beiden** Breiten und an **beiden** Kanten jedes Motivs, oben wie unten.


Ein Foto ist nie eine Kachel zwischen zwei Abschnitten, sondern der Grund,
auf dem ein Abschnitt steht (`.buehne`). Der Inhalt liegt darauf, das Bild
läuft beim Scrollen langsamer mit. Die Bewegung macht die Scroll-Zeitachse
von CSS (`animation-timeline: view()`); wo ein Browser sie nicht kennt,
springt eine schlanke Fassung in `anim.js` ein, und wer weniger Bewegung
eingestellt hat, sieht ein ruhiges Standbild.

Drei Dinge, die dabei teuer gelernt wurden:

0. **Prüfen heißt messen, nicht hinsehen.** `tools/bildpruefung.js` in die
   Konsole der offenen Seite werfen; es prüft jede Bühne gegen die Regeln
   unten und nennt die Stelle. Drei Fehler an einem Tag sind nur deshalb
   nacheinander aufgefallen, weil ich mich auf Screenshots verlassen habe.
   Zwei Fallen dabei: Lazy geladene Bilder laden im versteckten oder
   emulierten Fenster gar nicht (das Skript setzt `eager`), und das
   Stylesheet hängt zehn Minuten im Cache (das Skript hängt `?x=` an).
0. **Der Übergang gehört über die Bühne, nicht hinein.** Eine Bühne folgt auf
   einen schwarzen Abschnitt. Beginnt das Motiv an ihrer Kante, sitzt es dort
   als Kachel mit scharfer Oberkante; blendet man es innerhalb der Bühne auf,
   kostet das genau die Fläche, auf der das Gesicht steht. Deshalb ragt das
   Foto um `--ueberstand` (104 px) hinaus, `overflow-clip-margin` gibt ihm
   dort Platz, und eine Maske blendet es über diesen Streifen auf und am
   unteren Ende wieder aus. **Die Maske muss stillstehen:** Bewegt würde der
   Übergang beim Scrollen mitwandern und sich in die Bühne schieben. Deshalb
   bewegt sich das Bild *im* Rahmen, nicht der Rahmen. Und der Schleier
   beginnt oben bei null, sonst ist genau dort wieder ein Absatz zu sehen.
   **Der Schleier klebt am Abschnitt, das Foto nicht.** Überall, wo das Foto
   weiter reicht als der Schleier, muss die Blende es ausgeblendet haben —
   sonst steht dort ungedämpftes Bild. Zwei Stellen, an denen genau das
   passiert ist: unten, wo das Motiv bei `--bild` enden muss und nicht erst
   am Rahmenende; und oben bei den Kopfbühnen der Landeseiten, wo über der
   Bühne keine Blende nötig ist — dort darf es dann aber auch **keinen**
   Clip-Rand geben, sonst liegt ein heller Streifen unter der Navigation.
   Nebenbei: `overflow-clip-margin` nimmt kein nacktes `0`, nur `0px`. Ein
   `0` wird still verworfen und die Regel bleibt wirkungslos.
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

**Der Hero hat einen eigenen Takt.** Die Kamerafahrt ist dieselbe wie unter
den Bühnen, ihre Zeitachse aber nicht: Eine Bühne kommt von unten herein, ihre
Fahrt ist das Durchfahren (`cover`); der Hero steht beim Öffnen schon da, seine
Fahrt ist das Hinausgehen (`exit`). Mit `cover` stünde er beim Laden mitten in
der Bewegung.

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

**Die Motive und ihre Stellen.** Startseite: Hero (`lachen`), „Warum
überhaupt" (`gegenlicht`), „Mit Unterricht" (`unterricht`, Schüler am Set, der
Lehrer zeigt etwas), Schlussaufruf (`buehne`). So funktioniert's: Kopf
(`spielen`), „Der Kleinkram" (`lachen`), „Deine Daten" (`probe`), Schluss
(`buehne`); „Stand der Dinge" steht ohne Bild, damit `spielen` nicht zweimal
auf derselben Seite vorkommt. Die Lehrer-Seite trägt `zeigen`, die
Mittesten-Seite `lachen`. `set` liegt bis zum Umbau der englischen Seite nur
noch dort. Bei den zwei Unterrichtsbildern sind **zwei**
Gesichter im Bild — der Ausschnitt muss beide fassen, nicht eins davon.

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

