"use client";

import Image from "next/image";
import { WalletButton } from "./WalletButton";
import { SoundControl } from "./SoundControl";

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 w-full h-14 flex items-center justify-between px-4 lg:px-6 bg-surface-container/80 backdrop-blur-xl">
      {/* Logo + Nav links inline — nav starts after sidebar width */}
      <div className="flex items-center gap-6 lg:gap-0">
        <a href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/brand/logo_head_front.webp"
            alt="PoolRaid"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-display text-lg font-black tracking-[-0.02em] text-on-surface">
            Pool<span className="text-primary">Raid</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1 lg:ml-[calc(16rem-120px)]">
          <NavLink href="/flip" label="Coin Flip" />
          <NavLink href="/rules" label="Rules" />
          <NavLink href="/leaderboard" label="Leaderboard" />
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <div className="hidden md:block"><SoundControl /></div>
        <WalletButton />
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="px-3 py-1.5 rounded-md font-body text-[11px] font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-bright/50 transition-all"
    >
      {label}
    </a>
  );
}
