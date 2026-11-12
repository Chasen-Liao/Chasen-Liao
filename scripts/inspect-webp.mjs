// Parse a WebP RIFF container: count ANMF frames and read their delays.
import fs from "node:fs";

function riffChunks(buf) {
  const chunks = [];
  let off = 12; // skip "RIFF" + size + "WEBP"
  while (off + 8 <= buf.length) {
    const type = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    chunks.push({ type, size, body: buf.subarray(off + 8, off + 8 + size) });
    off += 8 + size + (size % 2);
  }
  return chunks;
}

for (const file of process.argv.slice(2)) {
  const buf = fs.readFileSync(file);
  const chunks = riffChunks(buf);
  const anim = chunks.find((c) => c.type === "VP8X");
  const anmf = chunks.filter((c) => c.type === "ANMF");
  console.log(`=== ${file}  ${(buf.length / 1024).toFixed(1)} KB`);
  console.log(`  chunks: ${chunks.map((c) => `${c.type}(${c.size})`).join(", ")}`);

  if (anim) {
    const b = anim.body;
    const width = 1 + (b.readUIntLE(4, 3) & 0xffffff);
    const height = 1 + (b.readUIntLE(7, 3) & 0xffffff);
    const flags = b[12];
    console.log(`  canvas: ${width}x${height}  animate=${!!(flags & 0x02)} loop=${flags & 0x03}`);
  }

  if (anmf.length) {
    const delays = [];
    for (const f of anmf) {
      const b = f.body;
      delays.push(b.readUInt16LE(12) + (b.readUInt8(14) / 256));
    }
    const total = delays.reduce((a, d) => a + d, 0);
    console.log(`  frames: ${anmf.length}  total=${total}ms  fps≈${(anmf.length / (total / 1000)).toFixed(2)}`);
    console.log(`  first delays: ${delays.slice(0, 6).join(", ")}  last: ${delays.slice(-3).join(", ")}`);
  }
}
