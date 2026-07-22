import React from 'react';
import LegalPageLayout, { LegalSection } from './LegalPageLayout';

export default function ComplianceScreen() {
  return (
    <LegalPageLayout>
      <LegalSection title="Regulatory partners">
        OffPay is a financial technology company operating in partnership with licensed Nigerian
        payment processors and financial institutions for wallet issuance, fund custody, and money
        transfer services. OffPay itself does not directly hold a banking or payment services
        license — regulated financial activities on the platform are carried out through these
        licensed partners.
      </LegalSection>
      <LegalSection title="Anti-money laundering & KYC">
        In line with Central Bank of Nigeria (CBN) guidelines, OffPay verifies every user's identity
        (KYC) before or shortly after account opening, and applies transaction limits based on
        verification tier. We monitor transactions for suspicious activity and may request
        additional information, delay, or decline a transaction where required for compliance.
      </LegalSection>
      <LegalSection title="Complaints & dispute resolution">
        If a transaction fails to complete correctly, or you believe there's an error on your
        account, please raise it through in-app Support with your transaction reference — most
        issues are resolved within a few business days. If you're not satisfied with the outcome,
        you may escalate to complaints@offpay.app. Complaints involving a specific bank or payment
        partner may also be referred to that partner's own dispute process, or to the CBN Consumer
        Protection Department where applicable.
      </LegalSection>
      <LegalSection title="Fees">
        All fees for transfers, bill payments, card issuance, and other services are disclosed
        in-app before you confirm a transaction. We don't charge hidden fees.
      </LegalSection>
      <LegalSection title="Company">
        OffPay Technology Ltd is registered in Nigeria. Registration details are available on
        request through in-app Support.
      </LegalSection>
    </LegalPageLayout>
  );
}
