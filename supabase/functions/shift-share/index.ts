// シフト表PDFの共有（PC版シフト表からアップロード → QR/LINE/メールのリンクで閲覧）
// POST : PC版シフト表からPDFを受け取り保存（ヘッダー x-share-key が必要）→ 共有URLを返す
// GET  : ?id=xxx で開くと、PDFの一時URLへ転送（作成から60日で失効・自動削除）
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "shift-share";
const TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60日
const MAX_BYTES = 10 * 1024 * 1024;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const sb = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// PC版（http://127.0.0.1:8765 / localhost）と、事務所LAN内のiPad（http://<プライベートIP>:8765）からのみ受け付ける
const ORIGIN_RE = /^http:\/\/(127\.0\.0\.1|localhost|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):8765$/;
function cors(req: Request): Record<string, string> {
  const o = req.headers.get("origin") ?? "";
  return ORIGIN_RE.test(o)
    ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, x-share-key", "Vary": "Origin" }
    : {};
}
function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(req) } });
}
// Supabaseの関数はHTMLを表示できない（text/plainに変換される）ため、文字だけで返す
function page(status: number, msg: string) {
  return new Response(`シフト表\n\n${msg}\n`, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
function same(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function newId() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const b = crypto.getRandomValues(new Uint8Array(22));
  return Array.from(b, (x) => abc[x % abc.length]).join("");
}
async function cleanup() {
  const { data } = await sb.storage.from(BUCKET).list("", { limit: 1000 });
  const old = (data ?? []).filter((f) => f.created_at && Date.now() - new Date(f.created_at).getTime() > TTL_MS).map((f) => f.name);
  if (old.length) await sb.storage.from(BUCKET).remove(old);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!/^[A-Za-z0-9]{16,40}$/.test(id)) return page(404, "リンクが正しくありません。");
    const name = `${id}.pdf`;
    const { data: list } = await sb.storage.from(BUCKET).list("", { search: id, limit: 5 });
    const f = list?.find((x) => x.name === name);
    if (!f) return page(404, "このシフト表は期限が切れたか、削除されています。最新のQRコード・リンクを受け取ってください。");
    if (f.created_at && Date.now() - new Date(f.created_at).getTime() > TTL_MS) {
      await sb.storage.from(BUCKET).remove([name]);
      return page(410, "このシフト表は期限が切れました。最新のQRコード・リンクを受け取ってください。");
    }
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(name, 600);
    if (error || !data) return page(500, "読み込めませんでした。時間をおいて開き直してください。");
    return Response.redirect(data.signedUrl, 302);
  }

  if (req.method === "POST") {
    const KEY = Deno.env.get("SHIFT_SHARE_KEY") ?? ""; // ダッシュボードで設定した共有キー
    if (!KEY || !same(req.headers.get("x-share-key") ?? "", KEY)) return json(req, 401, { error: "共有キーが正しくありません" });
    const buf = new Uint8Array(await req.arrayBuffer());
    if (buf.length < 5 || buf.length > MAX_BYTES) return json(req, 413, { error: "PDFのサイズが正しくありません" });
    if (new TextDecoder().decode(buf.slice(0, 5)) !== "%PDF-") return json(req, 415, { error: "PDFではありません" });
    const id = newId();
    const { error } = await sb.storage.from(BUCKET).upload(`${id}.pdf`, buf, { contentType: "application/pdf", upsert: false });
    if (error) return json(req, 500, { error: "保存に失敗しました" });
    cleanup().catch(() => {});
    return json(req, 200, {
      id,
      url: `${SUPABASE_URL}/functions/v1/shift-share?id=${id}`,
      expires_at: new Date(Date.now() + TTL_MS).toISOString(),
    });
  }

  return json(req, 405, { error: "method not allowed" });
});
