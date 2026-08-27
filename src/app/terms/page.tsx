export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[640px] min-h-screen px-4 py-8">
      <a href="/" className="font-display text-lg font-black text-primary inline-block mb-6">
        PoolRaid
      </a>

      <article className="prose-legal">
        <h1 className="font-display text-2xl font-black text-on-surface mb-1">Terms of Service</h1>
        <p className="font-mono text-[9px] text-text-ghost mb-8">Effective Date: April 3, 2026 &middot; Last Updated: April 3, 2026</p>

        <Section title="1. Acceptance of Terms">
          By accessing or using PoolRaid (&quot;the Platform&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Platform.
        </Section>

        <Section title="2. Eligibility and User Declarations">
          <p>By accepting these Terms and using the Platform, you represent, warrant, and declare that:</p>
          <ul>
            <li>(a) You are at least 18 years old, or the legal age of majority in your jurisdiction, whichever is higher;</li>
            <li>(b) You are not a resident or citizen of, and are not accessing the Platform from, any jurisdiction where online gaming, cryptocurrency gaming, or games of chance are prohibited or restricted by law;</li>
            <li>(c) You are solely responsible for determining whether your use of the Platform is lawful in your jurisdiction. The Platform does not provide legal advice and makes no representations regarding the legality of its services in any jurisdiction;</li>
            <li>(d) You understand that PoolRaid offers games of chance, that outcomes are determined by cryptographic random number generation, and that you may lose some or all of the funds you deposit;</li>
            <li>(e) You are using only personal funds that you can afford to lose entirely, and are not using borrowed funds, funds belonging to others, or funds needed for essential expenses;</li>
            <li>(f) You are not using the Platform for money laundering, terrorist financing, or any other illegal purpose;</li>
            <li>(g) You accept full responsibility for any legal consequences arising from your use of the Platform in violation of your local laws;</li>
            <li>(h) You are not a politically exposed person (PEP) or under any sanctions imposed by OFAC, the EU, or the United Nations;</li>
            <li>(i) You are not using VPN, proxy, or other tools to circumvent geographic restrictions implemented by the Platform.</li>
          </ul>
          <p>The Platform employs geo-blocking technology to prevent access from certain regions but cannot guarantee complete geographic restriction. Circumventing these restrictions is a material breach of these Terms and may result in immediate suspension and forfeiture of all funds on the Platform.</p>
        </Section>

        <Section title="3. Nature of the Platform">
          PoolRaid is a blockchain-based entertainment platform that uses provably fair technology on the Solana blockchain. Game outcomes are determined by cryptographic random number generation and are independently verifiable by any user. All transactions are conducted exclusively in SOL (Solana) cryptocurrency. The Platform does not accept fiat currency, does not interface with traditional banking systems, and does not offer currency conversion services.
        </Section>

        <Section title="4. Provably Fair System">
          All game outcomes are determined using HMAC-SHA256 cryptographic hashing. Before each game, a hash of the random seed is published. After the game, the seed is revealed, allowing any user to independently verify the fairness of the result. Full technical documentation is available at PoolRaid/rules.
        </Section>

        <Section title="5. Deposits and Withdrawals">
          Deposits are processed by sending SOL to the Platform&apos;s designated wallet address. Winnings are sent automatically to your connected wallet address. Cryptocurrency transactions are irreversible once confirmed on the Solana blockchain. The Platform does not hold custody of your wallet or private keys. You are responsible for the security of your own wallet.
        </Section>

        <Section title="6. Platform Fees and Game Mechanics">
          <p>The Platform charges the following fees:</p>
          <ul>
            <li>Scratch tickets: up to 10% platform fee on each ticket purchased, with the remainder added to the shared prize pool. New tiers start with reduced fees to help build the pool.</li>
            <li>Coin Flip: 3% platform fee deducted from the winning pot.</li>
          </ul>
          <p>Payouts are made from the pool balance. If a calculated payout exceeds the available pool balance, the payout is capped at the pool balance. Full details on game mechanics, odds, and payout calculations are publicly available at PoolRaid/rules.</p>
        </Section>

        <Section title="7. Risks">
          <p>You acknowledge and accept the following risks:</p>
          <ul>
            <li>Cryptocurrency values are volatile and may fluctuate significantly</li>
            <li>Game outcomes involve chance and you may lose your entire deposit</li>
            <li>Blockchain transactions are irreversible</li>
            <li>The Platform may experience technical issues or downtime</li>
            <li>Software vulnerabilities may exist despite best efforts to prevent them</li>
            <li>Regulatory changes may affect the Platform&apos;s availability in your region</li>
            <li>Pool payouts are capped at available pool balance</li>
          </ul>
        </Section>

        <Section title="8. Prohibited Activities">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Platform if under 18 or the legal age in your jurisdiction</li>
            <li>Access the Platform from a restricted jurisdiction using VPN or proxy</li>
            <li>Engage in fraud, collusion, or manipulation of game outcomes</li>
            <li>Use automated tools, bots, or scripts without authorization</li>
            <li>Attempt to exploit bugs or vulnerabilities</li>
            <li>Use the Platform for money laundering or any illegal purpose</li>
            <li>Create multiple accounts to abuse referral or promotional systems</li>
          </ul>
        </Section>

        <Section title="9. Suspension and Termination">
          PoolRaid reserves the right to suspend access, withhold payouts, or terminate service for any user who violates these Terms or engages in suspicious activity. In cases of suspected fraud or illegal activity, the Platform may cooperate with relevant authorities.
        </Section>

        <Section title="10. Intellectual Property">
          All content, design, code, and branding on the Platform is the property of PoolRaid. The PoolRaid name, associated mascots, and visual elements are trademarks of PoolRaid.
        </Section>

        <Section title="11. Limitation of Liability">
          THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. THE OPERATOR SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO LOSS OF FUNDS, LOSS OF DATA, OR SERVICE INTERRUPTION. TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT OF SOL DEPOSITED BY YOU IN THE PRECEDING 30 DAYS.
        </Section>

        <Section title="12. Dispute Resolution">
          Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with applicable rules. You waive any right to participate in class action lawsuits or class-wide arbitration.
        </Section>

        <Section title="13. Governing Law">
          These Terms are governed by applicable law, without regard to conflict of law principles.
        </Section>

        <Section title="14. Changes to Terms">
          PoolRaid reserves the right to modify these Terms at any time. Changes will be posted on this page with an updated &quot;Last Updated&quot; date. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
        </Section>

        <Section title="15. Severability">
          If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.
        </Section>

        <Section title="16. Contact">
          Questions about a deployment of this software should be directed to that deployment&apos;s operator. Repository security reports should follow SECURITY.md.
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
