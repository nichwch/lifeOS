"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const HomeButton = () => {
  // Get current path to check if we're on home page
  const pathname = usePathname();

  // Don't render the button if we're on the home page
  if (pathname === "/") return null;

  return (
    <div className="fixed top-5 left-5 bg-orange-200/50 hover:bg-orange-200 px-1 border border-black">
      <Link href="/" className="no-underline text-black visited:text-black">
        home
      </Link>
    </div>
  );
};
