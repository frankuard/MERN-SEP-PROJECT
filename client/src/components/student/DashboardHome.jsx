import React from 'react';
import GreetingHeader from './Dashboard/GreetingHeader';
import CanteenSpecial from './Dashboard/CanteenSpecial';
import ImportantAnnouncements from './Dashboard/ImportantAnnouncements';
import UpcomingEvents from './Dashboard/UpcomingEvents';

const DashboardHome = ({
  t,
  greeting,
  studentName,
  collegeEvents,
  communityEvents,
  announcements,
  onNavigateTab,
}) => {
  return (
    <div className="dashboard-playful relative space-y-8 pb-4">
      {/* Background decorative dots */}
      <div className="pointer-events-none absolute -left-4 top-32 h-3 w-3 rounded-full bg-pink-400 opacity-50" />
      <div className="pointer-events-none absolute right-8 top-64 h-4 w-4 rounded-full bg-purple-400 opacity-40" />
      <div className="pointer-events-none absolute left-1/3 top-[480px] h-2 w-2 rounded-full bg-yellow-400 opacity-60" />

      <GreetingHeader
        t={t}
        greeting={greeting}
        studentName={studentName}
        onNavigateTab={onNavigateTab}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className="rounded-[28px] p-5 sm:p-6"
          style={{
            backgroundColor: t.cardBg,
            boxShadow: t.shadowCard,
          }}
        >
          <ImportantAnnouncements t={t} />
        </div>
        <div
          className="rounded-[28px] p-5 sm:p-6"
          style={{
            backgroundColor: t.cardBg,
            boxShadow: t.shadowCard,
          }}
        >
          <UpcomingEvents t={t} onNavigateTab={onNavigateTab} />
        </div>
      </div>

      <CanteenSpecial t={t} onNavigateTab={onNavigateTab} />
    </div>
  );
};

export default DashboardHome;
