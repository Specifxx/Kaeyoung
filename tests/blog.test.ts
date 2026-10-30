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

test("a scheduled post is not live before its date, and a live post never links to one that isn't out yet", async () => {
  const { isLive } = await import("@/content/blog");
  const future = ALL_POSTS.find((p) => p.date > "2026-10-30");
  assert.ok(future, "some posts are scheduled");
  assert.equal(isLive(future!, "2026-10-30"), false);
  assert.equal(isLive(future!, future!.date), true);
  const date = Object.fromEntries(ALL_POSTS.map((p) => [p.slug, p.date]));
  for (const p of ALL_POSTS)
    for (const s of p.sections ?? [])
      for (const t of s.p)
        for (const m of t.matchAll(/\]\(\/blog\/([^)#?]+)\)/g)) {
          assert.ok(date[m[1]], `${p.slug} links to unknown post ${m[1]}`);
          assert.ok(date[m[1]] <= p.date, `${p.slug} (${p.date}) links to ${m[1]}, out ${date[m[1]]}`);
        }
});

test("no post is dated before it was written, and an update is never before publication", () => {
  // Honest dates (DECISIONS.md "Honest blog dates"): the blog launched 2026-10-30.
  for (const p of ALL_POSTS) {
    assert.ok(p.date >= "2026-10-30", `${p.slug} is backdated (${p.date})`);
    if (p.updated) assert.ok(p.updated >= p.date, p.slug);
    for (const x of p.sources ?? []) assert.match(x.url, /^https:\/\//, p.slug);
  }
});
