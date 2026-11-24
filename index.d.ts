export interface Meta { requestId: string; sandbox?: boolean; partial?: boolean; stale?: boolean; sources?: Record<string, { status: string }>; usage?: { plan: string; used: number; limit: number; period: string } }
export interface Flag { code: string; severity: 'info' | 'low' | 'medium' | 'high'; message: string }
export interface Check {
  company: { number: string; name: string; status: string | null; type: string | null; incorporatedOn: string | null; ageYears: number | null; sicCodes: string[];
    accounts: { nextDue: string | null; overdue: boolean; lastMadeUpTo: string | null }; confirmationStatement: { nextDue: string | null; overdue: boolean };
    hasInsolvencyHistory: boolean; hasCharges: boolean; officers: { active: number | null; resigned: number | null } | null; personsWithSignificantControl: { active: number | null; ceased: number | null } | null; [k: string]: unknown };
  vat: { valid: boolean; vatNumber: string; name: string | null; address: unknown } | null;
  eori?: { valid: boolean; eori: string; name: string | null; address: unknown; source: string } | null;
  charity: { found: boolean; charityNumber?: string; status?: string } | null;
  risk: 'none' | 'low' | 'medium' | 'high';
  flags: Flag[];
}
export class TycheApiError extends Error { status: number; code: string; body: unknown }
export class BusinessCheck {
  constructor(opts?: { apiKey?: string; baseUrl?: string; timeoutMs?: number; fetch?: typeof fetch });
  check(companyNumber: string, opts?: { vat?: string; eori?: string; include?: string | string[] }): Promise<{ data: Check; meta: Meta }>;
  search(name: string): Promise<{ data: { items: { number: string; name: string; status: string }[] }; meta: Meta }>;
  vat(vatNumber: string): Promise<{ data: Check['vat']; meta: Meta }>;
  eori(eoriNumber: string): Promise<{ data: Check['eori']; meta: Meta }>;
  watch(companyNumber: string, url: string, opts?: { events?: string[]; emailDigest?: boolean }): Promise<{ data: { id: string } }>;
  listWatches(): Promise<{ data: unknown[] }>;
  deleteWatch(id: string): Promise<null>;
  account(): Promise<{ data: unknown }>;
}
export function verifyWebhook(rawBody: string, header: string, secret: string, toleranceSecs?: number): Promise<boolean>;
export default BusinessCheck;
