# Die Zettel und der Aushang

Erzeugt zwei A5-Seiten und einen A4-Aushang als PDF nach `assets/zettel/`.
Von dort lädt die Website sie herunter, `lehrer/index.html` verlinkt alle drei:

    drumbook-zettel-schueler.pdf   für den Schüler, der ihn vom Lehrer bekommt
    drumbook-zettel-lehrer.pdf     für den Lehrer, bevor er ihn weitergibt
    drumbook-aushang-a4.pdf        für das Brett in der Musikschule (#241)

Der Aushang ist dieselbe Seite wie der Schülerzettel, auf A4 hochgesetzt, mit
eigenem Text. Eine Änderung am Aufbau wirkt deshalb auf alle drei.

Der Musterbericht im selben Ordner (`drumbook-musterbericht.pdf`) kommt nicht
von hier, sondern aus dem App-Repo: `Tools/musterbericht.sh` rechnet den echten
Bericht aus den Demo-Daten und stempelt jede Seite als Beispiel.

    swiftc -O zettel.swift -o zettel && ./zettel

Ohne Argument schreibt das Programm nach `assets/zettel/`; ein Pfad als erstes
Argument legt es woandershin.

## Das Foto

Der Schülerzettel braucht `set.jpg` in **diesem Ordner**. Fehlt es, wird ein
Platzhalter gezeichnet und das Programm endet mit einer Warnung und Rückgabewert
2 — so kommt kein Platzhalter aus Versehen in den Druck.

Zurzeit: Adobe Stock **279300910** („Woman playing drums during music band
rehearsal"), lizenziert über TE-Printline, Original 6000 × 4000 px. Für den
Zettel auf 2400 px verkleinert — A5 in voller Breite braucht bei 300 dpi rund
1750 px, und das Original bläht die PDF auf knapp 9 MB auf:

    sips -s format jpeg -s formatOptions 88 --resampleWidth 2400 \
         ~/Desktop/AdobeStock_279300910.jpeg --out set.jpg

**`set.jpg` steht in `.gitignore` und darf dort bleiben.** Dieses Repo ist
öffentlich; die Standardlizenz deckt das fertige Werbemittel ab, nicht die
Weitergabe der Bilddatei selbst. Das fertige PDF ist in Ordnung, die Bilddatei
im Repo wäre es nicht.

Rückfalloption, falls das Bild zu sehr nach Bandfoto aussieht: Adobe Stock
**134631852** („Old Red Drums", rotes Sparkle-Set, ohne Menschen).

**Keine KI-Bilder.** Der erste Durchgang lief mehrfach auf KI-Motive: sie sehen
gut aus und sind an den Händen kaputt — Stöcke ohne Spitze, Stöcke, die in der
Faust enden oder darin die Farbe wechseln, Finger ohne Daumen. Auf einem Zettel,
den ein Schlagzeuglehrer in der Hand hält, bevor er ihn weitergibt, ist das die
teuerste Stelle zum Sparen. In der Suche links unter „Generative KI" auf
**„Generative KI ausschließen"** stellen, oder in der Adresse
`filters[gentech]=exclude` mitgeben.

## Vor dem Druck

Das Programm meldet je Zettel, wo der untere Rand liegt, und **bricht mit
Warnungen ab**, wenn Inhalt in den Seitenrand läuft. Genau das ist beim Umbau
drei Mal passiert, ohne dass man es der Datei angesehen hätte.

Danach den QR-Code aus der fertigen Seite zurücklesen — **immer**, beim ersten
Versuch war er einmal abgeschnitten, und nur das ist aufgefallen:

    sips -s format png --resampleWidth 900 ../../assets/zettel/drumbook-zettel-schueler.pdf --out p.png
    swiftc -O lies-qr.swift -o lies-qr && ./lies-qr p.png

Erwartet, für alle drei: `https://drumbook.de/`.

## Festlegungen, die nicht zufällig sind

- **Der QR-Code sitzt immer schwarz auf weiß**, auch auf der dunklen Seite. Ein
  eingefärbter oder invertierter Code wird längst nicht von jeder Kamera
  erkannt. Kantenlänge 100 pt = 35 mm; aus Armlänge gescannt gilt 25 mm als
  Untergrenze, der alte Zettel hatte 29 mm.
- **Die Codes zeigen auf die Startseite** (Silvios Entscheidung vom
  17.09.2026). Eine eigene Landeseite brächte mehr Eintragungen, zeigt aber nur
  einen Ausschnitt, und wer vom Papier kommt, soll sehen, was die App alles
  kann. `/start/` und `/lehrer/` bleiben bestehen. Die Adresse steht zusätzlich
  getippt darunter: Code **und** Adresse bringen mehr Rücklauf als die Adresse
  allein.
- **Der Übergang vom Foto ins Schwarz ist eine Bildmaske**, kein Verlauf mit
  Transparenz. Einen solchen Verlauf schreibt CoreGraphics ins PDF deckend;
  das Foto hörte deshalb bis zum 26.09.2026 mit einer geraden Kante auf.
- **Der QR-Code ist ein Bitmap mit vier Pixeln je Punkt.** Vorher waren es
  72 dpi, auf dem Aushang wären die Kanten der Module weich gedruckt.
- **Die Wortmarke steht unten links im Foto**, nicht oben. Oben ist das Gesicht;
  ein dunkler Balken darüber lag genau quer darin.
- **Der QR-Kasten wächst mit dem Text.** Feste Höhe war ein Fehler: Auf dem
  Lehrerzettel lief die Adresse unten aus dem weißen Kasten heraus und stand
  dunkelorange auf schwarzem Grund.
- **Der Zettel nennt den Preis.** „Im Test kostenlos, später ein Abo" — wer das
  erst nach der Einladung erfährt, fühlt sich überrumpelt, und beim Lehrer wiegt
  das doppelt.
- **Kein Lehrername.** „Von deinem Lehrer empfohlen" trägt auch ohne Rückfrage
  und passt, wenn später andere Lehrer verteilen.
