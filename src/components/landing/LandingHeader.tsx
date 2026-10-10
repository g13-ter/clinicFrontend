import { useState } from "react";
import { Link } from "react-router-dom";

import { CloseIcon, MenuIcon } from "../icons";
import { BrandMark, NavLink } from "./shared";

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center px-5 sm:px-8 lg:px-12">
        {/* BRAND */}
        <a
          href="#home"
          onClick={closeMenu}
          className="flex items-center gap-3"
          aria-label="SchoolCare home"
        >
          <BrandMark />

          <span className="leading-none">
            <span className="block text-lg font-extrabold tracking-tight">
              SchoolCare
            </span>

            <span className="mt-1 block text-[10px] font-medium tracking-wide text-slate-500">
              Clinic Management System
            </span>
          </span>
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav
          aria-label="Primary navigation"
          className="mx-auto hidden items-center gap-9 lg:flex"
        >
          <NavLink href="#home">
            Home
          </NavLink>

          <NavLink href="#features">
            Features
          </NavLink>

          <NavLink href="#modules">
            Modules
          </NavLink>

          <NavLink href="#about">
            About
          </NavLink>

          <NavLink href="#contact">
            Contact
          </NavLink>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => {
            setMenuOpen((open) => !open);
          }}
          className="ml-auto rounded-lg border border-slate-200 p-2.5 text-slate-700 lg:hidden"
          aria-expanded={menuOpen}
          aria-label={
            menuOpen
              ? "Close menu"
              : "Open menu"
          }
        >
          {menuOpen ? (
            <CloseIcon />
          ) : (
            <MenuIcon />
          )}
        </button>
      </div>

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-slate-100 bg-white px-5 py-5 shadow-xl lg:hidden"
        >
          <div className="mx-auto grid max-w-[1440px] gap-1">
            {[
              "home",
              "features",
              "modules",
              "about",
              "contact",
            ].map((item) => (
              <a
                key={item}
                href={`#${item}`}
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold capitalize text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                {item}
              </a>
            ))}

            <Link
              to="/login"
              onClick={closeMenu}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
