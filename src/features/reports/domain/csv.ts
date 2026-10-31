export type CsvLine = {
  day: string;
  kind: string;
  paisa: number;
  account: string;
  category: string;
  note: string;
};

const HEADERS = ['তারিখ', 'ধরন', 'পয়সা', 'হিসাব', 'খাত', 'নোট'];

function cell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function toCsv(rows: CsvLine[]): string {
  const lines = [
    HEADERS.map(cell).join(','),
    ...rows.map((row) =>
      [row.day, row.kind, String(row.paisa), row.account, row.category, row.note].map(cell).join(','),
    ),
  ];
  return `\uFEFF${lines.join('\n')}`;
}

function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

export function paisaColumnTotal(csv: string): number {
  const text = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  return text
    .split('\n')
    .slice(1)
    .filter((line) => line.length > 0)
    .reduce((sum, line) => sum + Number(splitCsv(line)[2] ?? 0), 0);
}
