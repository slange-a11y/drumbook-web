import AppKit
import CoreImage

// ---------------------------------------------------------------- Einstellungen
//
// Zwei Zettel, A5, einseitig, Farbe:
//
//   drumbook-zettel-schueler.pdf   geht an den Schueler. Bild oben, ein
//                                  Versprechen, drei Szenen, ein Aufruf.
//   drumbook-zettel-lehrer.pdf     geht an den Lehrer. Der Bericht ist das
//                                  Bild — das ist das Einzige, was ihn erreicht.
//
// Beide zeigen auf eine EIGENE Landeseite, nicht auf die Startseite: Wer vom
// Papier kommt, will eintragen, nicht lesen. Ein Code, der auf einer langen
// Startseite landet, verliert laut Auswertungen 40 bis 50 Prozent der Scans.
//
// Der QR-Code ist 108 pt = 38 mm. Das ist die Mindestkante fuer einen Code,
// der aus Armlaenge gescannt wird; der alte Zettel hatte 82 pt = 29 mm.
// Die Adresse steht zusaetzlich getippt darunter — Code UND Adresse bringen
// mehr Ruecklauf als die Adresse allein.

let ZIEL_SCHUELER = "https://drumbook.de/start/"
let ZIEL_LEHRER   = "https://drumbook.de/lehrer/"

let A5   = CGSize(width: 419.53, height: 595.28)   // 148 x 210 mm
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
    let faktor = kante / img.extent.width
    img = img.transformed(by: CGAffineTransform(scaleX: faktor, y: faktor))
    let rep = NSCIImageRep(ciImage: img)
    let out = NSImage(size: rep.size); out.addRepresentation(rep)
    return out
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
func verlauf(in r: CGRect, ctx: CGContext) {
    let farben = [P.bg.withAlphaComponent(0).cgColor, P.bg.cgColor] as CFArray
    let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                       colors: farben, locations: [0, 1])!
    ctx.saveGState(); ctx.clip(to: r)
    ctx.drawLinearGradient(g, start: CGPoint(x: 0, y: r.maxY),
                           end: CGPoint(x: 0, y: r.minY), options: [])
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

// ---------------------------------------------------------------- Schuelerzettel
func schueler(in ctx: CGContext) {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
    P.bg.setFill(); CGRect(origin: .zero, size: A5).fill()

    let b = A5.width - RAND * 2
    let fotoHoehe: CGFloat = 185
    let fotoRect = CGRect(x: 0, y: A5.height - fotoHoehe, width: A5.width, height: fotoHoehe)

    if let cg = bild(FOTO) {
        fuelle(cg, in: fotoRect, ctx: ctx, versatz: -0.55)
    } else {
        // Platzhalter, damit sich das Layout pruefen laesst.
        hex("1c1c22").setFill(); fotoRect.fill()
        schreib(attr("HIER KOMMT DAS FOTO HIN — tools/zettel/set.jpg fehlt",
                     font(10, .semibold), hex("f9812c"), sperrung: 0.6),
                x: RAND, y: fotoRect.midY + 8, breite: b)
        warne("set.jpg fehlt — der Schuelerzettel hat nur einen Platzhalter. NICHT drucken.")
    }
    // Das Foto laeuft unten in den Seitengrund, oben wird es abgedunkelt,
    // damit die Wortmarke darauf lesbar bleibt.
    verlauf(in: CGRect(x: 0, y: fotoRect.minY, width: A5.width, height: 72), ctx: ctx)
    // Die Wortmarke steht unten links im Bild, nicht oben: oben ist das Gesicht.
    kopf(y: fotoRect.minY + 36, ueber: true, ctx: ctx)

    // Ein Telefon, halb im Foto, halb im dunklen Grund. Es kostet keine
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
    if let cg = bild(ORDNER + "/assets/shots/07-session.jpg") {
        fuelle(cg, in: tr, ctx: ctx, radius: 9)
    } else {
        warne("Bildschirmfoto fehlt: 07-session.jpg")
    }

    var y = tr.minY - 14

    y -= schreib(attr("Du übst. Aber wirst du besser?",
                      font(27, .bold), P.ink, zeilen: 1.01, sperrung: -0.7),
                 x: RAND, y: y, breite: b)
    y -= 10

    y -= schreib(attr("Drumbook sagt dir, was heute dran ist — und nach vier Wochen "
                    + "siehst du schwarz auf weiß, dass es vorangeht.",
                      font(10.2, .regular), P.muted, zeilen: 1.34),
                 x: RAND, y: y, breite: b)
    y -= 13

    // --- Drei Szenen, keine Funktionsnamen.
    // Ein Satz statt einer Liste. Auf einem Zettel, der zehn Sekunden bekommt,
    // schlaegt Reihenfolge Vollstaendigkeit.
    P.accent.setFill()
    NSBezierPath(ovalIn: CGRect(x: RAND + 1, y: y - 8.5, width: 3.6, height: 3.6)).fill()
    y -= schreib(attr("Der Klick läuft weiter, wenn beide Hände am Stock sind. Und dein "
                    + "Lehrer bekommt ein PDF statt eines Schulterzuckens.",
                      font(10.2, .semibold), P.ink, zeilen: 1.22),
                 x: RAND + 13, y: y, breite: b - 13)
    y -= 9

    y = qrBlock(y: y, ziel: ZIEL_SCHUELER,
                titel: "Scannen und heute noch üben",
                unterzeile: "Adresse eintragen, Einladung kommt per Mail. "
                          + "Vorbereiten musst du nichts.",
                adresse: "drumbook.de/start",
                ctx: ctx)
    y -= 12

    y -= schreib(attr("Im Test kostenlos, später ein Abo. Kein Konto, keine Werbung — "
                    + "alles bleibt auf deinem Gerät.",
                      font(8.2, .regular), P.muted, zeilen: 1.26),
                 x: RAND, y: y, breite: b)
    y -= 3
    y -= schreib(attr("Gebaut von Silvio, der selbst Schlagzeugunterricht nimmt. Schreib "
                    + "mir, was fehlt — oft ist es eine Woche später drin.",
                      font(8.2, .semibold), P.accent, zeilen: 1.26),
                 x: RAND, y: y, breite: b)

    melde("schueler", unten: y)
    NSGraphicsContext.restoreGraphicsState()
}

