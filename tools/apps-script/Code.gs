/**
 * Drumbook — Empfang für das Formular auf der Website.
 *
 * Nimmt eine Eintragung entgegen, schreibt sie in ein Tabellenblatt und
 * schickt eine Nachricht an DICH. Auf Wunsch bekommt der Absender eine
 * kurze Empfangsbestätigung.
 *
 * Einrichten: siehe README.md im selben Ordner. Kurzfassung —
 * Tabelle anlegen, Erweiterungen ▸ Apps Script, diesen Code einfügen,
 * EMPFAENGER eintragen, dann Bereitstellen ▸ Neue Bereitstellung ▸
 * Web-App, „Ausführen als: Ich", „Zugriff: Jeder". Die /exec-Adresse
 * kommt in index.html und en/index.html in das Feld data-endpoint.
 *
 * ÄNDERN ist etwas anderes als EINRICHTEN: „Neue Bereitstellung" legt
 * eine zweite Bereitstellung mit einer NEUEN /exec-Adresse an — die auf
 * der Website eingetragene zeigt dann weiter auf den alten Code. Wer
 * bestehenden Code austauschen will, nimmt Bereitstellen ▸
 * Bereitstellungen verwalten ▸ Stift ▸ Version: „Neue Version" ▸
 * Bereitstellen. Dann bleibt die Adresse dieselbe.
 */

// ---------------------------------------------------------------------------
// Einstellungen
// ---------------------------------------------------------------------------

/** Wohin die Benachrichtigung geht. */
var EMPFAENGER = 'silvio@drumbook.de';

/** Kurze Empfangsbestätigung an den Absender schicken? */
var BESTAETIGUNG_SENDEN = true;

/** Name, der als Absender erscheint. */
var ABSENDERNAME = 'Drumbook';

/** Blattname in der Tabelle. Wird angelegt, wenn er fehlt. */
var BLATT = 'Warteliste';

/** Obergrenzen, damit niemand die Tabelle vollschreibt. */
var MAX_LAENGE_NACHRICHT = 2000;
var MAX_LAENGE_NAME = 120;

// ---------------------------------------------------------------------------

/**
 * Direktaufruf im Browser. Nur damit dort nichts Kryptisches steht.
 */
function doGet() {
  return ContentService
      .createTextOutput(JSON.stringify({ ok: true, hinweis: 'Dieser Endpunkt nimmt nur POST entgegen.' }))
      .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Die Eintragung vom Formular.
 *
 * Die Seite schickt JSON mit dem Inhaltstyp text/plain — das ist Absicht:
 * application/json löst eine Vorabanfrage (OPTIONS) aus, die Apps Script
 * nicht beantwortet, und dann scheitert es an CORS, bevor dieser Code
 * überhaupt läuft.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return antwort(false, 'Keine Daten empfangen.');
    }

    var daten;
    try {
      daten = JSON.parse(e.postData.contents);
    } catch (fehler) {
      return antwort(false, 'Daten nicht lesbar.');
    }

    // Honigtopf: ein für Menschen unsichtbares Feld. Ist es ausgefüllt,
    // war ein Bot am Werk. Wir antworten freundlich, tragen aber nichts ein —
    // sonst weiß der Bot, dass er erkannt wurde, und versucht es anders.
    if (daten.website) {
      return antwort(true, 'Danke.');
    }

    var email = String(daten.email || '').trim();
    if (!istEmail(email)) {
      return antwort(false, 'Diese Adresse sieht nicht nach einer E-Mail-Adresse aus.');
    }

    // Ohne Einwilligung wird nichts gespeichert.
    if (daten.einwilligung !== true) {
      return antwort(false, 'Ohne die Einwilligung geht es nicht.');
    }

    var name = kuerzen(String(daten.name || '').trim(), MAX_LAENGE_NAME);
    var nachricht = kuerzen(String(daten.nachricht || '').trim(), MAX_LAENGE_NACHRICHT);
    var sprache = daten.sprache === 'en' ? 'en' : 'de';
    var zeit = new Date();

    eintragen(zeit, email, name, nachricht, sprache);
    benachrichtigen(zeit, email, name, nachricht, sprache);

    if (BESTAETIGUNG_SENDEN) {
      bestaetigen(email, name, sprache);
    }

    return antwort(true, sprache === 'en'
        ? 'Thanks — you are on the list.'
        : 'Danke — du stehst auf der Liste.');

  } catch (fehler) {
    // Nie den echten Fehlertext nach draußen geben.
    console.error('doPost: ' + fehler);
    return antwort(false, 'Da ist etwas schiefgegangen.');
  }
}

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

