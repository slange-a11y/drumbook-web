import AppKit
import CoreImage

// ---------------------------------------------------------------- Einstellungen
//
// Zwei Zettel, A5, einseitig, Farbe, und ein Aushang in A4:
//
//   drumbook-zettel-schueler.pdf   geht an den Schueler. Bild oben, ein
//                                  Versprechen, drei Szenen, ein Aufruf.
//   drumbook-zettel-lehrer.pdf     geht an den Lehrer. Der Bericht ist das
//                                  Bild — das ist das Einzige, was ihn erreicht.
//   drumbook-aushang-a4.pdf        haengt in der Musikschule (#241). Dieselbe
//                                  Seite wie der Schuelerzettel, auf A4
//                                  hochgesetzt, mit Text fuer Vorbeigehende.
//
// Der QR-Code ist 108 pt = 38 mm. Das ist die Mindestkante fuer einen Code,
// der aus Armlaenge gescannt wird; der alte Zettel hatte 82 pt = 29 mm.
// Die Adresse steht zusaetzlich getippt darunter — Code UND Adresse bringen
// mehr Ruecklauf als die Adresse allein.

// Beide Codes zeigen auf die Startseite. Eine eigene Landeseite brächte mehr
// Eintragungen (ein Code, der auf einer Startseite landet, verliert einen
// großen Teil der Scans), aber sie zeigt eben auch nur einen Ausschnitt —
// und wer vom Papier kommt, soll sehen, was die App alles kann. Silvios
// Entscheidung vom 17.09.2026. /start/ und /lehrer/ bleiben bestehen und
// sind von der Startseite aus erreichbar.
let ZIEL = "https://drumbook.de/"

let A5   = CGSize(width: 419.53, height: 595.28)   // 148 x 210 mm
let A4   = CGSize(width: 595.28, height: 841.89)   // 210 x 297 mm
let RAND: CGFloat = 36
let ORDNER = NSHomeDirectory() + "/Developer/drumbook-web"

/// Das Foto fuer den Schuelerzettel. Fehlt es, wird ein Platzhalter gezeichnet
/// UND eine Warnung gemeldet — ein Zettel mit Platzhalter darf nie in den Druck.
let FOTO = ORDNER + "/tools/zettel/set.jpg"

// ---------------------------------------------------------------- Farben
struct Palette {
    let bg, ink, muted, accent, panel, panelInk, panelMuted: NSColor
}
func hex(_ s: String, _ a: CGFloat = 1) -> NSColor {
    var v: UInt64 = 0; Scanner(string: s).scanHexInt64(&v)
    return NSColor(srgbRed: CGFloat((v >> 16) & 0xff)/255,
                   green:   CGFloat((v >>  8) & 0xff)/255,
                   blue:    CGFloat( v        & 0xff)/255, alpha: a)
}
let P = Palette(bg: hex("0a0a0c"), ink: hex("f5f5f7"), muted: hex("a1a1aa"),
                accent: hex("f9812c"), panel: hex("ffffff"),
                panelInk: hex("0a0a0c"), panelMuted: hex("5b5b64"))

// ---------------------------------------------------------------- Werkzeug
func font(_ size: CGFloat, _ w: NSFont.Weight) -> NSFont {
    NSFont.systemFont(ofSize: size, weight: w)
}
func attr(_ s: String, _ f: NSFont, _ c: NSColor,
          zeilen: CGFloat = 1.14, sperrung: CGFloat = 0) -> NSAttributedString {
    let p = NSMutableParagraphStyle()
    p.lineHeightMultiple = zeilen
    return NSAttributedString(string: s, attributes: [
        .font: f, .foregroundColor: c, .paragraphStyle: p, .kern: sperrung])
}
/// Zeichnet umbrechenden Text von y nach unten und liefert die verbrauchte Hoehe.
@discardableResult
func schreib(_ a: NSAttributedString, x: CGFloat, y: CGFloat, breite: CGFloat) -> CGFloat {
    let h = a.boundingRect(with: CGSize(width: breite, height: .greatestFiniteMagnitude),
                           options: [.usesLineFragmentOrigin, .usesFontLeading]).height
    a.draw(with: CGRect(x: x, y: y - h - 3, width: breite, height: h + 3),
           options: [.usesLineFragmentOrigin, .usesFontLeading])
    return h
}

