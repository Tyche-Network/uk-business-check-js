# UK business check API for JavaScript

> **Company checks: coming soon.** The company check opens when Companies House and HMRC VAT are both connected. UK and EU EORI checks work today with a free key from https://api.tychelabs.net/signup

Check a UK company in one call. You get Companies House status, age, overdue accounts and confirmation statement flags, and recent filings. HMRC validates the VAT number, the Charity Commission gives charity status, and plain risk flags sit on top. Officer and PSC data come back as counts only, never personal details.

- No dependencies. Works on Node 18+, Deno, Bun and edge runtimes.
- Free plan with 50 checks a month: https://api.tychelabs.net/business
- Docs: https://api.tychelabs.net/docs/business

```sh
npm install github:Tyche-Network/uk-business-check-js
```

```js
import { BusinessCheck } from '@tychelabs/uk-business-check';

const api = new BusinessCheck({ apiKey: process.env.TYCHE_API_KEY });
const { data } = await api.check('16716814', { vat: 'GB553557881' });

console.log(data.company.name, data.company.status, data.company.ageYears);
console.log('VAT valid:', data.vat?.valid);
if (data.risk !== 'none') console.log(data.flags.map((f) => `${f.severity}: ${f.message}`));

const { data: matches } = await api.search('example trading');

// UK and EU EORI numbers, on their own or in the check above ({ eori })
const { data: eori } = await api.eori('GB123456789000');
```

A `tl_test_` key returns sandbox data and is not metered.

## Watch a company

```js
await api.watch('16716814', 'https://example.com/hooks/tyche');
// Events: company.status_changed, company.accounts_overdue,
// company.confirmation_statement_overdue, company.risk_changed
```

Verify each event with `verifyWebhook(rawBody, req.headers['tyche-signature'], secret)`.

## Data

Company data comes from the Companies House public register. VAT checks use HMRC's Check a UK VAT number API. Charity data is from the Charity Commission (Open Government Licence v3.0). Not affiliated with or endorsed by Companies House, HMRC or the Charity Commission.

MIT licence. Made by [Tyche Labs](https://www.tychelabs.net).
