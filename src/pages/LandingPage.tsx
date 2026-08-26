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
import type { ClinicProfile } from "../utils/types";
import { api } from "../services/api";

export default function LandingPage() {
  const [activeRole, setActiveRole] =
    useState<ClinicRole>("admin");
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile | null>(null);

  useEffect(() => {
    const previousTitle = document.title;

    document.title =
      "SchoolCare | School Clinic Management System";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get<ClinicProfile>("/system-settings/clinic-profile")
      .then((response) => { if (!cancelled) setClinicProfile(response.data); })
      .catch(() => { if (!cancelled) setClinicProfile(null); });
    return () => { cancelled = true; };
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

        <ContactSection clinicProfile={clinicProfile} />
      </main>
    </div>
  );
}
