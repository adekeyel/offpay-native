import React from 'react';
import LegalPageLayout, { LegalSection } from './LegalPageLayout';

export default function TermsScreen() {
  return (
    <LegalPageLayout updatedLabel="Last updated: July 2026">
      <LegalSection title="1. Acceptance of these Terms">
        By creating an OffPay account or using any OffPay service, you agree to these Terms of
        Service and to our Privacy Policy. If you do not agree, please do not use the app.
      </LegalSection>
      <LegalSection title="2. Eligibility">
        You must be at least 18 years old, a resident of Nigeria, and able to complete our identity
        verification (KYC) requirements, including providing a valid BVN and/or NIN where required
        for your account tier, to open and use an OffPay wallet.
      </LegalSection>
      <LegalSection title="3. Your account">
        You're responsible for keeping your login credentials, app-lock PIN, and device secure.
        Notify us immediately through Support if you suspect unauthorized access to your account.
        OffPay may suspend or limit an account where required for fraud prevention, compliance with
        law, or to protect you or other users.
      </LegalSection>
      <LegalSection title="4. Wallet funding and transfers">
        Funds added to your OffPay wallet are held via licensed payment processors and financial
        institution partners. Transfers, bill payments, and withdrawals are processed as soon as
        reasonably possible but may be delayed by your bank, our partners, or checks required for
        fraud and compliance purposes. Fees for specific services (transfers, VTU, cards, etc.) are
        shown before you confirm each transaction.
      </LegalSection>
      <LegalSection title="5. Offline transfers">
        OffPay's offline transfer feature lets you send a limited, pre-authorized amount without an
        active internet connection. This offline limit and its terms (including expiry of offline
        authorization) are shown in-app and may change based on your account tier, usage, and risk
        assessment.
      </LegalSection>
      <LegalSection title="6. Prohibited use">
        You agree not to use OffPay for money laundering, terrorism financing, fraud, or any
        unlawful purpose, and not to attempt to circumvent our identity verification, transaction
        limits, or security controls.
      </LegalSection>
      <LegalSection title="7. Limitation of liability">
        OffPay is not liable for losses arising from your failure to keep your credentials secure,
        from circumstances beyond our reasonable control (including outages at partner banks,
        telecom, or payment networks), except as required by applicable Nigerian law.
      </LegalSection>
      <LegalSection title="8. Changes to these Terms">
        We may update these Terms from time to time. Material changes will be communicated in-app
        or by email before they take effect.
      </LegalSection>
      <LegalSection title="9. Governing law">
        These Terms are governed by the laws of the Federal Republic of Nigeria.
      </LegalSection>
      <LegalSection title="10. Contact">
        Questions about these Terms can be sent through in-app Support or to legal@offpay.app.
      </LegalSection>
    </LegalPageLayout>
  );
}
