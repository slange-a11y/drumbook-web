# Das Formular scharfschalten

Das Formular auf der Website ist fertig, aber **noch unsichtbar**. Es
erscheint erst, wenn in `index.html` und `en/index.html` die Adresse deiner
Apps-Script-Web-App eingetragen ist. Bis dahin sieht der Besucher den
Mail-Knopf wie bisher — es ist also nichts kaputt, solange du das hier nicht
gemacht hast.

Dauer: etwa zehn Minuten.

## 1. Tabelle anlegen

Auf <https://sheets.new> eine neue Tabelle anlegen und sinnvoll benennen,
etwa „Drumbook — Warteliste". Ein Blatt namens `Warteliste` legt das Skript
beim ersten Eintrag selbst an, samt Überschriften.

## 2. Skript einfügen

In der Tabelle: **Erweiterungen ▸ Apps Script**. Den vorhandenen Inhalt von
`Code.gs` löschen, den Inhalt der Datei [`Code.gs`](Code.gs) aus diesem
Ordner hineinkopieren und speichern.

Oben im Skript stehen vier Einstellungen. Prüfen:

    var EMPFAENGER = 's.lange@te-printline.de';   // wohin die Nachricht geht
    var BESTAETIGUNG_SENDEN = true;               // Empfangsbestätigung an den Absender
    var ABSENDERNAME = 'Drumbook';
    var BLATT = 'Warteliste';

## 3. Als Web-App bereitstellen

**Bereitstellen ▸ Neue Bereitstellung ▸** beim Zahnrad **Web-App** wählen.
Dann exakt so einstellen:

| Feld | Wert |
|---|---|
| Beschreibung | egal, z. B. „Formular v1" |
| **Ausführen als** | **Ich** (`s.lange@…`) |
| **Zugriff haben** | **Jeder** |

„Jeder" klingt heftiger als es ist: es heißt nur, dass auch Besucher ohne
Google-Konto das Formular absenden können. Das Skript läuft trotzdem unter
deinem Konto, und es tut nichts außer eine Zeile anzuhängen und eine Mail zu
schicken.

Beim ersten Mal fragt Google nach Berechtigungen. Die Warnung „Diese App ist
nicht verifiziert" ist normal für eigene Skripte — über **Erweitert ▸ Zu
… wechseln (unsicher)** bestätigen. Es ist dein eigener Code.

Am Ende bekommst du eine Adresse dieser Form:

    https://script.google.com/macros/s/AKfycb…/exec

## 4. Adresse in die Website eintragen

In **beiden** Dateien `index.html` und `en/index.html` steht je einmal:

    <form class="form form--js" data-endpoint="HIER_DIE_EXEC_ADRESSE_EINTRAGEN" novalidate>

Den Platzhalter durch die `/exec`-Adresse ersetzen. Von der Kommandozeile
geht das in einem Rutsch — die Adresse einsetzen:

```bash
cd ~/Developer/drumbook-web && sed -i '' 's|HIER_DIE_EXEC_ADRESSE_EINTRAGEN|https://script.google.com/macros/s/DEINE_KENNUNG/exec|g' index.html en/index.html && git add -A && git commit -m "Formular scharfgeschaltet" && git push
```

Nach etwa einer Minute steht das Formular live.

## 5. Ausprobieren

Auf der Seite selbst eintragen. Es sollte passieren:

1. Grüne Rückmeldung „Danke — du stehst auf der Liste."
2. Eine neue Zeile in der Tabelle
3. Eine Mail an dich
4. Eine Empfangsbestätigung an die eingetragene Adresse

Im Skripteditor gibt es dazu die Funktion `selbsttest()` — die schickt echte
Mails an dich selbst und zeigt im Ausführungsprotokoll, wie viele Empfänger
heute noch frei sind.

## Wenn etwas klemmt

**„Failed to fetch" / nichts passiert.** Fast immer die Bereitstellung:
„Zugriff haben" steht nicht auf **Jeder**. Prüfen und eine **neue Version**
bereitstellen — eine bestehende Bereitstellung ändert sich nicht von selbst,
wenn du nur den Code speicherst.

**Code geändert, aber nichts wirkt.** Bei Apps Script zeigt die `/exec`-Adresse
auf eine feste Version. Nach jeder Änderung: **Bereitstellen ▸ Bereitstellung
verwalten ▸ Stift ▸ Version: Neue Version ▸ Bereitstellen.** Die Adresse
bleibt dabei gleich.

**Keine Mails.** Ein privates Google-Konto darf 100 Empfänger am Tag
anschreiben, ein Workspace-Konto 1.500. Beim Selbsttest zählen zwei
Empfänger pro Durchlauf.

**Spam in der Tabelle.** Das Formular hat ein für Menschen unsichtbares Feld
(„Honigtopf"). Füllt ein Bot es aus, antwortet das Skript freundlich, trägt
aber nichts ein. Kommt trotzdem Müll durch, ist der nächste Schritt ein
Zeitfenster je IP oder ein Rätsel ohne Google — sag Bescheid.

## Der wunde Punkt

Mit einem **privaten** Google-Konto gibt es **keinen Vertrag zur
Auftragsverarbeitung** nach Art. 28 DSGVO — den bekommst du nur über Google
Workspace. Die Adressen deiner Interessenten liegen dann bei einem
Dienstleister, mit dem du diesen Vertrag nicht hast. In der
Datenschutzerklärung steht ein entsprechend markierter Hinweis. Wenn du das
nicht willst: Platzhalter einfach stehen lassen, dann bleibt der
`mailto:`-Weg aktiv, bei dem kein Dritter etwas speichert.
