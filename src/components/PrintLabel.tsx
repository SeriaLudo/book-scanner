import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface BookItem {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  boxId?: string;
}

interface Box {
  id: string;
  name: string;
}

interface PrintLabelProps {
  box: Box;
  items: BookItem[];
}

export default function PrintLabel({ box, items }: PrintLabelProps) {
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      const payload = {
        boxId: box.id,
        name: box.name,
        items: items.map((it) => ({
          isbn: it.isbn,
          title: it.title,
          a: it.authors,
        })),
        v: 1,
      };
      const text = JSON.stringify(payload);
      const dataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 256,
      });
      setQrSrc(dataUrl);
    };

    generateQR();
  }, [box, items]);

  return (
    <div className="print:border print:border-gray-300 print:p-8 print:break-inside-avoid print:mb-0">
      <div className="print:text-2xl print:font-bold print:mb-2 print:mt-0">
        {box.name}
      </div>
      <div className="print:text-sm print:text-gray-700 print:mb-2">
        {items.length} item{items.length === 1 ? "" : "s"}
      </div>
      <div className="print:mt-2">
        {qrSrc ? (
          <img
            src={qrSrc}
            alt={`QR for ${box.name}`}
            className="print:w-16 print:h-16 print:object-contain w-16 h-16 object-contain"
          />
        ) : (
          <div className="print:w-16 print:h-16 print:bg-gray-100 w-16 h-16 bg-gray-100" />
        )}
      </div>
      <ol className="print:mt-2 print:text-xs print:space-y-1">
        {items.slice(0, 10).map((it, i) => (
          <li key={it.id}>
            {i + 1}. {it.title}{" "}
            {it.authors.length ? `— ${it.authors.join(", ")}` : ""}
          </li>
        ))}
        {items.length > 10 && <li>… and {items.length - 10} more</li>}
      </ol>
    </div>
  );
}
