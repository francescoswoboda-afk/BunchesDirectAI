/**
 * Cloudflare Worker — Availability PDF Upload
 *
 * Required environment variables (set in Cloudflare dashboard):
 *   ADMIN_PASSWORD   — the password your dad types on the upload page
 *   GITHUB_TOKEN     — a fine-grained GitHub PAT (contents: read+write, this repo only)
 *   GITHUB_OWNER     — francescoswoboda-afk
 *   GITHUB_REPO      — BunchesDirectAI
 */

const ALLOWED_ORIGIN = "https://bunches-direct.com";
const PDF_FILE_PATH = "assets/availability/latest-availability.pdf";
const COMMIT_MESSAGE = "Update availability PDF";
const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    const { password, fileDataBase64 } = body;

    // Validate password
    if (!env.ADMIN_PASSWORD) {
      return jsonResponse({ error: "Server is not configured yet." }, 500);
    }
    if (!password || password !== env.ADMIN_PASSWORD) {
      return jsonResponse({ error: "Wrong password. Try again." }, 401);
    }

    // Validate file
    if (!fileDataBase64 || typeof fileDataBase64 !== "string") {
      return jsonResponse({ error: "No file provided." }, 400);
    }

    // Check it looks like a PDF (base64 of %PDF-)
    const pdfMagic = btoa("%PDF-").slice(0, 5);
    if (!fileDataBase64.startsWith(pdfMagic)) {
      return jsonResponse({ error: "File must be a PDF." }, 400);
    }

    // Check size
    const byteLength = Math.floor((fileDataBase64.length * 3) / 4);
    if (byteLength > MAX_PDF_BYTES) {
      return jsonResponse({ error: "PDF is too large. Maximum size is 8 MB." }, 413);
    }

    // Get current file SHA from GitHub (needed to update an existing file)
    const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${PDF_FILE_PATH}`;
    const ghHeaders = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "BunchesDirect-Worker/1.0",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    let sha;
    const getRes = await fetch(apiUrl, { headers: ghHeaders });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // Commit the PDF to the repo
    const putPayload = {
      message: COMMIT_MESSAGE,
      content: fileDataBase64,
      ...(sha ? { sha } : {}),
    };

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify(putPayload),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error("GitHub API error:", errText);
      return jsonResponse({ error: "Failed to upload to GitHub. Check your token and repo settings." }, 500);
    }

    return jsonResponse({ success: true });
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
