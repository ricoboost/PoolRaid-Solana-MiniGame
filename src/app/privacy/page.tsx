export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[640px] min-h-screen px-4 py-8">
      <a href="/" className="font-display text-lg font-black text-primary inline-block mb-6">
        PoolRaid
      </a>

      <article>
        <h1 className="font-display text-2xl font-black text-on-surface mb-1">Privacy Policy</h1>
        <p className="font-mono text-[9px] text-text-ghost mb-8">Effective Date: April 3, 2026</p>

        <Section title="1. Information We Collect">
          <p><strong className="text-on-surface">Wallet Address:</strong> When you connect your Solana wallet, we record your public wallet address to process deposits and payouts. We do not have access to your private keys.</p>
          <p><strong className="text-on-surface">Transaction Data:</strong> We record ticket purchases, game results, and payouts linked to your wallet address. This is necessary for provably fair verification and platform operation.</p>
          <p><strong className="text-on-surface">Jurisdiction Declaration:</strong> We record your acceptance of Terms including timestamp and detected country code.</p>
          <p><strong className="text-on-surface">Usage Data:</strong> We collect anonymized usage data including pages visited and session duration to improve the Platform.</p>
          <p><strong className="text-on-surface">IP-Based Location:</strong> We use Cloudflare&apos;s IP geolocation to enforce geographic restrictions. We store the country code associated with your session for compliance purposes. We do not store your full IP address beyond what is required for security.</p>
        </Section>

        <Section title="2. Information We Do NOT Collect">
          <ul>
            <li>Real names or identity documents</li>
            <li>Email addresses (unless voluntarily provided for support)</li>
            <li>Phone numbers</li>
            <li>Government-issued identification</li>
            <li>Banking or financial account information</li>
          </ul>
          <p>The Platform does not require KYC (Know Your Customer) verification.</p>
        </Section>

        <Section title="3. How We Use Information">
          <ul>
            <li>Process deposits and payouts</li>
            <li>Provide provably fair game verification</li>
            <li>Enforce geographic restrictions</li>
            <li>Prevent fraud and abuse</li>
            <li>Maintain declaration audit trail for compliance</li>
            <li>Improve Platform performance</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          We do not sell, trade, or rent personal information. We may share data with law enforcement if required by valid legal process, with service providers necessary for Platform operation, or in connection with a merger, acquisition, or sale of assets.
        </Section>

        <Section title="5. Data Retention">
          Transaction data and fairness records may be retained for verification. Jurisdiction declarations may be retained for compliance. Contact the operator of the deployment you used to request data deletion, subject to applicable retention obligations.
        </Section>

        <Section title="6. Cookies">
          <p>Minimal cookies only:</p>
          <ul>
            <li>Terms acceptance verification (90-day expiry)</li>
            <li>Session management</li>
            <li>Wallet connection state</li>
          </ul>
          <p>No advertising cookies. No third-party tracking.</p>
        </Section>

        <Section title="7. Security">
          We implement industry-standard security measures including HTTPS, secure infrastructure, and access controls. No system is 100% secure and we cannot guarantee absolute data security.
        </Section>

        <Section title="8. Children">
          The Platform is not for anyone under 18. We do not knowingly collect data from minors. If discovered, access will be terminated immediately.
        </Section>

        <Section title="9. Changes">
          We may update this policy. Changes are posted on this page.
        </Section>

        <Section title="10. Contact">
          Privacy inquiries should be directed to the operator of the deployment you used.
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display text-[14px] font-bold text-on-surface mb-2">{title}</h2>
      <div className="font-body text-[12px] text-on-surface-variant leading-relaxed space-y-2 [&_ul]:list-none [&_ul]:space-y-1 [&_li]:pl-3 [&_li]:relative [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-2 [&_li]:before:w-1 [&_li]:before:h-1 [&_li]:before:rounded-full [&_li]:before:bg-primary/30">
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
    </section>
  );
}
