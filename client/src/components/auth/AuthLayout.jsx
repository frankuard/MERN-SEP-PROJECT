import { GraduationCap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { themes } from '../../data/themes';

const AuthLayout = ({ title, subtitle, children }) => {
  const { theme } = useTheme();
  const t = themes[theme];

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: t.pageBg, color: t.textPrimary }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row">
        <section
          className="relative flex flex-col justify-between px-6 py-10 sm:px-10 lg:w-[42%] lg:px-12 lg:py-14"
          style={{ borderColor: t.border }}
        >
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: t.activeBg, color: t.activeText }}
              >
                <GraduationCap size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: t.textMuted }}>
                  Chautari
                </p>
                <p className="text-sm font-medium" style={{ color: t.textPrimary }}>
                  Campus Community Platform
                </p>
              </div>
            </div>

            <h1 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed sm:text-base" style={{ color: t.textMuted }}>
              {subtitle}
            </p>
          </div>

          <p className="mt-10 hidden text-xs lg:block" style={{ color: t.textMuted }}>
            Connect with your campus — lost &amp; found, help desk, events, and more.
          </p>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10 lg:px-12 lg:py-14">
          <div
            className="w-full max-w-md rounded-2xl border p-6 sm:p-8"
            style={{
              backgroundColor: t.sidebarBg,
              borderColor: t.border,
            }}
          >
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;
