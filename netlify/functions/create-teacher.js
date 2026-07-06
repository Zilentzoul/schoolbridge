// Netlify serverless function: create a teacher (or admin) account.
//
// Why a function? Creating a Supabase auth user from the browser would
// sign that new user into the admin's own session. Doing it here, with the
// SERVICE ROLE key (kept server-side only, never shipped to the browser),
// lets an admin create staff logins without being logged out.
//
// Required Netlify environment variables:
//   SUPABASE_URL              (same as your project URL)
//   SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API → service_role)
//   ADMIN_CREATE_SECRET       (a secret word; the caller must send the same one)
//
// The admin's browser sends the secret so random visitors can't call this.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const CREATE_SECRET = process.env.ADMIN_CREATE_SECRET;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify." }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Bad request" }) }; }

  const { email, password, full_name, role, secret } = body;

  // Gate: require the shared secret if one is configured.
  if (CREATE_SECRET && secret !== CREATE_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: "Not authorised." }) };
  }
  if (!email || !password || !["teacher", "admin"].includes(role)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Provide email, password, and role (teacher or admin)." }) };
  }

  try {
    // Create the confirmed user via the Admin API.
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "", role },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data.msg || data.message || "Could not create account." }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, id: data.id, email: data.email }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
