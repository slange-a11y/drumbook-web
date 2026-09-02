import AppKit
import CoreImage
// Liest den QR-Code aus der fertigen Seite zurueck - der Beweis, dass er stimmt.
let ctx = CIContext()
let det = CIDetector(ofType: CIDetectorTypeQRCode, context: ctx,
                     options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
for datei in CommandLine.arguments.dropFirst() {
    guard let img = CIImage(contentsOf: URL(fileURLWithPath: datei)) else {
        print("\(datei): nicht lesbar"); continue }
    let treffer = det.features(in: img).compactMap { ($0 as? CIQRCodeFeature)?.messageString }
    print("\((datei as NSString).lastPathComponent): \(treffer.isEmpty ? ["NICHTS ERKANNT"] : treffer)")
}
