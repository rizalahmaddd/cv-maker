import { zipSync } from 'fflate';

export async function makeZip(files: File[], name: string): Promise<File> {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    let n = f.name;
    for (let i = 2; entries[n]; i++) n = f.name.replace(/(\.[^.]+)?$/, `_${i}$1`);
    entries[n] = new Uint8Array(await f.arrayBuffer());
  }
  // Already-compressed formats (PDF, JPG, PNG, DOCX) gain nothing from deflate, so level 0 keeps it fast on phones.
  const data = zipSync(entries, { level: 0 });
  return new File([data], name, { type: 'application/zip' });
}
