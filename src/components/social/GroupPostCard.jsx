import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { 
  ShieldCheck, 
  MessageSquare, 
  Share2, 
  Pin, 
  ExternalLink, 
  Send, 
  Check, 
  BarChart2, 
  Users,
  Pencil,
  Trash2,
  X,
  ShieldAlert,
  Flag,
  UserX,
  AlertTriangle,
  Tag
} from 'lucide-react';

const PRESET_POST_CATEGORIES = ['General', 'Update', 'Event', 'Mutual Aid', 'Discussion', 'Urgent Alert'];

export const GroupPostCard = ({ post, community }) => {
  const { 
    currentUser, 
    endorsePost, 
    voteOnPoll, 
    addCommentToPost, 
    editPost,
    deletePost,
    editPostComment,
    deletePostComment,
    togglePinPost,
    viewPlanDetail,
    navigateTo,
    inspectEntity,
    observations,
    requests,
    resources = [],
    evidence = [],
    safetyReports = [],
    plans,
    openReportModal,
    kickPostMember,
    viewUserProfile,
    openShareSocialModal
  } = useCareMesh();

  const [isCommentOpen, setIsCommentOpen] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isCorroborated, setIsCorroborated] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || '');
  const [editedCategory, setEditedCategory] = useState(post.category || '');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');

  const commentsPagination = usePagination(post.comments || [], 5);

  const isPlatformAdmin = Boolean(
    currentUser?.role === 'admin' || 
    currentUser?.role === 'Admin' || 
    currentUser?.role === 'coordinator' || 
    currentUser?.role === 'Emergency Coordinator' || 
    currentUser?.role === 'System Administrator' || 
    currentUser?.isPublicRecordsModerator ||
    currentUser?.isAdmin
  );
  const isAdmin = community?.adminIds?.includes(currentUser?.id) || community?.moderatorIds?.includes(currentUser?.id) || isPlatformAdmin;
  const isPostOwner = post.author?.id === currentUser?.id || post.author_id === currentUser?.id;
  const canEditPost = isPostOwner || isAdmin;
  const canDeletePost = isPostOwner || isAdmin;

  const totalPollVotes = post.poll
    ? post.poll.options.reduce((acc, opt) => acc + (opt.votes || 0), 0)
    : 0;

  const handleCorroborate = () => {
    if (isPostOwner) {
      alert('Authors cannot corroborate their own posts.');
      return;
    }
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

  const handleSavePostEdit = (e) => {
    e.preventDefault();
    if (!editedContent.trim()) return;
    let finalCategory = null;
    if (isCustomCategory) {
      finalCategory = customCategory.trim() || 'General';
    } else if (editedCategory && editedCategory !== '__custom__') {
      finalCategory = editedCategory;
    }
    editPost(post.id, { content: editedContent.trim(), category: finalCategory });
    setIsEditingPost(false);
  };

  const handleDeletePost = () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      deletePost(post.id);
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.text);
  };

  const handleSaveCommentEdit = (e, commentId) => {
    e.preventDefault();
    if (!editedCommentText.trim()) return;
    editPostComment(post.id, commentId, editedCommentText.trim());
    setEditingCommentId(null);
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deletePostComment(post.id, commentId);
    }
  };

  const handleKickFromPost = (targetUserId, targetUserName) => {
    if (window.confirm(`Kick and restrict ${targetUserName || 'this member'} from this post? All their comments on this post will be removed and they will not be allowed to post comments on this thread again.`)) {
      kickPostMember(community?.id, post.id, targetUserId);
    }
  };

  const handleReportPost = () => {
    openReportModal({
      targetType: 'post',
      targetId: post.id,
      title: post.content?.slice(0, 50) || 'Community Post',
      reportedUser: post.author,
      communityId: community?.id,
      scope: 'community'
    });
  };

  const handleReportAuthorAvatar = () => {
    openReportModal({
      targetType: 'profile_picture',
      targetId: post.author?.id || post.author_id,
      title: `${post.author?.name || 'Author'}'s Profile Picture`,
      reportedUser: post.author,
      communityId: community?.id,
      scope: 'community'
    });
  };

  const handleReportCommentAvatar = (c) => {
    openReportModal({
      targetType: 'profile_picture',
      targetId: c.author?.id || c.author_id,
      title: `${c.author?.name || 'Commenter'}'s Profile Picture`,
      reportedUser: c.author,
      communityId: community?.id,
      scope: 'community'
    });
  };

  const isRestrictedFromPost = post.restrictedUserIds?.includes(currentUser?.id);

  const handleLinkedEntityClick = () => {
    if (!post?.linkedEntityType) return;
    const type = (post.linkedEntityType || '').toLowerCase();
    const id = post.linkedEntityId;
    const title = post.linkedEntityTitle;

    const findEntity = (list) => {
      if (!list || !Array.isArray(list)) return null;
      if (id) {
        const byId = list.find(item => item.id === id);
        if (byId) return byId;
      }
      if (title) {
        const byTitle = list.find(item => 
          item.title?.toLowerCase() === title.toLowerCase() || 
          item.name?.toLowerCase() === title.toLowerCase()
        );
        if (byTitle) return byTitle;
      }
      return null;
    };

    if (type === 'plan') {
      const p = findEntity(plans);
      if (p) viewPlanDetail(p);
      else navigateTo('plans');
    } else if (type === 'request') {
      const r = findEntity(requests);
      if (r) inspectEntity(r, 'request');
      else navigateTo('collaborate', 'requests', id);
    } else if (type === 'resource') {
      const res = findEntity(resources);
      if (res) inspectEntity(res, 'resource');
      else navigateTo('collaborate', 'resources', id);
    } else if (type === 'safety') {
      const s = findEntity(safetyReports);
      if (s) inspectEntity(s, 'safety');
      else navigateTo('explore', null, id);
    } else if (type === 'evidence') {
      const ev = findEntity(evidence);
      if (ev) inspectEntity(ev, 'evidence');
    } else if (type === 'observation') {
      const o = findEntity(observations);
      if (o) inspectEntity(o, 'observation');
      else navigateTo('explore', null, id);
    } else {
      const allEntities = [
        ...(observations || []),
        ...(requests || []),
        ...(resources || []),
        ...(plans || []),
        ...(safetyReports || [])
      ];
      const anyEntity = findEntity(allEntities);
      if (anyEntity) {
        inspectEntity(anyEntity, type);
      }
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
        <div 
          className="d-flex align-center gap-3 user-profile-trigger"
          onClick={() => viewUserProfile && viewUserProfile(post.author)}
          title={`View ${post.author?.name || 'Author'}'s profile & contributions`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              viewUserProfile && viewUserProfile(post.author);
            }
          }}
        >
          <img
            src={post.author?.avatar}
            alt={post.author?.name}
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div className="d-flex align-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-primary user-profile-name">{post.author?.name}</span>
              {post.author?.role && (
                <span className="badge badge-gray text-xs font-medium" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                  {post.author.role}
                </span>
              )}
            </div>
            <div className="d-flex align-center gap-2 flex-wrap">
              <span className="text-xs text-muted">
                {post.timestamp} · {community?.name || 'Community'}
              </span>
              {post.category && (
                <span className="badge badge-gray text-xs font-semibold d-inline-flex align-center gap-1" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                  <Tag size={10} className="text-brand" />
                  {post.category.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="d-flex align-center gap-1">
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

          {canEditPost && !isEditingPost && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-muted d-flex align-center gap-1"
              onClick={() => {
                setEditedContent(post.content);
                const isCustom = post.category && !PRESET_POST_CATEGORIES.includes(post.category);
                setEditedCategory(isCustom ? '__custom__' : (post.category || ''));
                setIsCustomCategory(Boolean(isCustom));
                setCustomCategory(isCustom ? post.category : '');
                setIsEditingPost(true);
              }}
              title="Edit post"
            >
              <Pencil size={13} />
              <span className="d-none d-sm-inline">Edit</span>
            </button>
          )}

          {canDeletePost && !isEditingPost && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-rose d-flex align-center gap-1"
              onClick={handleDeletePost}
              title="Delete post"
            >
              <Trash2 size={13} />
              <span className="d-none d-sm-inline">Delete</span>
            </button>
          )}

          {/* Report Post Action */}
          <button
            type="button"
            className="btn btn-ghost btn-xs text-muted d-flex align-center gap-1"
            onClick={handleReportPost}
            title="Report this post"
          >
            <Flag size={13} />
            <span className="d-none d-md-inline">Report</span>
          </button>

          {/* Report Author Profile Picture */}
          {post.author?.id !== currentUser?.id && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-muted d-flex align-center gap-1"
              onClick={handleReportAuthorAvatar}
              title="Report author's profile picture"
            >
              <ShieldAlert size={13} />
              <span className="d-none d-md-inline">Report Avatar</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Post Content (or Edit Form) */}
      {isEditingPost ? (
        <form onSubmit={handleSavePostEdit} className="mb-3 d-flex flex-column gap-2 p-2.5 rounded border" style={{ background: 'var(--bg-subtle)' }}>
          <span className="text-xs font-bold text-secondary">Edit Post</span>
          <textarea
            className="form-input text-sm"
            rows={3}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
            required
          />

          <div className="d-flex flex-column gap-1">
            <label className="text-xs text-secondary font-medium">Category</label>
            <select
              className="form-select text-xs"
              value={isCustomCategory ? '__custom__' : editedCategory}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomCategory(true);
                } else {
                  setIsCustomCategory(false);
                  setEditedCategory(e.target.value);
                }
              }}
            >
              <option value="">No Category</option>
              {PRESET_POST_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__custom__">✨ + Custom Category...</option>
            </select>
            {isCustomCategory && (
              <input
                type="text"
                placeholder="Enter custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="form-input text-xs mt-1"
                autoFocus
              />
            )}
          </div>

          <div className="d-flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-xs d-flex align-center gap-1"
              onClick={() => setIsEditingPost(false)}
            >
              <X size={12} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-xs d-flex align-center gap-1"
              disabled={!editedContent.trim()}
            >
              <Check size={12} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-primary mb-3" style={{ lineHeight: '1.5', whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {post.content}
        </p>
      )}

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
              const hasVoted = opt.voterIds?.includes(currentUser?.id);
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
          title={`Inspect linked ${post.linkedEntityType}: ${post.linkedEntityTitle || ''}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLinkedEntityClick();
            }
          }}
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
            disabled={isPostOwner}
            title={isPostOwner ? 'Authors cannot corroborate their own posts' : 'Corroborate this community report'}
            style={isPostOwner ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
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
          onClick={() => openShareSocialModal(post, 'post')}
          title="Share post to other platforms or community feed"
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
              {commentsPagination.paginatedItems.map(c => {
                const isCommentOwner = c.author?.id === currentUser?.id || c.author_id === currentUser?.id;
                const canDeleteThisComment = isCommentOwner || isAdmin;
                const isThisCommentEditing = editingCommentId === c.id;

                return (
                  <div key={c.id} className="d-flex align-start gap-2 text-xs">
                    <img
                      src={c.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt=""
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
                      onClick={() => viewUserProfile && viewUserProfile(c.author)}
                      title={`View ${c.author?.name || 'Commenter'}'s profile`}
                    />
                    <div 
                      className="p-2 rounded flex-1"
                      style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}
                    >
                      <div className="d-flex align-center justify-between mb-1">
                        <span 
                          className="font-bold text-primary user-profile-name"
                          style={{ cursor: 'pointer' }}
                          onClick={() => viewUserProfile && viewUserProfile(c.author)}
                          title={`View ${c.author?.name || 'Commenter'}'s profile`}
                        >
                          {c.author?.name}
                        </span>
                        <div className="d-flex align-center gap-1.5">
                          <span className="text-muted" style={{ fontSize: '0.68rem' }}>{c.time}</span>
                          {/* Post Creator Kick: post author can kick/restrict disruptive commenter */}
                          {isPostOwner && c.author?.id !== currentUser?.id && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs p-0 text-rose"
                              onClick={() => handleKickFromPost(c.author?.id, c.author?.name)}
                              title="Kick commenter from this post discussion"
                            >
                              <UserX size={11} />
                            </button>
                          )}
                          {/* Report commenter avatar */}
                          {c.author?.id !== currentUser?.id && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs p-0 text-muted"
                              onClick={() => handleReportCommentAvatar(c)}
                              title="Report commenter profile picture"
                            >
                              <Flag size={11} />
                            </button>
                          )}
                          {isCommentOwner && !isThisCommentEditing && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs p-0 text-muted"
                              onClick={() => handleStartEditComment(c)}
                              title="Edit comment"
                            >
                              <Pencil size={11} />
                            </button>
                          )}
                          {canDeleteThisComment && !isThisCommentEditing && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs p-0 text-rose"
                              onClick={() => handleDeleteComment(c.id)}
                              title="Delete comment"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isThisCommentEditing ? (
                        <form onSubmit={(e) => handleSaveCommentEdit(e, c.id)} className="d-flex flex-column gap-1.5 mt-1">
                          <input
                            type="text"
                            className="form-input text-xs"
                            value={editedCommentText}
                            onChange={(e) => setEditedCommentText(e.target.value)}
                            required
                            autoFocus
                          />
                          <div className="d-flex justify-end gap-1">
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs p-1"
                              style={{ fontSize: '0.7rem' }}
                              onClick={() => setEditingCommentId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary btn-xs p-1"
                              style={{ fontSize: '0.7rem' }}
                              disabled={!editedCommentText.trim()}
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-secondary mb-0" style={{ lineHeight: '1.4' }}>{c.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comments Pagination */}
          {post.comments && post.comments.length > 0 && (
            <Pagination
              compact={true}
              currentPage={commentsPagination.currentPage}
              totalPages={commentsPagination.totalPages}
              totalItems={commentsPagination.totalItems}
              startIndex={commentsPagination.startIndex}
              endIndex={commentsPagination.endIndex}
              onPageChange={commentsPagination.setPage}
              pageSize={commentsPagination.pageSize}
              onPageSizeChange={commentsPagination.handlePageSizeChange}
              itemName="comments"
            />
          )}

          {/* Quick Comment Input or Restriction Warning */}
          {isRestrictedFromPost ? (
            <div 
              className="p-2.5 rounded d-flex align-center gap-2 text-xs" 
              style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)' }}
            >
              <AlertTriangle size={15} className="text-rose flex-shrink-0" />
              <span>You have been restricted from commenting on this post by the author.</span>
            </div>
          ) : (
            <form onSubmit={handleAddComment} className="d-flex align-center gap-2 w-100 min-w-0">
              <img
                src={currentUser?.avatar}
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
          )}
        </div>
      )}
    </div>
  );
};
