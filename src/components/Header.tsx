import Link from "next/link";
import { Logo } from "./Logo";
import { RegionPicker } from "./RegionPicker";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import type { NavGroup } from "@/lib/nav";

export function Header({ groups }: { groups: NavGroup[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur">
      <div className="flex h-[4.25rem] items-center gap-4 px-4 lg:px-5">
        <Link href="/" prefetch={false} className="shrink-0" aria-label="K Young home">
          <Logo />
        </Link>
        <div className="hidden max-w-xl flex-1 md:block lg:ml-[4.5rem]">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RegionPicker compact />
          <ThemeToggle />
          <MobileMenu groups={groups} />
        </div>
      </div>
      <div className="px-4 pb-2.5 md:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
