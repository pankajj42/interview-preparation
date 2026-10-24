// Compact tab -> problem index so the home page / CTCI index can show per-tab progress without shipping 8,221 slugs twice.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'data/ctci.json'), 'utf8'));
const slugs = [...new Set(d.tabs.flatMap((t) => t.rows.map((r) => r[2])))];
const at = new Map(slugs.map((s, i) => [s, i]));
const tabs = d.tabs.map((t) => ({ slug: t.slug, title: t.title, group: t.group, count: t.rows.length, idx: [...new Set(t.rows.map((r) => at.get(r[2])))] }));
fs.writeFileSync(path.join(root, 'data/ctci-index.json'), JSON.stringify({ slugs, tabs }));
console.log('ctci-index:', slugs.length, 'slugs,', tabs.length, 'tabs');
