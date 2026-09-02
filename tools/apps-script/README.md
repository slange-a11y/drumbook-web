# Das Formular scharfschalten

> **Erledigt am 01.09.2026.** Die Web-App läuft im TE-Printline-Workspace
> (Projekt „Drumbook — Warteliste", Version 1, Zugriff: Jeder), die Adresse
> steht in beiden Startseiten, und der Weg Website → Skript → Tabelle ist
> durchgetestet. Diese Anleitung bleibt für den Fall stehen, dass etwas neu
> aufgesetzt oder nachvollzogen werden muss.

Das Formular erscheint nur, wenn in `index.html` und `en/index.html` in
`data-endpoint` eine gültige Adresse steht. Fehlt sie, zeigt die Seite
stattdessen den Mail-Knopf — kaputt ist dann nichts.

Dauer beim ersten Mal: etwa zehn Minuten.

## Wichtig: das Firmenkonto benutzen

Tabelle und Skript gehören in den **Google Workspace von TE Printline**, nicht
in ein privates Google-Konto. Nur dort gilt das *Cloud Data Processing
Addendum* — der Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO, auf den
sich die Datenschutzerklärung beruft. Legst du die Tabelle versehentlich im
Privatkonto an, stimmt der Text auf der Website nicht mehr.

Achte beim Anlegen also auf die Kontoauswahl oben rechts.

Das ändert **nichts am Impressum**: Anbieter der Website bleibt Silvio Lange
als Privatperson, so wie die App unter der privaten Apple-ID läuft. Der
Workspace ist nur das Werkzeug, mit dem die Eintragungen entgegengenommen
werden — Drumbook wird dadurch kein Produkt der GmbH.

### Wenn eure Edition es hergibt: Speicherort Europa

Google Sheets fällt unter die **Data Regions**. Steht in der
Admin-Konsole unter *Unternehmensprofil ▸ Datenregionen* als Ort **Europa**,
liegen die Adressen aus der Tabelle im ruhenden Zustand in der EU.

Zwei Einschränkungen: Die Einstellung gibt es nur in den Enterprise-Stufen
(nicht in Business Starter/Standard/Plus), und **Apps Script selbst ist nicht
vollständig regionalisiert** — die Verarbeitung im Skript kann also weiterhin
außerhalb laufen. Deshalb bleibt der Absatz zum Drittlandtransfer in der
Datenschutzerklärung stehen. Wenn es die Einstellung bei euch gibt, ist sie
trotzdem mitgenommen.

## 1. Tabelle anlegen

Auf <https://sheets.new> eine neue Tabelle anlegen und sinnvoll benennen,
etwa „Drumbook — Warteliste". Ein Blatt namens `Warteliste` legt das Skript
beim ersten Eintrag selbst an, samt Überschriften.

## 2. Skript einfügen

In der Tabelle: **Erweiterungen ▸ Apps Script**. Den vorhandenen Inhalt von
`Code.gs` löschen, den Inhalt der Datei [`Code.gs`](Code.gs) aus diesem
Ordner hineinkopieren und speichern.

Oben im Skript stehen vier Einstellungen. Prüfen:

    var EMPFAENGER = 'herr.silvio.lange@googlemail.com';   // wohin die Nachricht geht
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

**Keine Mails.** Ein Workspace-Konto darf 1.500 Empfänger am Tag anschreiben
(ein privates nur 100). Beim Selbsttest zählen zwei Empfänger pro Durchlauf.
`MailApp.getRemainingDailyQuota()` sagt, wie viele heute noch frei sind.

**Spam in der Tabelle.** Das Formular hat ein für Menschen unsichtbares Feld
(„Honigtopf"). Füllt ein Bot es aus, antwortet das Skript freundlich, trägt
aber nichts ein. Kommt trotzdem Müll durch, ist der nächste Schritt ein
Zeitfenster je IP oder ein Rätsel ohne Google — sag Bescheid.
