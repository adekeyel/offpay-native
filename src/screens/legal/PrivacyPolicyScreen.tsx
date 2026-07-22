import React from 'react';
import LegalPageLayout, { LegalSection } from './LegalPageLayout';

export default function PrivacyPolicyScreen() {
  return (
    <LegalPageLayout updatedLabel="Last updated: July 2026">
      <LegalSection title="1. Information we collect">
        To open and operate your wallet we collect information such as your name, phone number,
        email, date of birth, BVN and/or NIN, address, and government-issued ID or utility bill
        images for higher account tiers. We also collect transaction data, device information, and
        approximate location where needed for fraud prevention.
      </LegalSection>
      <LegalSection title="2. How we use your information">
        We use your information to verify your identity, open and manage your wallet, process
        transactions, prevent fraud, comply with Nigerian financial regulations (including
        anti-money-laundering requirements), provide customer support, and improve the app.
      </LegalSection>
      <LegalSection title="3. How we protect your information">
        Sensitive identity data such as your BVN and NIN is encrypted at rest and only accessible
        to authorized personnel for verification and compliance purposes. We use industry-standard
        security practices, and access to your full identity documents is restricted beyond what's
        needed for KYC review.
      </LegalSection>
      <LegalSection title="4. Sharing your information">
        We share information with licensed payment processors, financial institution partners, and
        regulators only as necessary to provide our services and meet legal obligations. We do not
        sell your personal information to third parties.
      </LegalSection>
      <LegalSection title="5. Your rights">
        Under the Nigeria Data Protection Act, you may request access to, correction of, or deletion
        of your personal data, subject to our obligation to retain certain records for regulatory
        and compliance purposes. Requests can be made through in-app Support or privacy@offpay.app.
      </LegalSection>
      <LegalSection title="6. Data retention">
        We retain your information for as long as your account is active and for a period after
        closure as required by Nigerian financial recordkeeping regulations.
      </LegalSection>
      <LegalSection title="7. Changes to this policy">
        We may update this Privacy Policy from time to time. Material changes will be communicated
        in-app or by email before they take effect.
      </LegalSection>
      <LegalSection title="8. Contact">
        Privacy questions or requests can be sent through in-app Support or to privacy@offpay.app.
      </LegalSection>
    </LegalPageLayout>
  );
}
