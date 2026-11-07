import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { CloseIcon, MenuIcon } from "../icons";
import { BrandMark, NavLink } from "./shared";

const sections = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "about", label: "About" },
  { id: "modules", label: "Modules" },
  { id: "contact", label: "Contact" },
] as const;

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      let nextSection: (typeof sections)[number]["id"] = sections[0].id;
      const activationLine = 96;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= activationLine) {
          nextSection = section.id;
        }
      }

      const atPageBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atPageBottom) nextSection = "contact";

      setActiveSection((current) =>
        current === nextSection ? current : nextSection,
      );
    };

    const scheduleUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

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
          {sections.map((section) => (
            <NavLink
              key={section.id}
              href={`#${section.id}`}
              active={activeSection === section.id}
            >
              {section.label}
            </NavLink>
          ))}
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
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={closeMenu}
                aria-current={activeSection === section.id ? "location" : undefined}
                className={`rounded-lg px-3 py-3 text-sm font-semibold capitalize transition hover:bg-blue-50 hover:text-blue-700 ${
                  activeSection === section.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700"
                }`}
              >
                {section.label}
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
