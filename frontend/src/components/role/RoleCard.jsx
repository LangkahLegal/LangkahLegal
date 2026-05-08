"use client";

import { MaterialIcon } from "../ui";

export default function RoleCard({ role, isActive, onSelect }) {
  return (
    <label className="group relative block cursor-pointer outline-none">
      <input
        type="radio"
        name="role"
        value={role.value}
        checked={isActive}
        onChange={() => onSelect(role.value)}
        className="hidden"
      />

      <div
        className={`
          flex flex-col gap-6 p-8 rounded-[2rem]  transition-all duration-300 backdrop-blur-md
          ${
            isActive
              ? "bg-primary/10 border-primary shadow-[0_0_25px_rgba(109,87,252,0.2)]"
              : "bg-[#1f1d35]/40 border-muted/10 hover:border-muted/30"
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <MaterialIcon
              name={role.icon}
              className="text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            />
          </div>

          <div
            className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
              ${
                isActive
                  ? "bg-primary border-primary"
                  : "border-muted/30 group-hover:border-muted/50"
              }
            `}
          >
            {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-headline font-extrabold text-main tracking-tight">
            {role.title}
          </h3>
          <p className="text-muted text-base leading-relaxed">
            {role.description}
          </p>
        </div>
      </div>
    </label>
  );
}
