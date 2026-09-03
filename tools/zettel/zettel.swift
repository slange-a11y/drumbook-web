import AppKit
import CoreImage

// ---------------------------------------------------------------- Einstellungen
let LINK = "https://testflight.apple.com/join/xPCHqUJt"
let A5   = CGSize(width: 419.53, height: 595.28)   // 148 x 210 mm
let RAND: CGFloat = 36

struct Palette {
    let bg, ink, muted, accent, panel, panelInk: NSColor
    let name: String
}
func hex(_ s: String, _ a: CGFloat = 1) -> NSColor {
    var v: UInt64 = 0; Scanner(string: s).scanHexInt64(&v)
    return NSColor(srgbRed: CGFloat((v >> 16) & 0xff)/255,
                   green:   CGFloat((v >>  8) & 0xff)/255,
                   blue:    CGFloat( v        & 0xff)/255, alpha: a)
}
let DUNKEL = Palette(bg: hex("0a0a0c"), ink: hex("f5f5f7"), muted: hex("a1a1aa"),
                     accent: hex("f9812c"), panel: hex("ffffff"), panelInk: hex("0a0a0c"),
                     name: "dunkel")
// Auf Weiss braucht das Orange mehr Tiefe, sonst verschwindet kleiner Text.
let HELL   = Palette(bg: hex("ffffff"), ink: hex("0a0a0c"), muted: hex("55555e"),
                     accent: hex("c25510"), panel: hex("ffffff"), panelInk: hex("0a0a0c"),
                     name: "hell")

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
/// Zeichnet umbrechenden Text und liefert die verbrauchte Hoehe.
@discardableResult
func schreib(_ a: NSAttributedString, x: CGFloat, y: CGFloat, breite: CGFloat) -> CGFloat {
    let h = a.boundingRect(with: CGSize(width: breite, height: .greatestFiniteMagnitude),
                           options: [.usesLineFragmentOrigin, .usesFontLeading]).height
    a.draw(with: CGRect(x: x, y: y - h - 3, width: breite, height: h + 3),
           options: [.usesLineFragmentOrigin, .usesFontLeading])
    return h
}

func qr(_ text: String, kante: CGFloat, dunkel: NSColor, hell: NSColor) -> NSImage {
    let f = CIFilter(name: "CIQRCodeGenerator")!
    f.setValue(text.data(using: .utf8), forKey: "inputMessage")
    f.setValue("H", forKey: "inputCorrectionLevel")        // robust genug fuers Papier
    var img = f.outputImage!
    // Einfaerben: schwarz -> dunkel, weiss -> hell
    let farbe = CIFilter(name: "CIFalseColor")!
    farbe.setValue(img, forKey: kCIInputImageKey)
    farbe.setValue(CIColor(color: dunkel)!, forKey: "inputColor0")
    farbe.setValue(CIColor(color: hell)!,   forKey: "inputColor1")
    img = farbe.outputImage!
    let faktor = kante / img.extent.width
    img = img.transformed(by: CGAffineTransform(scaleX: faktor, y: faktor))
    let rep = NSCIImageRep(ciImage: img)
    let out = NSImage(size: rep.size); out.addRepresentation(rep)
    return out
}

