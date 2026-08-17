import React from 'react';
import { FileText, Heart, MessageCircle, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CampusPostsSection = ({
  t,
  campusPosts,
  onToggleLikePost,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Campus Social Feed &amp; Recent Posts
            </h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
            Official updates, reels, guest speaker announcements, and student club buzz at Biratnagar International College.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('dashboard')}
          className="rounded-xl border px-3.5 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 self-start"
          style={{ borderColor: t.border, color: t.textPrimary }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Posts Feed Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {campusPosts.map((post) => (
          <article
            key={post.id}
            className="flex flex-col justify-between overflow-hidden rounded-3xl border shadow-xs transition-all hover:shadow-md"
            style={{
              backgroundColor: t.cardBg || '#ffffff',
              borderColor: t.border,
            }}
          >
            {/* Post Header */}
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-lg shadow-xs">
                    {post.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        {post.author}
                      </h3>
                      <span className="rounded-full bg-blue-600 text-white p-0.5 text-[9px] flex items-center justify-center h-3.5 w-3.5">
                        ✓
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: t.textMuted }}>
                      {post.handle} · {post.time}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-[10px] font-bold" style={{ color: t.textMuted }}>
                  {post.category}
                </span>
              </div>

              {/* Caption */}
              <p className="mt-3.5 text-xs leading-relaxed" style={{ color: t.textPrimary }}>
                {post.caption}
              </p>
              <p className="mt-1.5 text-[11px] font-bold text-blue-600">
                {post.tag}
              </p>
            </div>

            {/* Post Media Image */}
            <div className="relative w-full bg-black/5 overflow-hidden border-y" style={{ borderColor: t.border }}>
              <img
                src={post.image}
                alt={post.caption}
                className="h-80 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>

            {/* Engagement Bar */}
            <div className="p-4 flex items-center justify-between border-t" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onToggleLikePost(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-125 ${
                    post.liked ? 'text-red-500' : 'hover:text-red-500'
                  }`}
                  style={{ color: post.liked ? '#ef4444' : t.textMuted }}
                >
                  <Heart size={16} className={post.liked ? 'fill-red-500 text-red-500' : ''} />
                  <span>{post.likes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast('Comments section opened', { icon: '💬' })}
                  className="flex items-center gap-1.5 text-xs font-bold hover:text-blue-600 transition-colors"
                  style={{ color: t.textMuted }}
                >
                  <MessageCircle size={16} />
                  <span>{post.comments}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.success('Post link copied to clipboard!', { icon: '🔗' })}
                  className="flex items-center gap-1.5 text-xs font-bold hover:text-emerald-600 transition-colors"
                  style={{ color: t.textMuted }}
                >
                  <Share2 size={16} />
                  <span>{post.shares}</span>
                </button>
              </div>

              <span className="text-[11px] font-medium" style={{ color: t.textMuted }}>
                Biratnagar International College
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CampusPostsSection;