var warnungen: [String] = []
func warne(_ s: String) { warnungen.append(s) }

func qr(_ text: String, kante: CGFloat) -> NSImage {
    let f = CIFilter(name: "CIQRCodeGenerator")!
    f.setValue(text.data(using: .utf8), forKey: "inputMessage")
    f.setValue("H", forKey: "inputCorrectionLevel")        // robust genug fuers Papier
    var img = f.outputImage!
    // Immer schwarz auf weiss. Ein eingefaerbter oder invertierter Code wird
    // laengst nicht von jeder Telefonkamera erkannt.
    //
    // Gerechnet mit vier Pixeln je Punkt und einem ganzzahligen Faktor je
    // Modul: Bis zum 26.09.2026 waren es 100 Pixel fuer 100 Punkt, also 72 dpi,
    // und auf dem A4-Aushang waeren die Kanten der Module weich gedruckt.
    //
    // Ueber ein echtes Bitmap, nicht ueber NSCIImageRep: Das zeichnet Pixel
    // gleich Punkt und schneidet ab, was darueber hinausgeht. Mit der
    // groesseren Aufloesung stand am 26.09.2026 nur noch eine Ecke des Codes
    // auf dem Zettel.
    let faktor = (kante * 4 / img.extent.width).rounded(.up)
    img = img.transformed(by: CGAffineTransform(scaleX: faktor, y: faktor))
    let cg = CIContext().createCGImage(img, from: img.extent)!
    return NSImage(cgImage: cg, size: NSSize(width: kante, height: kante))
}

/// Laedt ein Bild als CGImage. Liefert nil, wenn es fehlt.
func bild(_ pfad: String) -> CGImage? {
    guard let d = NSImage(contentsOfFile: pfad) else { return nil }
    return d.cgImage(forProposedRect: nil, context: nil, hints: nil)
}

/// Zeichnet ein Bild formatfuellend in ein Rechteck — wie „aspect fill":
/// der Ueberstand wird beschnitten, nichts wird verzerrt.
func fuelle(_ cg: CGImage, in r: CGRect, ctx: CGContext,
            radius: CGFloat = 0, ausschnittOben: CGFloat? = nil,
            versatz: CGFloat = 0) {
    ctx.saveGState()
    if radius > 0 {
        let p = CGPath(roundedRect: r, cornerWidth: radius, cornerHeight: radius, transform: nil)
        ctx.addPath(p); ctx.clip()
    } else {
        ctx.clip(to: r)
    }
    var quelle = CGRect(x: 0, y: 0, width: CGFloat(cg.width), height: CGFloat(cg.height))
    if let anteil = ausschnittOben {
        // Nur den oberen Teil des Bildes benutzen (CGImage: Ursprung oben links).
        quelle.size.height = CGFloat(cg.height) * anteil
    }
    guard let teil = cg.cropping(to: quelle) else { ctx.restoreGState(); return }
    let bq = CGFloat(teil.width) / CGFloat(teil.height)
    let br = r.width / r.height
    var ziel = r
    if bq > br {                       // Bild ist breiter: Hoehe fuellen, seitlich kappen
        ziel.size.width = r.height * bq
        ziel.origin.x = r.midX - ziel.width / 2
    } else {                           // Bild ist hoeher: Breite fuellen, oben/unten kappen
        ziel.size.height = r.width / bq
        // versatz: -1 zeigt den oberen Rand des Bildes, +1 den unteren, 0 die Mitte.
        let spiel = (ziel.height - r.height) / 2
        ziel.origin.y = r.midY - ziel.height / 2 + spiel * max(-1, min(1, versatz))
    }
    ctx.draw(teil, in: ziel)
    ctx.restoreGState()
}

