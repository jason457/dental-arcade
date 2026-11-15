/**
 * Applies the real migration to an in-memory Postgres (PGlite) with a stub of Supabase's auth schema.
 * This proves the SQL is valid and the triggers behave. It runs as a superuser, so it does NOT
 * exercise row-level security policies; those need a test against a real Supabase project.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { beforeAll, describe, expect, it } from "vitest";

const U = (n: number) => `00000000-0000-0000-0000-00000000000${n}`;
let db: PGlite;

beforeAll(async () => {
  db = new PGlite({ extensions: { vector } });
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  `);
  await db.exec(readFileSync("supabase/migrations/0001_init.sql", "utf8"));
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  await db.exec(`insert into auth.users(id, email) values ('${U(1)}','author@test'), ('${U(2)}','reviewer@test');`);
  const code = (await db.query<{ referral_code: string }>(`select referral_code from profiles where id='${U(1)}'`)).rows[0].referral_code;
  await db.exec(`insert into auth.users(id, email, raw_user_meta_data) values ('${U(3)}','friend@test', '{"ref":"${code}"}');`);
});

describe("database migration", () => {
  it("seeds the full catalogue", async () => {
    const r = await db.query<{ s: number; p: number; d: number }>(`select (select count(*)::int from specialties) s, (select count(*)::int from procedures) p, (select count(*)::int from procedures where catalogue_status='demo') d`);
    expect(r.rows[0]).toEqual({ s: 11, p: 157, d: 1 });
  });
  it("creates a profile and records the inviter on sign-up", async () => {
    const r = await db.query<{ n: number }>(`select count(*)::int n from profiles`);
    expect(r.rows[0].n).toBe(3);
    const ref = await db.query<{ inviter_id: string; status: string }>(`select inviter_id, status from referrals where referred_id='${U(3)}'`);
    expect(ref.rows[0]).toEqual({ inviter_id: U(1), status: "registered" });
  });
  it("rejects self-referral", async () => {
    await expect(db.exec(`insert into referrals(inviter_id, referred_id) values ('${U(2)}','${U(2)}')`)).rejects.toThrow();
  });
  it("limits free picks to three available procedures", async () => {
    await expect(db.exec(`insert into free_picks(user_id, procedure_id) select '${U(3)}', id from procedures where slug='surgical-extraction'`)).rejects.toThrow(/not available/);
    await db.exec(`update procedures set catalogue_status='demo' where slug in ('surgical-extraction','biopsy','frenectomy')`);
    await db.exec(`insert into free_picks(user_id, procedure_id) select '${U(3)}', id from procedures where slug in ('simple-extraction','surgical-extraction','biopsy')`);
    await expect(db.exec(`insert into free_picks(user_id, procedure_id) select '${U(3)}', id from procedures where slug='frenectomy'`)).rejects.toThrow(/three/);
  });
  it("blocks approval without a verified independent reviewer, then allows it", async () => {
    await db.exec(`
      insert into cases(id, procedure_id, slug, title, level) select '${U(7)}', id, 'simple-extraction-46', 'Simple extraction, tooth 46', 1 from procedures where slug='simple-extraction';
      insert into content_versions(id, case_id, version, body, ai_generated, created_by) values ('${U(8)}', '${U(7)}', 1, '{"demo":true}', true, '${U(1)}');
      update content_versions set status='in_review' where id='${U(8)}';
    `);
    await expect(db.exec(`update content_versions set status='approved' where id='${U(8)}'`)).rejects.toThrow(/verified clinical reviewer/);
    // The author cannot approve their own content, even if they are a verified reviewer.
    await db.exec(`insert into reviewers(profile_id, qualifications, verified_at) values ('${U(1)}','BDS', now()), ('${U(2)}','BDS, MClinDent', now());
      insert into reviews(version_id, reviewer_id, decision, safety_critical_validated) values ('${U(8)}','${U(1)}','approved', true);`);
    await expect(db.exec(`update content_versions set status='approved' where id='${U(8)}'`)).rejects.toThrow(/verified clinical reviewer/);
    await db.exec(`insert into reviews(version_id, reviewer_id, decision, safety_critical_validated) values ('${U(8)}','${U(2)}','approved', true);
      update content_versions set status='approved' where id='${U(8)}';
      update content_versions set status='published' where id='${U(8)}';`);
    const r = await db.query<{ status: string; stamped: boolean }>(`select status, published_at is not null stamped from content_versions where id='${U(8)}'`);
    expect(r.rows[0]).toEqual({ status: "published", stamped: true });
  });
  it("makes reviewed content immutable and logs every change", async () => {
    await expect(db.exec(`update content_versions set body='{"edited":true}' where id='${U(8)}'`)).rejects.toThrow(/immutable/);
    const r = await db.query<{ n: number }>(`select count(*)::int n from audit_log where entity_id='${U(8)}'`);
    expect(r.rows[0].n).toBe(4);
  });
  it("only lets referral credits unlock published content", async () => {
    await db.exec(`insert into referral_credits(id, user_id, referral_id) select '${U(9)}', '${U(1)}', id from referrals where referred_id='${U(3)}'`);
    await expect(db.exec(`update referral_credits set redeemed_procedure_id=(select id from procedures where slug='biopsy') where id='${U(9)}'`)).rejects.toThrow(/published content only/);
  });
  it("has row-level security switched on for every table", async () => {
    const r = await db.query<{ tablename: string }>(`select tablename from pg_tables where schemaname='public' and not rowsecurity`);
    expect(r.rows).toEqual([]);
  });
});