// ---------------------------------------------------------------- Lehrerzettel
func lehrer(in ctx: CGContext) {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
    P.bg.setFill(); CGRect(origin: .zero, size: A5).fill()

    let b = A5.width - RAND * 2
    var y = A5.height - RAND
    kopf(y: y, ueber: false, ctx: ctx)
    y -= 40

    y -= schreib(attr("FÜR SCHLAGZEUGLEHRER", font(7.4, .semibold), P.accent, sperrung: 1.3),
                 x: RAND, y: y, breite: b)
    y -= 8

    y -= schreib(attr("Sie üben zu Hause. Sie wissen nur nicht, was.",
                      font(21.5, .bold), P.ink, zeilen: 1.03, sperrung: -0.5),
                 x: RAND, y: y, breite: b)
    y -= 7

    y -= schreib(attr("Die ehrlichste Antwort auf „Und, hast du geübt?“ ist ein "
                    + "Schulterzucken — nicht weil gelogen wird, sondern weil sich nach "
                    + "einer Woche niemand erinnert, wie lange.",
                      font(9.8, .regular), P.muted, zeilen: 1.3),
                 x: RAND, y: y, breite: b)
    y -= 10

    // --- Der Bericht ist das Bild. Er ist das Einzige, was den Lehrer erreicht.
    let bildB: CGFloat = 116
    let bildH: CGFloat = 148
    let bildR = CGRect(x: A5.width - RAND - bildB, y: y - bildH, width: bildB, height: bildH)
    if let cg = bild(ORDNER + "/assets/shots/09-bericht.jpg") {
        fuelle(cg, in: bildR, ctx: ctx, radius: 8, ausschnittOben: 0.62)
        hex("26262c").setStroke()
        let r = NSBezierPath(roundedRect: bildR, xRadius: 8, yRadius: 8)
        r.lineWidth = 0.8; r.stroke()
    } else {
        warne("Bildschirmfoto fehlt: 09-bericht.jpg")
    }
    schreib(attr("Vom Schüler erzeugt.",
                 font(7.4, .regular), P.muted, zeilen: 1.25),
            x: bildR.minX, y: bildR.minY - 4, breite: bildB)

    // Links daneben: was drinsteht und was es Sie kostet (nichts).
    let tb = b - bildB - 18
    var ty = y
    let punkte = [
        ("Ein PDF statt eines Schulterzuckens",
         "Jede Session mit Datum, Dauer und Übung. „96 von 130“ statt Nachfragen."),
        ("Ihre Ansage überlebt die Woche",
         "Was Sie aufgeben, bekommt in seiner Übeliste Vorrang."),
        ("Sie brauchen kein iPhone",
         "Kein Gerät, keine Installation, kein Konto. Der Schüler bringt den "
       + "Bericht mit."),
        ("Keine Schülerdaten bei Ihnen",
         "Alles bleibt beim Schüler. Sie bekommen ein PDF, sonst nichts."),
    ]
    for (fett, rest) in punkte {
        P.accent.setFill()
        NSBezierPath(ovalIn: CGRect(x: RAND + 1, y: ty - 8, width: 3.6, height: 3.6)).fill()
        ty -= schreib(attr(fett, font(9.6, .semibold), P.ink, zeilen: 1.14),
                      x: RAND + 12, y: ty, breite: tb - 12)
        ty -= schreib(attr(rest, font(8.4, .regular), P.muted, zeilen: 1.26),
                      x: RAND + 12, y: ty - 1, breite: tb - 12)
        ty -= 4
    }
    y = min(ty, bildR.minY - 13) - 1

    y = qrBlock(y: y, ziel: ZIEL_LEHRER,
                titel: "Den Zettel für Ihre Schüler holen",
                unterzeile: "Code scannen — dort liegt der Zettel zum Ausdrucken und "
                          + "alles Weitere.",
                adresse: "drumbook.de/lehrer",
                ctx: ctx)
    y -= 12

    y -= schreib(attr("Keine Lehrplattform, kein Klassenbuch, keine Schülerverwaltung — "
                    + "Drumbook macht einen Schüler zu einem, der weiß, was er geübt hat.",
                      font(8.2, .regular), P.muted, zeilen: 1.26),
                 x: RAND, y: y, breite: b)
    y -= 3
    y -= schreib(attr("Gebaut von Silvio Lange, der selbst Schlagzeug lernt. Noch im Test.",
                      font(8.2, .semibold), P.accent, zeilen: 1.26),
                 x: RAND, y: y, breite: b)

    melde("lehrer", unten: y)
    NSGraphicsContext.restoreGraphicsState()
}

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

for (name, zeichne) in [("schueler", schueler), ("lehrer", lehrer)] {
    let pfad = "\(ziel)/drumbook-zettel-\(name).pdf"
    var box = CGRect(origin: .zero, size: A5)
    let ctx = CGContext(URL(fileURLWithPath: pfad) as CFURL, mediaBox: &box, nil)!
    ctx.beginPDFPage(nil); zeichne(ctx); ctx.endPDFPage(); ctx.closePDF()
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