/// Ein Verlauf von der Seitenfarbe nach durchsichtig — damit das Foto unten
/// in den Grund laeuft, statt mit einer harten Kante aufzuhoeren.
///
/// Zwei Stufen reichen dafuer nicht: Ein linearer Verlauf setzt oben sichtbar
/// ein, und genau diese Linie sieht man auf dem Papier. Die Stufen unten sind
/// deshalb einer weichen Kurve nachempfunden — oben passiert lange fast
/// nichts, unten geht es zuegig ins Schwarz.
func verlauf(in r: CGRect, ctx: CGContext) {
    // Eine S-Kurve (3t² − 2t³): oben UND unten flach, in der Mitte zuegig.
    // Das obere flache Ende nimmt die sichtbare Linie, wo der Verlauf einsetzt.
    //
    // Und er ist schon bei 86 Prozent fertig, nicht erst am Schluss: Sonst
    // deckt er an der Unterkante des Fotos erst zu 97 Prozent, und genau diese
    // drei Prozent Restbild zeichnen einen Strich quer über die Seite. Die
    // letzten Prozent sind reines Schwarz, darin verschwindet der Bildrand.
    let stufen: [(CGFloat, CGFloat)] = [(0, 0), (0.14, 0.05), (0.28, 0.19),
                                        (0.42, 0.40), (0.56, 0.64),
                                        (0.70, 0.84), (0.80, 0.95),
                                        (0.86, 1), (1, 1)]
    //
    // Gezeichnet als Bildmaske, nicht als Verlauf mit Transparenz. Einen
    // Verlauf mit Alphawerten schreibt CoreGraphics ins PDF deckend, und zwar
    // auf der ganzen Hoehe: Das Foto hoerte deshalb seit dem 17.09.2026 mit
    // einer geraden Kante auf, 64 pt ueber seiner Unterkante. Am 26.09.2026
    // gemessen, im Aushang und im Schuelerzettel, mit zwei Renderwegen. Eine
    // Graustufenmaske traegt die Stufen dagegen zuverlaessig (weiss = deckt).
    let hoehe = 512
    let m = CGContext(data: nil, width: 4, height: hoehe, bitsPerComponent: 8, bytesPerRow: 0,
                      space: CGColorSpaceCreateDeviceGray(),
                      bitmapInfo: CGImageAlphaInfo.none.rawValue)!
    let grau = stufen.map { CGColor(gray: $0.1, alpha: 1) } as CFArray
    let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceGray(),
                       colors: grau, locations: stufen.map { $0.0 })!
    m.drawLinearGradient(g, start: CGPoint(x: 0, y: hoehe),
                         end: CGPoint(x: 0, y: 0), options: [])
    ctx.saveGState()
    ctx.clip(to: r, mask: m.makeImage()!)
    ctx.setFillColor(P.bg.cgColor); ctx.fill(r)
    ctx.restoreGState()
}

/// Dunkler Verlauf von oben nach unten — damit die Wortmarke auf dem Foto
/// lesbar bleibt, ohne dass ein Balken quer durchs Bild laeuft.
func schleier(in r: CGRect, ctx: CGContext) {
    let farben = [hex("000000", 0.62).cgColor, hex("000000", 0).cgColor] as CFArray
    let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                       colors: farben, locations: [0, 1])!
    ctx.saveGState(); ctx.clip(to: r)
    ctx.drawLinearGradient(g, start: CGPoint(x: 0, y: r.maxY),
                           end: CGPoint(x: 0, y: r.minY), options: [])
    ctx.restoreGState()
}

