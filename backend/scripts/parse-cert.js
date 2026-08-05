const fs = require('fs');
const PizZip = require('pizzip');
const buf = fs.readFileSync('C:\\Users\\andre\\AppData\\Local\\Temp\\opencode\\colored_cert.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
const paras = [...xml.matchAll(/<w:p>(.*?)<\/w:p>/gs)].map(m => m[1]);
console.log('PARAGRAPHS:', paras.length);
paras.forEach((p, i) => {
  const runs = [...p.matchAll(/<w:r>(.*?)<\/w:r>/gs)].map(m => m[1]);
  const parts = runs.map(r => {
    const t = [...r.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(x => x[1]).join('');
    const u = /<w:u[^>]*>/.test(r);
    const b = /<w:b[^>]*>/.test(r);
    const sz = (r.match(/<w:sz w:val="(\d+)"/) || [])[1];
    const col = (r.match(/<w:color w:val="([0-9A-F]{6})"/) || [])[1];
    return { t, u, b, sz, col };
  }).filter(x => x.t || x.u);
  if (parts.length) console.log('P' + i + ':', JSON.stringify(parts));
});
