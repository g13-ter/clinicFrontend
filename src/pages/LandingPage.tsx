import { useEffect, useState } from "react";

import LandingHeader from "../components/landing/LandingHeader";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import AboutSection from "../components/landing/AboutSection";
import ModulesSection from "../components/landing/ModulesSection";
import RoleShowcase from "../components/landing/RoleShowcase";
import WorkflowSection from "../components/landing/WorkflowSection";
import ContactSection from "../components/landing/ContactSection";

import type { ClinicRole } from "../data/landingData";

export default function LandingPage() {
  const [activeRole, setActiveRole] =
    useState<ClinicRole>("admin");

  useEffect(() => {
    const previousTitle = document.title;

    document.title =
      "SchoolCare | School Clinic Management System";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-950">
      <LandingHeader />

      <main>
        <HeroSection />

        <FeaturesSection />

        <AboutSection />

        <ModulesSection />

        <RoleShowcase
          activeRole={activeRole}
          onChange={setActiveRole}
        />

        <WorkflowSection />

        <ContactSection />
      </main>
    </div>
  );
}