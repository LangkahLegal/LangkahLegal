import { MaterialIcon } from "../ui";

export default function RoleHeader({ onBack, title }) {
  return (
    <header className="top-nav">
      <div className="flex items-center w-full max-w-md mx-auto">
        <button onClick={onBack} className="btn-icon">
          <MaterialIcon name="arrow_back" />
        </button>
        <h1 className="top-nav-title">{title}</h1>
      </div>
    </header>
  );
}
