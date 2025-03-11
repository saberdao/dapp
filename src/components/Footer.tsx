import React from "react";

export default function Footer() {
  return (
    <>
      <div className="w-full flex flex-col lg:flex-row gap-1">
        <div className="flex-grow flex-wrap flex justify-center gap-3 items-center">
          <a
            href="https://saberdao.so/terms"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            Terms of Service
          </a>{" "}
          |
          <a
            href="https://saberdao.so/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            Privacy Policy
          </a>{" "}
          | &copy; Saber DAO 2025
        </div>
      </div>
    </>
  );
}