/// Der QR-Block: heller Kasten, Code links, Aufruf rechts.
/// Liefert die Unterkante zurueck.
func qrBlock(y: CGFloat, ziel: String, titel: String, unterzeile: String,
             adresse: String, ctx: CGContext) -> CGFloat {
    let b = A5.width - RAND * 2
    let kante: CGFloat = 100                     // 35 mm — aus Armlaenge scannbar
    let luft: CGFloat = 12
    // Der Kasten richtet sich nach dem, was laenger ist: Code oder Text.
    let textBreite = b - luft * 2 - kante - 16 - 14 + 14
    func hoehe(_ a: NSAttributedString) -> CGFloat {
        a.boundingRect(with: CGSize(width: textBreite, height: .greatestFiniteMagnitude),
                       options: [.usesLineFragmentOrigin, .usesFontLeading]).height
    }
    let textHoehe = hoehe(attr(titel, font(15, .bold), P.panelInk, zeilen: 1.06))
                  + 5 + hoehe(attr(unterzeile, font(9.5, .regular), P.panelMuted, zeilen: 1.3))
                  + 7 + hoehe(attr(adresse, font(10.5, .semibold), P.panelInk))
    let bh = max(kante + luft * 2, textHoehe + luft * 2 + 14)
    let block = CGRect(x: RAND, y: y - bh, width: b, height: bh)
    let pfad = NSBezierPath(roundedRect: block, xRadius: 14, yRadius: 14)
    P.panel.setFill(); pfad.fill()

    qr(ziel, kante: kante).draw(in: CGRect(x: block.minX + luft,
                                           y: block.midY - kante / 2,
                                           width: kante, height: kante))

    let tx = block.minX + luft + kante + 16
    let tb = block.maxX - tx - 14
    var qy = block.maxY - 24
    qy -= schreib(attr(titel, font(15, .bold), P.panelInk, zeilen: 1.06, sperrung: -0.3),
                  x: tx, y: qy, breite: tb)
    qy -= 5
    qy -= schreib(attr(unterzeile, font(9.5, .regular), P.panelMuted, zeilen: 1.3),
                  x: tx, y: qy, breite: tb)
    qy -= 7
    _ = schreib(attr(adresse, font(10.5, .semibold), hex("c25510"), sperrung: 0.1),
                x: tx, y: qy, breite: tb)
    return block.minY
}

func kopf(y: CGFloat, ueber: Bool, ctx: CGContext) {
    // Wortmarke. Ueber dem Foto steht sie hell, sonst im Seitenton.
    if let logo = NSImage(contentsOfFile: ORDNER + "/assets/icon-512.png") {
        logo.draw(in: CGRect(x: RAND, y: y - 26, width: 26, height: 26))
    }
    schreib(attr("Drumbook", font(15, .bold), ueber ? hex("ffffff") : P.ink, sperrung: -0.2),
            x: RAND + 34, y: y - 3, breite: 200)
    schreib(attr("ÜBETAGEBUCH FÜRS SCHLAGZEUG", font(6.8, .semibold),
                 ueber ? hex("ffd9b8") : P.accent, sperrung: 1.2),
            x: RAND + 34, y: y - 21, breite: 220)
}

// ---------------------------------------------------------------- Der Zettel
//
// Beide Zettel sind DIESELBE Seite mit anderem Inhalt: Foto oben, Wortmarke
// unten links im Bild, ein Geraet halb im Foto, Ueberschrift, Unterzeile,
// Punkte, QR-Kasten, zwei Fusszeilen. Nur so sieht man ihnen an, dass sie
// zusammengehoeren — und nur so muss eine Aenderung am Aufbau einmal gemacht
// werden statt zweimal.

struct Inhalt {
    let name: String            // Dateiname: drumbook-zettel-<name>.pdf
    let ueberschrift: String
    let unterzeile: String
    let punkte: [String]        // je Punkt EINE Zeile; laengere brechen um
    let geraetebild: String     // Bildschirmfoto, halb im Foto
    let geraetetext: String     // Alternativtext, nur zur Dokumentation
    let ziel: String            // wohin der QR-Code zeigt
    let ctaTitel: String
    let ctaUnterzeile: String
    let ctaAdresse: String
    let fuss: String
    let fussAkzent: String
}

