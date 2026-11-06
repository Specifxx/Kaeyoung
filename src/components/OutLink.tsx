"use client";
// Every outbound buy link. The href is already tagged at build time; the click
// is a Vercel Analytics event (no function, no cookie).
import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

export function OutLink({
  href,
  children,
  className = "",
  paid = false,
  title,
  event,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  /** a link that can earn us a commission: rel sponsored */
  paid?: boolean;
  title?: string;
  event: { source: string; region: string; placement: string; ean?: string; /** "checkout" or "product": where a store link lands */ to?: string };
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={paid ? "sponsored noopener" : "nofollow noopener"}
      className={className}
      title={title}
      onClick={() => {
        try {
          track("buy_click", event);
        } catch {}
      }}
    >
      {children}
    </a>
  );
}
