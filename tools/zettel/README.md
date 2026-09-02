# Zettel mit QR-Code

Erzeugt zwei A5-Seiten als PDF, die auf den öffentlichen TestFlight-Link zeigen:
`drumbook-zettel-dunkel.pdf` (auffällig, für wenige Exemplare oder als Aushang)
und `drumbook-zettel-hell.pdf` (billig zu vervielfältigen, für den Stapel).

    swiftc -O zettel.swift -o zettel && ./zettel .

Beim Lauf meldet das Programm, wo der untere Rand liegt — bleibt der Wert unter
dem Seitenrand von 36 pt, läuft der Inhalt aus der Seite. Genau das ist beim
ersten Versuch passiert, ohne dass man es der Datei angesehen hätte.

`lies-qr.swift` liest den QR-Code aus der fertigen Seite zurück. **Immer laufen
lassen, bevor gedruckt wird** — beim ersten Versuch war der Code abgeschnitten,
und das fiel nur dadurch auf:

    sips -s format png --resampleWidth 900 drumbook-zettel-hell.pdf --out p.png
    swiftc -O lies-qr.swift -o lies-qr && ./lies-qr p.png

Zwei Festlegungen, die nicht zufällig sind: Der QR-Code sitzt **immer auf
hellem Grund**, auch auf der dunklen Fassung — ein invertierter Code wird
längst nicht von jeder Kamera erkannt. Und die Website-Adresse steht bewusst
**nicht** drauf, solange drumbook.de nicht auflöst; eine tote Adresse auf
gedrucktem Papier ist schlimmer als gar keine.
