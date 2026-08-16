# Sahmi repayment funding and reconciliation process

Status: operational design and software control, not legal advice. A Palestinian lawyer, tax adviser, and the participating PMA-licensed bank or payment provider must approve the final structure before real funds are accepted.

## 1. What the transaction is

An entrepreneur's transfer to Sahmi for an existing repayment is **debt-service funding**, not a new investment in Sahmi and not proof that the investor has been paid. The money must move through two independently evidenced legs:

1. Entrepreneur → designated safeguarded/escrow bank account.
2. Designated account → the investor entitled to that installment.

Sahmi records a repayment as paid only after both legs are matched to unique bank references.

### Parties

- **Borrower / project company:** the entrepreneur or the legal entity that received the project funding and owes the repayment.
- **Lender / investor:** the person or entity whose confirmed investment created the principal obligation.
- **Sahmi:** platform and servicing/reconciliation agent. Sahmi is not the borrower merely because it coordinates a transfer.
- **Account or payment provider:** a PMA-licensed bank, escrow agent, or licensed payment-services company that actually safeguards and transfers money.
- **Guarantor/security provider:** optional; include only if a separately identified person or asset legally secures the obligation.

### Terms that must be completed per project

- Principal: total confirmed/completed investments allocated to the lender.
- Return: the project's contractually agreed fixed return rate. Sahmi's `expected_roi` is a calculation input, not by itself a legally binding interest rate. For example, a 5% agreed return on USD 10,000 produces USD 500 profit and a USD 10,500 obligation; it must never be replaced with a dashboard progress percentage.
- Term: from the agreement/effective date through the final dated installment. Do not use a vague number of months without first and final due dates.
- Schedule: exact installment amount, due date, currency, and beneficiary for every payment; all installments must add to principal plus agreed return.
- Collateral: **unsecured by default** unless an attached security schedule identifies the asset, owner, valuation, priority, perfection/registration steps, insurance, and enforcement rights.
- Late/default treatment: grace period, notice procedure, cure period, acceleration rights, and any late charge only after local counsel confirms enforceability.
- Prepayment: whether allowed, how profit/return is recalculated, and whether a fee applies.

## 2. Practical funding methods

| Method | Best use | Advantages | Main risks / limitations |
|---|---|---|---|
| Segregated escrow or safeguarded bank account | Default for Sahmi | Separates client money, produces bank evidence, enables dual-control releases | Bank/escrow cost; Sahmi must not claim legal safeguarding unless the account contract and regulatory position support it |
| Third-party licensed lender | Entrepreneur needs refinancing | Licensed underwriting and collection; Sahmi avoids advancing its own money | New credit cost and underwriting; refinancing does not erase the original debt until investors are actually paid |
| Revenue-based financing | Volatile project cash flow | Payments track revenue and reduce fixed-payment stress | Harder reconciliation; requires audited revenue definitions, caps, reporting rights, and a long-stop date |
| Promissory note plus bank transfer | Small bilateral obligation | Simple written evidence and clear bank trail | No segregation by itself; enforceability, signature, tax, interest, and security terms require counsel/notarization advice |
| Licensed digital payment rails (including iBuraq through participating institutions) | Fast local transfer and payout | 24/7 rails, account verification, traceable references | Transaction limits, reversals, provider onboarding, fraud, and API availability; Sahmi must contract with a licensed participant |

Recommendation: use a segregated account controlled under a written bank/escrow mandate. If true escrow is unavailable, use a dedicated client-money account with contractual no-setoff terms and counsel-approved disclosures. Never commingle repayment deposits with Sahmi operating cash.

## 3. Execution workflow

### Before accepting funds

1. Counsel determines whether the arrangement is a loan, investment return, crowdfunding activity, payment service, client-money service, or another regulated activity; obtain any required PMA/PCMA authorization or use a licensed partner.
2. Identify and verify the entrepreneur/project company, investor, authorized signatories, and ultimate beneficial owners using reliable documents.
3. Screen sanctions, politically exposed persons, adverse information, source of funds, and expected transaction behavior under a documented risk-based policy.
4. Verify that the project obligation equals confirmed principal plus the rate in the signed agreement. Lock the currency, installment dates, and beneficiary account.
5. Execute the repayment agreement, account-control/escrow terms, privacy notice, and any collateral documents. Keep signed originals or counsel-approved electronic signatures.
6. Give the entrepreneur account instructions through an authenticated channel. Independently confirm any account-detail change; never accept a change solely by email.

