#!/usr/bin/env node
/**
 * Generates docs/architecture-map.md — the "index" an agent reads (with AGENTS.md)
 * to know the whole code surface WITHOUT grepping the repo every session.
 *
 * Pure Node, zero deps. Derives everything from the on-disk conventions:
 *   - slices     = src/modules/<ctx>/{commands,queries}/<verb-noun>/
 *   - events     = src/modules/<ctx>/domain/events/*.domain-event.ts  (class name == @OnEvent key)
 *   - raise site = `new <EventClass>(` in entity files
 *   - consumers  = `@OnEvent('<EventClass>')`
 *   - contracts  = src/libs/contracts/** /*.query.ts
 *   - endpoints  = @Controller({path,version}) + @Get/@Post/@Patch/@Delete('sub') in *.http.controller.ts
 *
 * Run: `pnpm map`. Regenerate after adding a slice/event/contract; CI checks it is fresh.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const MODULES = join(SRC, 'modules');
const CONTRACTS = join(SRC, 'libs', 'contracts');

/** Recursively list files under dir (returns absolute paths). */
function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function exists(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');
const read = (p) => readFileSync(p, 'utf8');

const contexts = readdirSync(MODULES, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const allSrcFiles = walk(SRC).filter((p) => p.endsWith('.ts') && !p.endsWith('.spec.ts'));

// ---- Endpoints: parse controllers ---------------------------------------
const METHOD_RE = /@(Get|Post|Patch|Put|Delete)\(\s*(?:'([^']*)'|"([^"]*)")?\s*\)/g;
const CTRL_RE = /@Controller\(\s*\{[^}]*?path:\s*['"]([^'"]+)['"][^}]*?(?:version:\s*['"]([^'"]+)['"])?[^}]*?\}/s;
/** slice folder abs path -> "METHOD /vX/path/sub" (first endpoint found). */
function endpointOf(sliceDir) {
  const ctrl = walk(sliceDir).find((p) => p.endsWith('.http.controller.ts'));
  if (!ctrl) return '(bus)';
  const src = read(ctrl);
  const cm = src.match(CTRL_RE);
  const base = cm ? cm[1] : '';
  const ver = cm && cm[2] ? `v${cm[2]}/` : '';
  const eps = [];
  let m;
  METHOD_RE.lastIndex = 0;
  while ((m = METHOD_RE.exec(src))) {
    const method = m[1].toUpperCase();
    const sub = m[2] || m[3] || '';
    const path = ['/' + ver + base, sub].filter(Boolean).join('/').replace(/\/+/g, '/');
    eps.push(`${method} ${path}`);
  }
  return eps.length ? eps.join('<br>') : '(none)';
}