// ---------------------------------------------------------------- Zettel
func zeichne(_ p: Palette, in ctx: CGContext) {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)

    p.bg.setFill(); CGRect(origin: .zero, size: A5).fill()

    let b = A5.width - RAND * 2
    var y = A5.height - RAND

    // --- Kopf. Wortmarke und Unterzeile brauchen getrennte Kaesten,
    //     sonst laufen sie ineinander.
    if let logo = NSImage(contentsOfFile:
        NSHomeDirectory() + "/Developer/drumbook-web/assets/icon-512.png") {
        logo.draw(in: CGRect(x: RAND, y: y - 36, width: 36, height: 36))
    }
    schreib(attr("Drumbook", font(19, .bold), p.ink, sperrung: -0.2),
            x: RAND + 46, y: y - 3, breite: 220)
    let kopfzeile = attr("ÜBETAGEBUCH FÜRS SCHLAGZEUG · DRUMBOOK.DE",
                         font(8, .semibold), p.accent, sperrung: 1.3)
    let kopfhoehe = schreib(kopfzeile, x: RAND + 46, y: y - 28, breite: 300)
    if kopfhoehe > 14 {   // eine Zeile ist ~10 pt; mehr hiesse: laeuft in die Wortmarke
        FileHandle.standardError.write(
            "  \(p.name): ACHTUNG Kopfzeile bricht um (\(kopfhoehe) pt)\n".data(using: .utf8)!)
    }
    y -= 54

    // --- Aufhaenger
    y -= schreib(attr("Eine Stunde geübt. Und wieder nur das gespielt, was du kannst.",
                      font(25, .bold), p.ink, zeilen: 1.05, sperrung: -0.6),
                 x: RAND, y: y, breite: b)
    y -= 9

    y -= schreib(attr("Drumbook plant deine Übesession, hält das Tempo und merkt sich, "
                    + "was im Unterricht gesagt wurde.",
                      font(12, .regular), p.muted, zeilen: 1.3),
                 x: RAND, y: y, breite: b)
    y -= 9

    // --- Drei Punkte, je eine Zeile Erklaerung
    let punkte = [
        ("Ein Ablaufplan statt Bauchgefühl.",
         "Jede Übung bekommt ihre Zeit. Der Wechsel kommt von allein."),
        ("Metronom eingebaut.",
         "Läuft weiter, wenn der Bildschirm dunkel wird."),
        ("Was der Lehrer gesagt hat, steht beim Üben da.",
         "Der Bericht als PDF geht mit in die nächste Stunde."),
    ]
    for (fett, rest) in punkte {
        p.accent.setFill()
        NSBezierPath(ovalIn: CGRect(x: RAND + 1, y: y - 10, width: 4, height: 4)).fill()
        y -= schreib(attr(fett, font(11.5, .semibold), p.ink, zeilen: 1.18),
                     x: RAND + 15, y: y, breite: b - 15)
        y -= schreib(attr(rest, font(10.5, .regular), p.muted, zeilen: 1.25),
                     x: RAND + 15, y: y - 1, breite: b - 15)
        y -= 6
    }
    y -= 3

    // --- QR-Block. Immer heller Grund: ein invertierter Code scannt
    //     laengst nicht auf jedem Telefon.
    let bh: CGFloat = 132
    let block = CGRect(x: RAND, y: y - bh, width: b, height: bh)
    let pfad = NSBezierPath(roundedRect: block, xRadius: 14, yRadius: 14)
    p.panel.setFill(); pfad.fill()
    if p.name == "hell" {
        hex("d8d8dd").setStroke(); pfad.lineWidth = 1; pfad.stroke()
    }

    let kante: CGFloat = 82
    qr(LINK, kante: kante, dunkel: hex("0a0a0c"), hell: hex("ffffff"))
        .draw(in: CGRect(x: block.minX + 14, y: block.minY + (bh - kante)/2,
                         width: kante, height: kante))

    var qy = block.maxY - 22
    let tx = block.minX + 14 + kante + 16
    let tb = block.maxX - tx - 14
    qy -= schreib(attr("Mach mit beim Test", font(13.5, .bold), p.panelInk, sperrung: -0.2),
                  x: tx, y: qy, breite: tb)
    qy -= 1
    qy -= schreib(attr("TestFlight ist Apples eigene Test-App, kostenlos.",
                       font(8.5, .regular), hex("74747e"), zeilen: 1.2),
                  x: tx, y: qy, breite: tb)
    qy -= 8
    for (i, s) in ["„TestFlight“ aus dem App Store laden.",
                   "Diesen Code scannen.",
                   "Drumbook installieren — fertig."].enumerated() {
        hex("f9812c").setFill()
        NSBezierPath(ovalIn: CGRect(x: tx, y: qy - 12.5, width: 13, height: 13)).fill()
        attr("\(i+1)", font(9, .bold), hex("ffffff"))
            .draw(at: CGPoint(x: tx + 4.3, y: qy - 11))
        qy -= schreib(attr(s, font(9.5, .regular), hex("3a3a42"), zeilen: 1.22),
                      x: tx + 19, y: qy, breite: tb - 19)
        qy -= 6
    }
    y = block.minY - 14

    // --- Fuss
    y -= schreib(attr("Kostenlos, solange getestet wird. Keine Werbung, keine Daten — "
                    + "alles bleibt auf deinem Gerät.",
                      font(9.5, .regular), p.muted, zeilen: 1.28),
                 x: RAND, y: y, breite: b)
    y -= 6
    y -= schreib(attr("Gebaut von Silvio, der beim selben Lehrer übt. "
               + "Rückmeldung geht direkt aus TestFlight — ich lese jede.",
                 font(9.5, .semibold), p.accent, zeilen: 1.28),
            x: RAND, y: y, breite: b)

    let bericht = "  \(p.name): unterer Rand bei y = "
                + String(format: "%.1f", y) + " (Seitenrand ist \(RAND))\n"
    FileHandle.standardError.write(bericht.data(using: .utf8)!)

    NSGraphicsContext.restoreGraphicsState()
}

// ---------------------------------------------------------------- Ausgabe
for p in [DUNKEL, HELL] {
    let pfad = "\(CommandLine.arguments[1])/drumbook-zettel-\(p.name).pdf"
    var box = CGRect(origin: .zero, size: A5)
    let ctx = CGContext(URL(fileURLWithPath: pfad) as CFURL, mediaBox: &box, nil)!
    ctx.beginPDFPage(nil); zeichne(p, in: ctx); ctx.endPDFPage(); ctx.closePDF()
    print("geschrieben:", pfad)
}
