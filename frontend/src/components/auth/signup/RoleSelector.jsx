"use client";

import { MaterialIcon } from "@/components/ui";

const ROLES_DATA = [
  {
    value: "client",
    icon: "person_search",
    title: "Client",
    description: "Butuh bantuan hukum profesional",
  },
  {
    value: "konsultan",
    icon: "gavel",
    title: "Konsultan Hukum",
    description: "Berikan jasa konsultasi hukum",
  },
];

export default function RoleSelector({ selectedRole, onSelect }) {
  return (
    <div className="space-y-3" data-testid="role-selector">
      <label className="block font-headline text-[11px] font-bold uppercase tracking-[0.12em] text-muted ml-1">
        Pilih Peran
      </label>

      <div className="grid grid-cols-2 gap-3">
        {ROLES_DATA.map((role) => {
          const isActive = selectedRole === role.value;
          return (
            <label
              key={role.value}
              className="group relative block cursor-pointer outline-none"
              data-testid={`role-option-${role.value}`}
            >
              <input
                type="radio"
                name="signup_role"
                value={role.value}
                checked={isActive}
                onChange={() => onSelect(role.value)}
                className="hidden"
              />

              <div
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 border text-center
                  ${
                    isActive
                      ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(109,87,252,0.15)]"
                      : "bg-input border-surface hover:border-muted/30"
                  }
                `}
              >
                <div
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300
                    ${isActive ? "bg-primary/20 text-primary" : "bg-surface text-muted"}
                  `}
                >
                  <MaterialIcon
                    name={role.icon}
                    className="text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-headline font-bold text-main">
                    {role.title}
                  </h3>
                  <p className="text-[11px] text-muted leading-snug mt-0.5">
                    {role.description}
                  </p>
                </div>

                {/* Radio indicator */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${
                      isActive
                        ? "bg-primary border-primary"
                        : "border-muted/30 group-hover:border-muted/50"
                    }
                  `}
                >
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
