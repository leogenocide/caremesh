import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  ShieldCheck, 
  MessageSquare, 
  Share2, 
  Pin, 
  ExternalLink, 
  Send, 
  Check, 
  BarChart2, 
  Users
} from 'lucide-react';

export const GroupPostCard = ({ post, community }) => {
  const { 
    currentUser, 
    endorsePost, 
    voteOnPoll, 
    addCommentToPost, 
    togglePinPost,
    viewPlanDetail,
    navigateTo,
    inspectEntity,
    observations,
    requests,
    plans
  } = useCareMesh();

  const [isCommentOpen, setIsCommentOpen] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isCorroborated, setIsCorroborated] = useState(false);

  const isAdmin = community?.adminIds?.includes(currentUser.id);
  const totalPollVotes = post.poll
    ? post.poll.options.reduce((acc, opt) => acc + (opt.votes || 0), 0)
    : 0;

  const handleCorroborate = () => {
    if (!isCorroborated) {
      endorsePost(post.id);
      setIsCorroborated(true);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentToPost(post.id, commentText.trim());
    setCommentText('');
  };

  const handleLinkedEntityClick = () => {
    if (!post.linkedEntityType) return;
    if (post.linkedEntityType === 'plan') {
      const p = plans.find(plan => plan.id === post.linkedEntityId);
      if (p) viewPlanDetail(p);
      else navigateTo('plans');
    } else if (post.linkedEntityType === 'request') {
      const r = requests.find(req => req.id === post.linkedEntityId);
      if (r) inspectEntity(r, 'request');
      else navigateTo('collaborate', 'requests', post.linkedEntityId);
    } else if (post.linkedEntityType === 'observation') {
      const o = observations.find(obs => obs.id === post.linkedEntityId);
      if (o) inspectEntity(o, 'observation');
      else navigateTo('explore', null, post.linkedEntityId);
    }
  };

  return (
    <div 
      className="card p-3 p-md-4 mb-3 mb-md-4"
      style={{
        background: '#ffffff',
        border: post.isPinned ? '1px solid var(--amber-300)' : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: post.isPinned ? '0 2px 8px rgba(245, 158, 11, 0.08)' : 'var(--shadow-sm)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Pinned Notice Header */}
      {post.isPinned && (
        <div 
          className="d-flex align-center justify-between p-2 px-2.5 mb-3 rounded"
          style={{ 
            background: 'rgba(254, 243, 199, 0.65)', 
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div className="d-flex align-center gap-2 min-w-0">
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--amber-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Pin size={12} className="text-amber" />
            </div>
            <span className="text-xs font-bold text-amber-900 text-truncate">
              Pinned Community Notice
            </span>
          </div>
          {isAdmin && (
            <button 
              type="button" 
              className="btn btn-ghost btn-xs text-muted"
              style={{ fontSize: '0.725rem', padding: '0.15rem 0.4rem' }}
              onClick={() => togglePinPost(community.id, post.id)}
            >
              Unpin
            </button>
          )}
        </div>
      )}

      {/* 2. Post Author Header */}
      <div className="d-flex align-center justify-between mb-3">
        <div className="d-flex align-center gap-3">
          <img
            src={post.author?.avatar}
            alt={post.author?.name}
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div className="d-flex align-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-primary">{post.author?.name}</span>
              {post.author?.role && (
                <span className="badge badge-gray text-xs font-medium" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                  {post.author.role}
                </span>
              )}
            </div>
            <span className="text-xs text-muted">
              {post.timestamp} · {community?.name || 'Community'}
            </span>
          </div>
        </div>

        {isAdmin && !post.isPinned && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-muted d-flex align-center gap-1"
            onClick={() => togglePinPost(community?.id, post.id)}
            title="Pin to top of group"
          >
            <Pin size={13} />
            <span className="d-none d-sm-inline">Pin</span>
          </button>
        )}
      </div>

      {/* 3. Post Content */}
      <p className="text-sm text-primary mb-3" style={{ lineHeight: '1.5', whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {post.content}
      </p>

      {/* 4. Media Photos Gallery */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div 
          className="mb-3"
          style={{
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            maxHeight: '360px',
            background: '#000000'
          }}
        >
          <img
            src={post.mediaUrls[0]}
            alt="Field observation update"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* 5. Interactive Poll Widget */}
      {post.poll && (
        <div 
          className="card p-3 mb-3"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}
        >
          <div className="d-flex align-center justify-between mb-2">
            <span className="font-bold text-xs text-primary d-flex align-center gap-1">
              <BarChart2 size={14} className="text-blue-600" /> {post.poll.question}
            </span>
            <span className="text-xs text-muted d-flex align-center gap-1">
              <Users size={12} /> {totalPollVotes} total {totalPollVotes === 1 ? 'vote' : 'votes'}
            </span>
          </div>

          <div className="d-flex flex-column gap-2">
            {post.poll.options.map((opt) => {
              const hasVoted = opt.voterIds?.includes(currentUser.id);
              const percentage = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;

              return (
                <div
                  key={opt.id}
                  className="card p-2 cursor-pointer card-interactive"
                  style={{
                    background: hasVoted ? 'var(--primary-50)' : '#ffffff',
                    border: hasVoted ? '1.5px solid var(--primary-500)' : '1px solid var(--border-light)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => voteOnPoll(post.id, opt.id)}
                >
                  {/* Background progress fill */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${percentage}%`,
                      background: hasVoted ? 'rgba(5, 150, 105, 0.15)' : 'rgba(2, 132, 199, 0.08)',
                      zIndex: 1,
                      transition: 'width 0.3s ease'
                    }}
                  />

                  <div className="d-flex align-center justify-between relative z-10" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="d-flex align-center gap-2">
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: hasVoted ? 'none' : '2px solid var(--border-default)',
                          background: hasVoted ? 'var(--primary-600)' : '#ffffff',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        {hasVoted && <Check size={11} />}
                      </div>
                      <span className={`text-xs font-semibold ${hasVoted ? 'text-brand' : 'text-primary'}`}>
                        {opt.text}
                      </span>
                    </div>

                    <div className="d-flex align-center gap-2 text-xs">
                      <span className="font-bold text-primary">{percentage}%</span>
                      <span className="text-muted">({opt.votes})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Linked Real-World CareMesh Object */}
      {post.linkedEntityType && (
        <div 
          className="card p-2 p-sm-3 mb-3 card-interactive cursor-pointer"
          style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
          onClick={handleLinkedEntityClick}
        >
          <div className="d-flex align-center justify-between gap-2 min-w-0">
            <div className="d-flex align-center gap-2 min-w-0 flex-1 flex-wrap">
              <span className="badge badge-primary text-xs text-uppercase font-bold flex-shrink-0">
                Linked {post.linkedEntityType}
              </span>
              <span className="font-semibold text-xs text-primary text-truncate flex-1 min-w-0" style={{ wordBreak: 'break-word' }}>
                {post.linkedEntityTitle}
              </span>
            </div>
            <ExternalLink size={14} className="text-brand flex-shrink-0" />
          </div>
        </div>
      )}

      {/* 7. Action Bar: Corroborate, Comment, Share */}
      <div className="d-flex align-center justify-between pt-2 border-top text-xs text-muted flex-wrap gap-2">
        <div className="d-flex align-center gap-1 flex-wrap">
          <button
            type="button"
            className={`btn btn-xs ${isCorroborated ? 'btn-primary' : 'btn-ghost'} d-flex align-center gap-1`}
            onClick={handleCorroborate}
          >
            <ShieldCheck size={14} />
            <span>{post.endorsedCount || 0} Corroborations</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-xs text-muted d-flex align-center gap-1"
            onClick={() => setIsCommentOpen(!isCommentOpen)}
          >
            <MessageSquare size={14} />
            <span>{post.comments?.length || 0} Comments</span>
          </button>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-xs text-muted d-flex align-center gap-1"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            alert('Post link copied to clipboard.');
          }}
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>
      </div>

      {/* 8. Nested Comment Thread */}
      {isCommentOpen && (
        <div className="mt-3 pt-3 border-top d-flex flex-column gap-2">
          {/* Comments List */}
          {post.comments && post.comments.length > 0 && (
            <div className="d-flex flex-column gap-2 mb-2">
              {post.comments.map(c => (
                <div key={c.id} className="d-flex align-start gap-2 text-xs">
                  <img
                    src={c.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt=""
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div 
                    className="p-2 rounded flex-1"
                    style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}
                  >
                    <div className="d-flex align-center justify-between mb-1">
                      <span className="font-bold text-primary">{c.author?.name}</span>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>{c.time}</span>
                    </div>
                    <p className="text-secondary mb-0" style={{ lineHeight: '1.4' }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Comment Input */}
          <form onSubmit={handleAddComment} className="d-flex align-center gap-2 w-100 min-w-0">
            <img
              src={currentUser.avatar}
              alt=""
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <input
              type="text"
              placeholder="Write a comment or coordination reply..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="form-input flex-1 min-w-0"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)', minWidth: 0 }}
            />
            <button type="submit" className="btn btn-primary btn-xs btn-icon flex-shrink-0" disabled={!commentText.trim()}>
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