func zeichne(_ i: Inhalt, in ctx: CGContext) {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
    P.bg.setFill(); CGRect(origin: .zero, size: A5).fill()

    let b = A5.width - RAND * 2
    let fotoHoehe: CGFloat = 185
    let fotoRect = CGRect(x: 0, y: A5.height - fotoHoehe, width: A5.width, height: fotoHoehe)

    if let cg = bild(FOTO) {
        fuelle(cg, in: fotoRect, ctx: ctx, versatz: -0.38)
    } else {
        hex("1c1c22").setFill(); fotoRect.fill()
        schreib(attr("HIER KOMMT DAS FOTO HIN — tools/zettel/set.jpg fehlt",
                     font(10, .semibold), hex("f9812c"), sperrung: 0.6),
                x: RAND, y: fotoRect.midY + 8, breite: b)
        warne("set.jpg fehlt — \(i.name) hat nur einen Platzhalter. NICHT drucken.")
    }
    // Das Foto laeuft unten in den Seitengrund aus.
    // Drei Punkt tiefer als das Foto: An der Unterkante des gezeichneten
    // Bildes bleibt eine ein Pixel hohe Naht aus der Kantenglaettung stehen
    // (gemessen: 19,18,18 statt 10,10,12) — ein feiner heller Strich quer
    // ueber die Seite. Der voll deckende Teil des Verlaufs liegt darueber.
    verlauf(in: CGRect(x: 0, y: fotoRect.minY - 3, width: A5.width, height: 67),
            ctx: ctx)
    // Die Wortmarke steht unten links im Bild, nicht oben: oben ist das Gesicht.
    kopf(y: fotoRect.minY + 36, ueber: true, ctx: ctx)

    // Ein Geraet, halb im Foto, halb im dunklen Grund. Es kostet keine
    // Bauhoehe und beweist trotzdem, dass es die App gibt.
    let tw: CGFloat = 70
    let th = tw * 1522 / 700
    let tr = CGRect(x: A5.width - RAND - tw, y: A5.height - 28 - th, width: tw, height: th)
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -5), blur: 16,
                  color: hex("000000", 0.65).cgColor)
    let rahmen = CGPath(roundedRect: tr.insetBy(dx: -3, dy: -3),
                        cornerWidth: 11, cornerHeight: 11, transform: nil)
    ctx.addPath(rahmen); ctx.setFillColor(hex("1c1c22").cgColor); ctx.fillPath()
    ctx.restoreGState()
    if let cg = bild(ORDNER + "/assets/shots/\(i.geraetebild).jpg") {
        fuelle(cg, in: tr, ctx: ctx, radius: 9)
    } else {
        warne("Bildschirmfoto fehlt: \(i.geraetebild).jpg")
    }

    var y = tr.minY - 14

    y -= schreib(attr(i.ueberschrift, font(27, .bold), P.ink,
                      zeilen: 1.01, sperrung: -0.7),
                 x: RAND, y: y, breite: b)
    y -= 10

    y -= schreib(attr(i.unterzeile, font(10.2, .regular), P.muted, zeilen: 1.34),
                 x: RAND, y: y, breite: b)
    y -= 10

    for punkt in i.punkte {
        P.accent.setFill()
        NSBezierPath(ovalIn: CGRect(x: RAND + 1, y: y - 8.5, width: 3.6, height: 3.6)).fill()
        y -= schreib(attr(punkt, font(10.2, .semibold), P.ink, zeilen: 1.22),
                     x: RAND + 13, y: y, breite: b - 13)
        y -= 4
    }
    y -= 2

    y = qrBlock(y: y, ziel: i.ziel, titel: i.ctaTitel,
                unterzeile: i.ctaUnterzeile, adresse: i.ctaAdresse, ctx: ctx)
    y -= 12

    y -= schreib(attr(i.fuss, font(8.2, .regular), P.muted, zeilen: 1.26),
                 x: RAND, y: y, breite: b)
    y -= 3
    y -= schreib(attr(i.fussAkzent, font(8.2, .semibold), P.accent, zeilen: 1.26),
                 x: RAND, y: y, breite: b)

    melde(i.name, unten: y)
    NSGraphicsContext.restoreGraphicsState()
}

