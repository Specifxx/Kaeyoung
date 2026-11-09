import Link from "next/link";
import { Logo } from "./Logo";
import { RegionPicker } from "./RegionPicker";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { HeaderMenus } from "./HeaderMenus";
import type { HeaderMenu, NavGroup } from "@/lib/nav";
import { CartHeaderLink } from "@/components/cart/CartHeaderLink";

export function Header({ groups, menus }: { groups: NavGroup[]; menus: HeaderMenu[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur">
      <div className="flex h-[4.25rem] items-center gap-2 px-4 sm:gap-4 lg:px-5">
        <Link href="/" prefetch={false} className="shrink-0" aria-label="KaeYoung home">
          <Logo wordmark="hidden min-[360px]:flex" />
        </Link>
        <HeaderMenus menus={menus} />
        <div className="hidden min-w-0 max-w-xl flex-1 md:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RegionPicker compact />
          <ThemeToggle />
          {/* The cart list (components/cart, owner 2026-11-06), with its count: here from md, beside the search on phones. */}
        <CartHeaderLink className="hidden md:inline-flex" />
        <MobileMenu groups={groups} />
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-2.5 md:hidden">
        <div className="min-w-0 flex-1">
          <SearchBox />
        </div>
        <CartHeaderLink />
      </div>
    </header>
  );
}
