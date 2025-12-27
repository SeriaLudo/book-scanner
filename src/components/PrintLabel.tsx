interface BookItem {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  groupId?: string;
}

interface Group {
  id: string;
  name: string;
}

interface PrintLabelProps {
  group: Group;
  items: BookItem[];
}

export default function PrintLabel({group, items}: Readonly<PrintLabelProps>) {
  return (
    <div className="print:border print:border-gray-300 print:p-8 print:break-inside-avoid print:mb-0">
      <div className="print:text-2xl print:font-bold print:mb-2 print:mt-0">{group.name}</div>
      <div className="print:text-sm print:text-gray-700 print:mb-2">
        {items.length} item{items.length === 1 ? '' : 's'}
      </div>
      <ol className="print:mt-2 print:text-xs print:space-y-1">
        {items.slice(0, 10).map((it, i) => (
          <li key={it.id}>
            {i + 1}. {it.title} {it.authors.length ? `— ${it.authors.join(', ')}` : ''}
          </li>
        ))}
        {items.length > 10 && <li>… and {items.length - 10} more</li>}
      </ol>
    </div>
  );
}
