'use strict';

/* =========================================================
   BRIEF → PAGE

   A very small template language, so the two designs in ./templates can
   be filled from the five-question brief a stranger answers on
   zahbrandsolutions.com/start without a build step or a dependency.

     {{name}}                escaped text
     {{{name}}}              raw HTML (only for values this server made)
     {{#list}} ... {{/list}} repeat for each item; inside, {{.field}} and {{@i}}
     {{#if name}} ... {{/if}} render when the value is truthy / non-empty list
     {{^if name}} ... {{/if}} render when it is not

   Deliberately no expressions, no partials, no filters. Anything cleverer
   belongs in the client's own edits through ZAH Site MCP, not here.
   ========================================================= */

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function lookup(scopes, key) {
  if (key === '@i') return scopes[0] && scopes[0]['@i'];
  if (key === '.') return scopes[0] && scopes[0]['.'];
  const path = key.startsWith('.') ? key.slice(1) : key;
  for (const s of scopes) {
    if (s && typeof s === 'object' && path in s) return s[path];
  }
  return undefined;
}

const truthy = (v) => Array.isArray(v) ? v.length > 0 : !!v;

function render(tpl, data) {
  return walk(String(tpl), [data]);
}

function walk(tpl, scopes) {
  // Loops first, with their own named closer, so the ifs inside a loop are
  // evaluated per item (in the recursive call) with the item in scope.
  const loop = /\{\{#(?!if\s)([\w.@]+)\}\}([\s\S]*?)\{\{\/\1\}\}/;
  let m;
  while ((m = loop.exec(tpl))) {
    const [whole, key, body] = m;
    const val = lookup(scopes, key);
    const list = Array.isArray(val) ? val : truthy(val) ? [val] : [];
    const out = list.map((item, i) => walk(body, [Object.assign({ '@i': String(i + 1).padStart(2, '0') }, item && typeof item === 'object' ? item : { '.': item }), ...scopes])).join('');
    tpl = tpl.slice(0, m.index) + out + tpl.slice(m.index + whole.length);
  }
  // Then the ifs. Not nestable inside each other, by design.
  const cond = /\{\{([#^])if\s+([\w.@]+)\}\}([\s\S]*?)\{\{\/if\}\}/;
  while ((m = cond.exec(tpl))) {
    const [whole, kind, key, body] = m;
    const on = truthy(lookup(scopes, key));
    const out = (kind === '#' && on) || (kind === '^' && !on) ? walk(body, scopes) : '';
    tpl = tpl.slice(0, m.index) + out + tpl.slice(m.index + whole.length);
  }
  return tpl
    .replace(/\{\{\{([\w.@]+)\}\}\}/g, (_, k) => String(lookup(scopes, k) == null ? '' : lookup(scopes, k)))
    .replace(/\{\{([\w.@]+)\}\}/g, (_, k) => esc(lookup(scopes, k)));
}

module.exports = { render, esc };
