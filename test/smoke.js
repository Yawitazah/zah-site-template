'use strict';
const assert = require('assert');
const { render } = require('../lib/render');
const { parseBrief } = require('../lib/brief');

const b = parseBrief(JSON.stringify({ business: 'Northside Plumbing', city: 'Rock Hill', state: 'SC', services: ['Water heaters: repair', 'Drains'], phone: '(803) 555-0142' }));
assert.strictEqual(b.initials, 'NP');
assert.strictEqual(b.place, 'Rock Hill, SC');
assert.strictEqual(b.telHref, 'tel:8035550142');
assert.deepStrictEqual(b.serviceRows[0], { name: 'Water heaters', line: 'repair' });
assert.deepStrictEqual(b.serviceRows[1], { name: 'Drains', line: '' });

const out = render('{{business}}|{{#serviceRows}}[{{@i}} {{.name}}{{#if .line}}: {{.line}}{{/if}}{{^if .line}} (ask){{/if}}]{{/serviceRows}}|{{#if hours}}H{{/if}}{{^if hours}}no hours{{/if}}|{{{raw}}}|{{esc}}', Object.assign({ raw: '<b>x</b>', esc: '<b>' }, b));
assert.strictEqual(out, 'Northside Plumbing|[01 Water heaters: repair][02 Drains (ask)]|no hours|<b>x</b>|&lt;b&gt;');
assert.ok(!/\{\{/.test(out));

assert.strictEqual(render('{{#services}}[{{.}}]{{/services}}', b), '[Water heaters: repair][Drains]');

const empty = parseBrief('');
assert.ok(empty.services.length === 3 && empty.business === 'Your Business');
console.log('ALL PASSED');
