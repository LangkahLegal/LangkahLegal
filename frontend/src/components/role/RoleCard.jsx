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
        className="peer hidden"
      />
      <div
        className={`role-card transition-all duration-300 ${
          isActive ? "role-card-active border-[#6D57FC]" : "role-card-inactive"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="role-card-icon">
            <MaterialIcon
              name={role.icon}
              className="text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            />
          </div>
          <div
            className={`role-radio ${
              isActive ? "role-radio-active" : "role-radio-inactive"
            }`}
          >
            {isActive && <div className="w-3 h-3 bg-white rounded-full" />}
          </div>
        </div>
        <div className="space-y-2">
          <h3
            className="text-2xl font-extrabold text-[#e8e2fc]"
            style={{ fontFamily: "Urbanist, sans-serif" }}
          >
            {role.title}
          </h3>
          <p className="text-[#aca8c1] text-base leading-relaxed">
            {role.description}
          </p>
        </div>
      </div>
    </label>
  );
}
