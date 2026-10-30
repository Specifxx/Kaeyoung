import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_POSTS } from "@/content/blog";
import { ADVICE_POSTS } from "@/content/blog-advice";

test("post slugs are unique", () => {
  const slugs = ALL_POSTS.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("every advice pick is a valid pattern and its links stay on the site", () => {
  for (const p of ADVICE_POSTS) {
    for (const s of p.sections ?? []) {
      if (s.picks) assert.doesNotThrow(() => new RegExp(s.picks!.match, "i"), p.slug);
      for (const t of s.p) for (const m of t.matchAll(/\]\(([^)]+)\)/g)) assert.ok(m[1].startsWith("/"), `${p.slug}: ${m[1]}`);
    }
  }
});

test("advice posts make no medical claims", () => {
  const banned = /\b(cures?|heals?|treats? (acne|eczema|rosacea)|clinically proven|guaranteed|dermatologist[- ]approved|miracle cure)\b/i;
  for (const p of ADVICE_POSTS) {
    const text = [p.title, p.description, ...(p.sections ?? []).flatMap((s) => [s.h ?? "", ...s.p])].join(" ");
    assert.ok(!banned.test(text), `${p.slug}: ${text.match(banned)?.[0]}`);
  }
});
