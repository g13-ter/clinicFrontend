import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Patient } from "../utils/types";
import { patientIdentifier, patientTypeLabel } from "../utils/patient";

interface Props {
  patients: Patient[];
  value: string;
  onChange: (patientId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const patientLabel = (patient: Patient) =>
  `${patient.firstName} ${patient.lastName} (${patientIdentifier(patient)}) · ${patientTypeLabel(patient)}`;

function SearchablePatientSelect({
  patients,
  value,
  onChange,
  disabled = false,
  placeholder = "Search patient name or ID...",
}: Props) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipNextValueSync = useRef(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedPatient = patients.find((patient) => patient._id === value);
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return patients.slice(0, 12);
    return patients
      .filter((patient) =>
        `${patient.firstName} ${patient.lastName} ${patientIdentifier(patient)} ${patientTypeLabel(patient)}`
          .toLowerCase()
          .includes(normalizedQuery)
      )
      .slice(0, 12);
  }, [normalizedQuery, patients]);

  useEffect(() => {
    if (skipNextValueSync.current) {
      skipNextValueSync.current = false;
      return;
    }
    setQuery(selectedPatient ? patientLabel(selectedPatient) : "");
  }, [selectedPatient]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(value ? "" : "Please choose a patient from the matching results.");
  }, [value]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
        if (selectedPatient) setQuery(patientLabel(selectedPatient));
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [selectedPatient]);

  const selectPatient = (patient: Patient) => {
    onChange(patient._id);
    setQuery(patientLabel(patient));
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      const patient = results[activeIndex];
      if (patient) selectPatient(patient);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      setQuery(selectedPatient ? patientLabel(selectedPatient) : "");
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-label="Search and select patient"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          value={query}
          required
          disabled={disabled}
          placeholder={disabled ? "Loading patients..." : placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value) skipNextValueSync.current = true;
            onChange("");
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="input w-full pr-10"
        />
        {query && !disabled && (
          <button
            type="button"
            aria-label="Clear selected patient"
            onClick={() => {
              setQuery("");
              if (value) skipNextValueSync.current = true;
              onChange("");
              setOpen(true);
              setActiveIndex(0);
            }}
            className="absolute inset-y-0 right-0 px-3 text-lg text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        )}
      </div>

      {open && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Matching patients"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No patients match that name or ID.</p>
          ) : (
            results.map((patient, index) => (
              <button
                id={`${listboxId}-option-${index}`}
                key={patient._id}
                type="button"
                role="option"
                aria-selected={patient._id === value}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectPatient(patient)}
                className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-blue-50 text-blue-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-medium">{patient.firstName} {patient.lastName}</span>
                <span className="ml-2 font-mono text-xs text-slate-500">{patientIdentifier(patient)}</span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">{patientTypeLabel(patient)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SearchablePatientSelect;
