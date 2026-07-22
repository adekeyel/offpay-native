import React from 'react';
import LegalPageLayout, { LegalSection } from './LegalPageLayout';

export default function AboutScreen() {
  return (
    <LegalPageLayout>
      <LegalSection title="About OffPay">
        OffPay is a Nigerian financial technology company on a mission to make everyday money
        movement fast, secure, and reliable — even when the internet isn't. Alongside standard
        wallet, transfer, bill payment, and card services, OffPay's offline peer-to-peer transfer
        feature lets you send and receive money over QR code, Bluetooth, or NFC when you or the
        recipient have no signal, syncing safely to your balance the next time either device comes
        back online.
      </LegalSection>
      <LegalSection title="What we offer">
        A digital wallet funded by bank transfer or card, transfers to any Nigerian bank account or
        other OffPay users, airtime/data/cable/electricity payments, virtual cards, savings and
        investment products, and cashback rewards — all from one app.
      </LegalSection>
      <LegalSection title="How we keep your money moving">
        OffPay partners with licensed payment processors and financial institutions to issue
        wallets, move funds, and hold deposits. We do not store your card or bank details in plain
        form — sensitive identity data such as your BVN and NIN is encrypted at rest, and access to
        it is restricted to what's needed for verification and compliance.
      </LegalSection>
      <LegalSection title="Get in touch">
        Questions, feedback, or concerns are always welcome through in-app Support, or by writing to
        support@offpay.app.
      </LegalSection>
    </LegalPageLayout>
  );
}
