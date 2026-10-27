import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="a-auth">
      <div className="a-auth__glow" aria-hidden="true" />
      <div className="a-auth__card">
        <div className="a-auth__brand">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M73.722 82.207 L88.536 97.021 Q89.950 98.435 91.364 97.021 L97.021 91.364 Q98.435 89.950 97.021 88.536 L82.207 73.722 A40 40 0 1 0 73.722 82.207 Z M50 24 C51.6 41 59 48.4 76 50 C59 51.6 51.6 59 50 76 C48.4 59 41 51.6 24 50 C41 48.4 48.4 41 50 24 Z"
            />
            <path className="a-side__spark" d="M50 24 C51.6 41 59 48.4 76 50 C59 51.6 51.6 59 50 76 C48.4 59 41 51.6 24 50 C41 48.4 48.4 41 50 24 Z" />
          </svg>
          <span>
            onyq <em>admin</em>
          </span>
        </div>
        {children}
      </div>
      <p className="a-auth__foot">Protected area · every sign-in is logged</p>
    </div>
  );
}
