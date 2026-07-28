const REQUIRED_HEADERS = [
  "studentId",
  "firstName",
  "lastName",
  "age",
  "gender",
  "course",
  "yearLevel",
  "contactNumber",
  "address",
] as const;

const parseLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
};

export function parseStudentCsv(content: string): Record<string, string | number>[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV must contain a header row and at least one student");
  const headers = parseLine(lines[0] ?? "");
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(", ")}`);

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const age = Number(record.age);
    const yearLevel = Number(record.yearLevel);
    if (!Number.isInteger(age) || !Number.isInteger(yearLevel)) {
      throw new Error(`Invalid age or yearLevel on CSV row ${rowIndex + 2}`);
    }
    return { ...record, age, yearLevel };
  });
}
