// UK business check API client: Companies House, HMRC VAT, EORI and charity status in one call.
// Docs: https://api.tychelabs.net/docs/business . No dependencies; needs global fetch (Node 18+).
export class TycheApiError extends Error {
  constructor(status, code, message, body) { super(message); this.name = 'TycheApiError'; this.status = status; this.code = code; this.body = body; }
}

export class BusinessCheck {
  /** @param {{ apiKey?: string, baseUrl?: string, timeoutMs?: number, fetch?: typeof fetch }} [opts] */
  constructor(opts = {}) {
    this.apiKey = opts.apiKey ?? (typeof process !== 'undefined' ? process.env.TYCHE_API_KEY : undefined);
    if (!this.apiKey) throw new Error('Pass apiKey or set TYCHE_API_KEY. Get a free key at https://api.tychelabs.net/signup');
    this.baseUrl = (opts.baseUrl ?? 'https://api.tychelabs.net').replace(/\/$/, '');
    this.timeoutMs = opts.timeoutMs ?? 15000;
    this._fetch = opts.fetch ?? globalThis.fetch;
  }

  async _req(method, path, body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await this._fetch(this.baseUrl + path, { method, signal: ctrl.signal, headers: { 'x-api-key': this.apiKey, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
      if (res.status === 204) return null;
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new TycheApiError(res.status, json.error?.code ?? 'http_error', json.error?.message ?? `HTTP ${res.status}`, json);
      return json;
    } finally { clearTimeout(t); }
  }

  /** Check a company by Companies House number. Optional UK VAT and EORI numbers to validate in the same call. */
  check(companyNumber, { vat, eori, include } = {}) {
    const q = new URLSearchParams();
    if (vat) q.set('vat', vat);
    if (eori) q.set('eori', eori);
    if (include) q.set('include', [].concat(include).join(','));
    return this._req('GET', `/v1/companies/${encodeURIComponent(companyNumber)}${q.size ? '?' + q : ''}`);
  }
  /** Search companies by name (up to 10 matches). */
  search(name) { return this._req('GET', `/v1/companies/search?q=${encodeURIComponent(name)}`); }
  /** Validate a UK VAT number with HMRC. */
  vat(vatNumber) { return this._req('GET', `/v1/vat/${encodeURIComponent(vatNumber)}`); }
  /** Validate a UK (GB/XI) or EU EORI number. */
  eori(eoriNumber) { return this._req('GET', `/v1/eori/${encodeURIComponent(eoriNumber)}`); }
  /** Watch a company; we POST signed events when its status or risk changes. */
  watch(companyNumber, url, { events, emailDigest } = {}) { return this._req('POST', '/v1/watches', { companyNumber, url, ...(events ? { events } : {}), ...(emailDigest ? { emailDigest } : {}) }); }
  listWatches() { return this._req('GET', '/v1/watches'); }
  deleteWatch(id) { return this._req('DELETE', `/v1/watches/${encodeURIComponent(id)}`); }
  account() { return this._req('GET', '/v1/account'); }
}

/** Verify a webhook's tyche-signature header. rawBody must be the exact request body string. */
export async function verifyWebhook(rawBody, header, secret, toleranceSecs = 300) {
  const parts = Object.fromEntries(String(header).split(',').map((p) => p.split('=')));
  if (!parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > toleranceSecs) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${rawBody}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== parts.v1.length) return false;
  let diff = 0; for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}
export default BusinessCheck;
