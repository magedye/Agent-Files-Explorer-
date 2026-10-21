import test from "node:test";
import assert from "node:assert/strict";
import { messages } from "../src/i18n/messages.js";
import { directionFor, LOCALE_STORAGE_KEY, readLocale, translate } from "../src/i18n/locale.js";

test("UI locales: every message has Arabic/English copy and matching parameters", () => {
  const parameters = (value) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const [key, pair] of Object.entries(messages)) {
    assert.ok(pair.ar?.trim(), `${key}: Arabic copy`);
    assert.ok(pair.en?.trim(), `${key}: English copy`);
    assert.doesNotMatch(pair.en, /[\u0600-\u06ff]/, `${key}: English copy contains Arabic`);
    assert.deepEqual(parameters(pair.ar), parameters(pair.en), `${key}: interpolation contract`);
  }
});

test("UI locales: stored preference chooses language and matching direction", () => {
  const storage = { getItem(key) { assert.equal(key, LOCALE_STORAGE_KEY); return "en"; } };
  assert.equal(readLocale(storage), "en");
  assert.equal(directionFor(readLocale(storage)), "ltr");
  assert.equal(translate("en", "app.reference"), "📜 AGHR Reference");
  assert.equal(directionFor("ar"), "rtl");
});

test("UI locales: absent, corrupt or unavailable storage preserves the Arabic default", () => {
  for (const stored of [null, "fr", "EN", "", "<script>"]) {
    assert.equal(readLocale({ getItem: () => stored }), "ar");
  }
  assert.equal(readLocale({ getItem() { throw new Error("Storage denied"); } }), "ar");
  assert.equal(readLocale(undefined), "ar");
});

test("UI locales: interpolation preserves mixed input, dollar signs and zero counts", () => {
  const id = "$& {version} العربية <sample>";
  assert.equal(translate("en", "adoption.staged", { id }), `Adoption prepared in an isolated staging workspace: ${id}`);
  assert.equal(translate("en", "reference.counts", { rules: 0, sources: 56 }), "0 rules · 56 sources");
  assert.equal(translate("ar", "reference.counts", { rules: 47, sources: 56 }), "47 قواعد · 56 مصادر");
  assert.equal(translate("en", "Unknown server error"), "Unknown server error");
});
