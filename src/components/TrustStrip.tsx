"use client";

const items = [
  { icon: "\u{1F510}", label: "Provably Fair" },
  { icon: "\u26A1", label: "Instant Pay" },
  { icon: "\u{1F441}", label: "On-Chain" },
  { icon: "\u{1F6E1}", label: "Non-Custodial" },
];

export function TrustStrip() {
  return (
    <div className="flex justify-center gap-1 flex-wrap mb-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-card/60 border border-[--border-faint]"
        >
          <span className="text-[9px]">{item.icon}</span>
          <span className="font-mono text-[8px] font-semibold text-text-secondary uppercase tracking-[0.05em]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
