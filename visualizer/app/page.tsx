/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen mx-auto w-full lg:w-[1000px] p-4 pt-20 flex">
      <div className="flex flex-col">
        <h1 className="mb-10 font-bold">LifeOS</h1>
        <Link href="/summary/notes">summaries</Link>
        <Link href="/advice/notes">advice</Link>
        <Link href="/links/notes">links</Link>
        <br />
        <Link href="/summary/notes/projnotes">summaries: projects</Link>
        <Link href="/advice/notes/projnotes">advice: projects</Link>
        <Link href="/links/notes/projnotes">links: projects</Link>
      </div>
      <div className="ml-48 flex border-[2.5px] border-black h-[700px] box-content">
        <img
          src="./temple.JPG"
          alt="temple"
          className="h-[700px] grayscale sepia opacity-70"
        />
      </div>
    </div>
  );
}
