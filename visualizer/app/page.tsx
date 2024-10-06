"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen mx-auto w-full lg:w-[900px] p-4 pt-20">
      <h1 className="mb-10">LifeOS</h1>
      <h1>directory:</h1>
      <Link href="/summary/notes">summary utility</Link>
    </div>
  );
}