// ---------------------------------------------------------------- Die Inhalte

let SCHUELER = Inhalt(
    name: "schueler",
    // Dieselbe Überschrift wie auf drumbook.de: Wer den Code scannt, muss auf
    // der Seite wiederfinden, was auf dem Papier stand.
    ueberschrift: "Üben mit Plan statt nach Gefühl.",
    unterzeile: "Drumbook stellt die heutige Übeliste zusammen, hält das Tempo "
              + "und merkt sich, was der Lehrer gesagt hat. Damit am Ende der "
              + "Woche nicht nur ein Gefühl steht, sondern ein Verlauf.",
    punkte: ["Der Klick läuft weiter, wenn beide Hände am Stock sind. Und dein "
           + "Lehrer bekommt ein PDF statt eines Schulterzuckens."],
    geraetebild: "07-session",
    geraetetext: "Eine laufende Übesession: Countdown, Metronom und Ablauf.",
    ziel: ZIEL,
    ctaTitel: "Scannen und heute noch üben",
    ctaUnterzeile: "Alles über die App. Die Einladung zur Testrunde "
                 + "forderst du gleich dort an.",
    ctaAdresse: "drumbook.de",
    fuss: "Im Test kostenlos, später ein Abo. Kein Konto, keine Werbung, "
        + "alles bleibt auf deinem Gerät.",
    fussAkzent: "Gebaut von Silvio, der selbst Schlagzeugunterricht nimmt. "
              + "Schreib mir, was fehlt. Oft ist es eine Woche später drin."
)

let LEHRER = Inhalt(
    name: "lehrer",
    ueberschrift: "Sie üben zu Hause. Sie wissen nur nicht, was.",
    unterzeile: "Die ehrlichste Antwort auf „Und, hast du geübt?“ ist ein "
              + "Schulterzucken, weil sich nach einer Woche niemand erinnert.",
    punkte: ["Ein PDF mit Datum, Dauer und erreichtem Tempo.",
             "Ihre Ansage bekommt in seiner Übeliste Vorrang.",
             "Kein iPhone nötig, keine Anmeldung, keine Schülerdaten."],
    geraetebild: "09-bericht",
    geraetetext: "Der Bericht: Übesessions mit Datum, Dauer und erreichtem Tempo.",
    ziel: ZIEL,
    ctaTitel: "Ansehen, bevor Sie es weitergeben",
    ctaUnterzeile: "Alles über Drumbook, samt dem Zettel für Ihre Schüler "
                 + "zum Ausdrucken.",
    ctaAdresse: "drumbook.de",
    fuss: "Keine Lehrplattform, kein Klassenbuch, keine Schülerverwaltung: "
        + "Drumbook macht einen Schüler zu einem, der weiß, was er geübt hat.",
    fussAkzent: "Gebaut von Silvio Lange, der selbst Schlagzeugunterricht nimmt. "
              + "Noch im Test."
)