// ---- Slices --------------------------------------------------------------
const slices = {}; // ctx -> [{name,kind,path,endpoint,spec}]
for (const ctx of contexts) {
  slices[ctx] = [];
  for (const kind of ['commands', 'queries']) {
    const kindDir = join(MODULES, ctx, kind);
    if (!exists(kindDir)) continue;
    const names = readdirSync(kindDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    for (const name of names) {
      const dir = join(kindDir, name);
      const files = walk(dir);
      slices[ctx].push({
        name,
        kind: kind === 'commands' ? 'cmd' : 'qry',
        path: rel(dir),
        endpoint: endpointOf(dir),
        spec: files.some((f) => f.endsWith('.spec.ts')) ? '✓' : '✗',
      });
    }
  }
}

// ---- Domain events -------------------------------------------------------
const EVENT_CLASS_RE = /export class (\w+DomainEvent)/;
const events = []; // {name, def, raisedIn:[], consumedBy:[]}
for (const p of allSrcFiles.filter((f) => f.endsWith('.domain-event.ts'))) {
  const m = read(p).match(EVENT_CLASS_RE);
  if (m) events.push({ name: m[1], def: rel(p), raisedIn: [], consumedBy: [] });
}
for (const ev of events) {
  const raiseRe = new RegExp(`new ${ev.name}\\b`);
  const onEventRe = new RegExp(`@OnEvent\\(\\s*['"]${ev.name}['"]`);
  for (const p of allSrcFiles) {
    if (p === join(ROOT, ev.def.replace(/\//g, '/'))) continue;
    const src = read(p);
    if (raiseRe.test(src)) ev.raisedIn.push(rel(p));
    if (onEventRe.test(src)) ev.consumedBy.push(rel(p));
  }
}

// ---- Cross-context contracts --------------------------------------------
const contracts = []; // {name, def, handledBy:[], sentBy:[]}
if (exists(CONTRACTS)) {
  for (const p of walk(CONTRACTS).filter((f) => f.endsWith('.query.ts') && !f.endsWith('.spec.ts'))) {
    const m = read(p).match(/export class (\w+Query)/);
    if (m) contracts.push({ name: m[1], def: rel(p), handledBy: [], sentBy: [] });
  }
}
for (const c of contracts) {
  const handlerRe = new RegExp(`@QueryHandler\\(\\s*${c.name}\\b`);
  const sendRe = new RegExp(`new ${c.name}\\b`);
  for (const p of allSrcFiles) {
    if (p === join(ROOT, c.def)) continue;
    const src = read(p);
    if (handlerRe.test(src)) c.handledBy.push(rel(p));
    if (sendRe.test(src)) c.sentBy.push(rel(p));
  }
}

// ---- Render --------------------------------------------------------------
const shortDef = (p) => p.replace('src/modules/', '').replace('src/libs/', 'libs/');
const list = (arr, empty = '—') =>
  arr.length ? arr.map((p) => `\`${shortDef(p)}\``).join('<br>') : `_${empty}_`;

let md = `# Architecture Map — Event System BE

> **AUTO-GENERATED by \`pnpm map\`** (\`scripts/gen-map.mjs\`). **Do not edit by hand.**
> Read this + [AGENTS.md](../AGENTS.md) = the full code surface, no grepping needed.
> Regenerate after adding/removing a slice, domain event, or contract. CI fails if stale.
>
> **Minimal context per task:** load (1) AGENTS.md, (2) this map, (3) the one slice folder + its aggregate entity. Delegate any wider search to an Explore subagent so file dumps stay out of the main context.

## Slices — use case → folder → endpoint → spec
`;

for (const ctx of contexts) {
  if (!slices[ctx].length) continue;
  md += `\n### \`${ctx}\`\n\n`;
  md += `| Use case | Kind | Endpoint | Spec | Folder |\n|---|---|---|---|---|\n`;
  for (const s of slices[ctx]) {
    md += `| ${s.name} | ${s.kind} | ${s.endpoint} | ${s.spec} | \`${s.path.replace('src/modules/' + ctx + '/', '')}\` |\n`;
  }
}

md += `\n## Domain events — name → raised in → consumed by (via outbox \`@OnEvent\`)\n\n`;
md += `| Event | Raised in | Consumed by | Def |\n|---|---|---|---|\n`;
for (const ev of events.sort((a, b) => a.name.localeCompare(b.name))) {
  md += `| ${ev.name} | ${list(ev.raisedIn)} | ${list(ev.consumedBy, 'none — no handler')} | \`${shortDef(ev.def)}\` |\n`;
}

md += `\n## Cross-context contracts — \`libs/contracts\` (QueryBus, no module import)\n\n`;
if (contracts.length) {
  md += `| Query | Handled by | Sent by | Def |\n|---|---|---|---|\n`;
  for (const c of contracts) {
    md += `| ${c.name} | ${list(c.handledBy)} | ${list(c.sentBy)} | \`${shortDef(c.def)}\` |\n`;
  }
} else {
  md += `_none_\n`;
}

md += `\n---\n_Totals: ${Object.values(slices).flat().length} slices · ${events.length} domain events · ${contracts.length} contracts · ${contexts.length} contexts._\n`;

const OUT = join(ROOT, 'docs', 'architecture-map.md');
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(OUT, md);
console.log(`✓ wrote ${rel(OUT)} (${Object.values(slices).flat().length} slices, ${events.length} events, ${contracts.length} contracts)`);
