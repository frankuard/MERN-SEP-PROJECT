import {
  Activity,
  BookOpen,
  Info,
  Presentation,
  Target,
} from 'lucide-react';

// Shared renderer for a community's About Community content (description,
// purpose, activities, workshops, learning areas). Used verbatim by BOTH the
// Managed Users "About Community" screen and the DevCorps Communities Portal
// dropdowns, so the two views can never drift — one component, same data.
const SECTION_ICONS = {
  purpose: Target,
  activities: Activity,
  workshops: Presentation,
  learningAreas: BookOpen,
};

const SECTION_LABELS = {
  purpose: 'Purpose',
  activities: 'Activities',
  workshops: 'Workshops',
  learningAreas: 'Learning Areas',
};

const AboutSection = ({ title, icon: Icon, items, t }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div>
      <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: t.textMuted }}>
        <Icon size={14} style={{ color: '#9333ea' }} />
        {title}
      </h4>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold sm:text-[13px]"
            style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textSecondary }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

// `profile` is one CommunityProfile document from GET /communities:
// { communityId, description, purpose, activities[], workshops[], learningAreas[] }.
const CommunityAboutPanel = ({ profile, t }) => {
  if (!profile) {
    return (
      <p className="text-sm" style={{ color: t.textMuted }}>
        About information isn&apos;t available yet for this community.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {profile.description && (
        <div>
          <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: t.textMuted }}>
            <Info size={14} style={{ color: '#9333ea' }} />
            Description
          </h4>
          <p className="mt-2.5 text-sm leading-relaxed sm:text-[15px]" style={{ color: t.textSecondary }}>
            {profile.description}
          </p>
        </div>
      )}

      {profile.purpose && (
        <AboutSection title={SECTION_LABELS.purpose} icon={SECTION_ICONS.purpose} items={[profile.purpose]} t={t} />
      )}

      <AboutSection title={SECTION_LABELS.activities} icon={SECTION_ICONS.activities} items={profile.activities} t={t} />
      <AboutSection title={SECTION_LABELS.workshops} icon={SECTION_ICONS.workshops} items={profile.workshops} t={t} />
      <AboutSection title={SECTION_LABELS.learningAreas} icon={SECTION_ICONS.learningAreas} items={profile.learningAreas} t={t} />

      {!profile.description &&
        !profile.purpose &&
        (!profile.activities || profile.activities.length === 0) &&
        (!profile.workshops || profile.workshops.length === 0) &&
        (!profile.learningAreas || profile.learningAreas.length === 0) && (
        <p className="text-sm" style={{ color: t.textMuted }}>
          Nothing has been added to this community&apos;s About page yet.
        </p>
      )}
    </div>
  );
};

export default CommunityAboutPanel;