/// Der Aushang fuer die Musikschule (#241). Wer vorbeigeht, kennt Drumbook
/// nicht und hat keinen Lehrer, der es erklaert: Drei Punkte sagen, was die
/// App tut, der Fuss sagt, was sie kostet. Dieselbe Ueberschrift wie auf der
/// Website, aus demselben Grund wie beim Schuelerzettel.
let AUSHANG = Inhalt(
    name: "aushang",
    ueberschrift: "Üben mit Plan statt nach Gefühl.",
    unterzeile: "Drumbook stellt dir jeden Tag eine Übeliste zusammen, hält "
              + "das Tempo und merkt sich, was dein Lehrer gesagt hat.",
    punkte: ["Die Übeliste für heute steht, bevor du die Stöcke hast.",
             "Der Klick läuft weiter, wenn beide Hände am Stock sind.",
             "Dein Lehrer bekommt einen Bericht statt eines Schulterzuckens."],
    geraetebild: "07-session",
    geraetetext: "Eine laufende Übesession: Countdown, Metronom und Ablauf.",
    ziel: ZIEL,
    ctaTitel: "Scannen und heute noch üben",
    ctaUnterzeile: "Alles über die App, und die Einladung zur Testrunde "
                 + "forderst du dort an.",
    ctaAdresse: "drumbook.de",
    fuss: "Für iPhone und iPad. Im Test kostenlos, später ein Abo für 3 bis "
        + "5 € im Monat. Deine Daten bleiben auf deinem Gerät.",
    fussAkzent: "Gebaut von Silvio, der selbst Schlagzeugunterricht nimmt."
)

// ---------------------------------------------------------------- Ausgabe
func melde(_ name: String, unten y: CGFloat) {
    let text = "  \(name): unterer Rand bei y = " + String(format: "%.1f", y)
             + " (Seitenrand ist \(Int(RAND)))\n"
    FileHandle.standardError.write(text.data(using: .utf8)!)
    if y < RAND {
        warne("\(name): der Inhalt laeuft \(String(format: "%.1f", RAND - y)) pt in den Seitenrand.")
    }
}

let ziel = CommandLine.arguments.count > 1 ? CommandLine.arguments[1]
                                           : ORDNER + "/assets/zettel"
try? FileManager.default.createDirectory(atPath: ziel,
        withIntermediateDirectories: true)

for inhalt in [SCHUELER, LEHRER] {
    let pfad = "\(ziel)/drumbook-zettel-\(inhalt.name).pdf"
    var box = CGRect(origin: .zero, size: A5)
    let ctx = CGContext(URL(fileURLWithPath: pfad) as CFURL, mediaBox: &box, nil)!
    ctx.beginPDFPage(nil); zeichne(inhalt, in: ctx); ctx.endPDFPage(); ctx.closePDF()
    print("geschrieben:", pfad)
}

// Der Aushang ist dieselbe Seite, hochgesetzt. A5 und A4 sind nicht ganz
// deckungsgleich (148 mm mal Wurzel zwei sind 209,3 mm, nicht 210): Gesetzt
// wird nach der Breite, damit das Foto bis an den Rand reicht, und oben
// buendig. Unten fallen dadurch knapp 3 pt vom Seitenrand weg, der Inhalt
// bleibt 48 pt ueber der Kante.
do {
    let pfad = "\(ziel)/drumbook-aushang-a4.pdf"
    var box = CGRect(origin: .zero, size: A4)
    let ctx = CGContext(URL(fileURLWithPath: pfad) as CFURL, mediaBox: &box, nil)!
    ctx.beginPDFPage(nil)
    ctx.setFillColor(P.bg.cgColor); ctx.fill(box)
    let faktor = A4.width / A5.width
    ctx.translateBy(x: 0, y: A4.height - A5.height * faktor)
    ctx.scaleBy(x: faktor, y: faktor)
    zeichne(AUSHANG, in: ctx)
    ctx.endPDFPage(); ctx.closePDF()
    print("geschrieben:", pfad)
}

if warnungen.isEmpty {
    print("keine Warnungen.")
} else {
    FileHandle.standardError.write("\nWARNUNGEN:\n".data(using: .utf8)!)
    for w in warnungen {
        FileHandle.standardError.write("  · \(w)\n".data(using: .utf8)!)
    }
    exit(2)
}
