"use client";

import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { formatSOL } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  suffix?: string;
  format?: (n: number) => string;
}

export function AnimatedNumber({
  value,
  className = "",
  suffix,
  format = formatSOL,
}: AnimatedNumberProps) {
  const display = useAnimatedNumber(value);

  return (
    <span className={className}>
      {format(display)}
      {suffix && <span className="text-text-secondary ml-1.5">{suffix}</span>}
    </span>
  );
}