function antwort(ok, meldung) {
  return ContentService
      .createTextOutput(JSON.stringify({ ok: ok, meldung: meldung }))
      .setMimeType(ContentService.MimeType.JSON);
}

function istEmail(wert) {
  return wert.length <= 254 && /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(wert);
}

function kuerzen(wert, max) {
  return wert.length > max ? wert.slice(0, max) + '…' : wert;
}

/** Schreibt eine Zeile in die Tabelle und legt sie beim ersten Mal an. */
function eintragen(zeit, email, name, nachricht, sprache) {
  var tabelle = SpreadsheetApp.getActiveSpreadsheet();
  var blatt = tabelle.getSheetByName(BLATT);

  if (!blatt) {
    blatt = tabelle.insertSheet(BLATT);
    blatt.appendRow(['Zeitpunkt', 'E-Mail', 'Name', 'Nachricht', 'Sprache', 'Benachrichtigt am']);
    blatt.getRange(1, 1, 1, 6).setFontWeight('bold');
    blatt.setFrozenRows(1);
    blatt.setColumnWidth(1, 150);
    blatt.setColumnWidth(2, 230);
    blatt.setColumnWidth(4, 380);
  }

  // Doppelte Eintragungen derselben Adresse überschreiben nichts, sondern
  // bekommen eine eigene Zeile — der Zeitpunkt sagt dann, was zuerst kam.
  blatt.appendRow([zeit, email, name, nachricht, sprache, '']);
}

/** Die Nachricht an dich. */
function benachrichtigen(zeit, email, name, nachricht, sprache) {
  var zeile = [
    'Neue Eintragung in die Drumbook-Warteliste.',
    '',
    'Adresse:   ' + email,
    'Name:      ' + (name || '—'),
    'Sprache:   ' + (sprache === 'en' ? 'Englisch' : 'Deutsch'),
    'Zeitpunkt: ' + Utilities.formatDate(zeit, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm'),
    ''
  ];

  if (nachricht) {
    zeile.push('Nachricht:', nachricht, '');
  }

  zeile.push('Die vollständige Liste steht in der Tabelle:',
             SpreadsheetApp.getActiveSpreadsheet().getUrl());

  MailApp.sendEmail({
    to: EMPFAENGER,
    replyTo: email,
    subject: 'Drumbook: ' + email + ' möchte Bescheid bekommen',
    body: zeile.join('\n'),
    name: ABSENDERNAME
  });
}

/** Die kurze Empfangsbestätigung an den Absender. */
function bestaetigen(email, name, sprache) {
  var anrede = name ? (sprache === 'en' ? 'Hi ' + name : 'Hallo ' + name) :
                      (sprache === 'en' ? 'Hi' : 'Hallo');

  var text = sprache === 'en' ? [
    anrede + ',',
    '',
    'you are on the list for Drumbook. You will hear from me exactly once —',
    'when the app is ready to try. No newsletter, nothing in between.',
    '',
    'If this was not you, simply ignore this message. Nothing else will',
    'arrive, and you can ask to be removed at any time by replying here.',
    '',
    'Silvio'
  ] : [
    anrede + ',',
    '',
    'du stehst auf der Liste für Drumbook. Du hörst genau einmal wieder',
    'etwas von mir — wenn die App zum Ausprobieren bereitsteht. Kein',
    'Rundbrief, nichts dazwischen.',
    '',
    'Warst du das nicht, ignoriere die Nachricht einfach. Es kommt sonst',
    'nichts, und du kannst jederzeit mit einer Antwort auf diese Mail',
    'verlangen, dass die Adresse gelöscht wird.',
    '',
    'Viele Grüße',
    'Silvio'
  ];

  MailApp.sendEmail({
    to: email,
    replyTo: EMPFAENGER,
    subject: sprache === 'en' ? 'Drumbook: you are on the list'
                              : 'Drumbook: du stehst auf der Liste',
    body: text.join('\n'),
    name: ABSENDERNAME
  });
}

// ---------------------------------------------------------------------------
// Zum Ausprobieren im Editor — schickt echte Mails, also sparsam benutzen.
// ---------------------------------------------------------------------------

function selbsttest() {
  var ergebnis = doPost({
    postData: {
      contents: JSON.stringify({
        email: EMPFAENGER,
        name: 'Selbsttest',
        nachricht: 'Diese Zeile stammt aus dem Selbsttest im Skripteditor.',
        einwilligung: true,
        sprache: 'de'
      })
    }
  });
  console.log(ergebnis.getContent());
  console.log('Noch frei heute: ' + MailApp.getRemainingDailyQuota() + ' Empfänger');
}
