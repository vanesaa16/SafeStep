const fs = require('fs');
const crypto = require('crypto');
const cacheMap = new Map(JSON.parse(fs.readFileSync('voice_audio_cache_db.json', 'utf-8')));
const allKeys = new Set(cacheMap.keys());
const scFile = fs.readFileSync('src/data/scenarios.ts', 'utf-8');

const regex = /(dialogueText|calloutText|feedback|question):\s*"([^"]+)"/g;
let match;
const strings = [];
while ((match = regex.exec(scFile)) !== null) {
  strings.push({ field: match[1], text: match[2] });
}

const personas = [
  { voice: 'Zephyr', tid: 'ibu-zephyr' },
  { voice: 'Puck', tid: 'pak-puck' },
  { voice: 'Kore', tid: 'ibu-kore' },
  { voice: 'Charon', tid: 'pak-charon' },
  { voice: 'Fenrir', tid: 'pak-fenrir' }
];

const npcIds = [
  'school-npc-1', 'school-npc-2', 'school-npc-3', 'school-npc-4', 'school-npc-5',
  'class-npc-1', 'class-npc-2', 'class-npc-3', 'class-npc-4', 'class-npc-5',
  'street-npc-1', 'street-npc-2', 'street-npc-3', 'street-npc-4', 'street-npc-5',
  'home-npc-1', 'home-npc-2', 'home-npc-3', 'home-npc-4', 'home-npc-5',
  'stranger'
];

for (const item of strings) {
  for (const name of ['Ananda', 'Vanessa', '']) {
    const raw = item.text.replace(/\[Nama Anak\]/g, name).trim();
    const clean = raw.replace(/^['"]|['"]$/g, '').trim();
    const vars = [raw, clean];
    for (const v of vars) {
      for (const p of personas) {
        for (const isCorr of [true, false]) {
          const tDisc = `teacher|${p.tid}|${isCorr ? 'correct' : 'retry'}|${p.voice}`;
          const th = crypto.createHash('sha256').update(`${tDisc}|${v}`).digest('hex');
          if (allKeys.has(th)) {
            console.log(`MATCH T: ${tDisc} -> "${v.slice(0, 40)}"`);
            allKeys.delete(th);
          }
        }
        for (const mode of ['dialog', 'callout']) {
          for (const nid of npcIds) {
            const nDisc = `npc|${nid}|${mode}|${p.voice}`;
            const nh = crypto.createHash('sha256').update(`${nDisc}|${v}`).digest('hex');
            if (allKeys.has(nh)) {
              console.log(`MATCH N: ${nDisc} -> "${v.slice(0, 40)}"`);
              allKeys.delete(nh);
            }
          }
        }
      }
    }
  }
}
console.log('Unmatched keys count:', allKeys.size);
for (const k of allKeys) {
  console.log('Unmatched key:', k);
}