### For every installment

1. Entrepreneur transfers the exact installment to the designated account using the installment identifier.
2. In Sahmi, the KYC-verified entrepreneur selects the installment, enters the inbound bank reference/date, uploads the receipt, declares the source of funds, and accepts the versioned agreement.
3. Staff starts review. A second authorized reviewer matches sender, beneficiary account, exact amount/currency, value date, unique reference, receipt, and bank statement.
4. Staff records verification notes. The transfer becomes `verified`; the repayment is still not paid.
5. An authorized operator instructs the bank/provider to pay the correct investor account. Maker-checker approval should occur at the bank/provider.
6. Staff records the unique outbound payout reference. Sahmi atomically marks the transfer `disbursed` and the installment `paid`, and recalculates project/investor totals.
7. Daily reconciliation compares Sahmi's open/verified/disbursed records to bank statement credits, debits, reversals, fees, and rejected transfers. Exceptions remain open until resolved.

### Compliance hold conditions

Do not verify or disburse when KYC is incomplete, names/accounts do not match, the amount/currency differs, a reference is duplicated, funds come from an unexplained third party, sanctions/PEP review is unresolved, the account is frozen, or the transaction is otherwise suspicious. Follow the licensed institution's escalation and reporting procedure; do not alert a customer to a confidential suspicious-transaction review.

## 4. Reconciliation checklist

- [ ] Signed agreement version and repayment schedule are on file.
- [ ] Borrower, investor, signatories, and beneficial owners passed required KYC/risk review.
- [ ] Exact principal, agreed return rate, total obligation, currency, and final due date agree across contract and Sahmi.
- [ ] Inbound sender and account match the approved entrepreneur/project entity.
- [ ] Inbound amount, currency, value date, and reference match the bank statement.
- [ ] Receipt is authentic and the reference has not been used before.
- [ ] Source-of-funds declaration is reasonable for the customer's risk profile.
- [ ] Outbound beneficiary account belongs to the entitled investor.
- [ ] Outbound amount and unique reference match the provider/bank statement.
- [ ] No reversal, return, fee shortfall, chargeback, or sanctions hold remains open.
- [ ] Sahmi record is `disbursed`, repayment is `paid`, and ledger totals reconcile.
- [ ] Audit event, reviewer identity, timestamps, documents, and exception notes are retained.

## 5. Documentation, monitoring, and disputes

- Use immutable/versioned agreements, schedules, KYC decisions, bank instructions, receipts, statements, approval logs, payout confirmations, notices, and settlement communications.
- Apply least-privilege access, private document storage, encryption, malware scanning, retention limits, access logs, backups, and tested deletion/legal-hold procedures.
- Reconcile daily while transfers are active; review overdue installments and unmatched credits daily; perform independent monthly ledger-to-bank sign-off.
- Use alerts for duplicate references, amount mismatch, third-party senders, repeated rejections, rapid reversals, unusual geography, and changes to beneficiary accounts.
- State a complaint path, response times, negotiation window, mediation option, governing law, competent court/arbitration forum, service-of-notice addresses, and emergency relief rights in the agreement.
- Preserve disputed money in the safeguarded account until written joint instruction, final award/order, or the escrow mandate permits release. Never overwrite historical records.

## Regulatory references reviewed

- Palestine Monetary Authority AML/CFT instructions, including Instruction No. 4 of 2022 for financial institutions: https://www.pma.ps/en/Legislation/AMLCFT/AMLInstructions
- Palestine AML/CFT legislation index: https://www.pma.ps/anti-money-laundering/aml-laws
- PMA iBuraq instant-payment system and participating banks/licensed payment companies: https://www.pma.ps/iburaq
- FATF Recommendations 10–12 and record-keeping/risk-based CDD principles: https://www.fatf-gafi.org/content/dam/fatf-gafi/recommendations/FATF%20Standards%20-%2040%20Recommendations%20rc.pdf
- Palestinian Evidence Law No. 4 of 2001, including treatment of signed private instruments: https://maqam.najah.edu/legislation/8/

