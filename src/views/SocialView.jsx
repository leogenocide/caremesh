import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCareMesh } from '../context/useCareMesh';
import { Tabs } from '../components/common/Tabs';
import { Pagination } from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';
import { EmptyState } from '../components/common/EmptyState';
import { GroupCoverHeader } from '../components/social/GroupCoverHeader';
import { GroupPostComposer } from '../components/social/GroupPostComposer';
import { GroupPostCard } from '../components/social/GroupPostCard';
import { GroupAboutTab } from '../components/social/GroupAboutTab';
import { GroupRequestsTab } from '../components/social/GroupRequestsTab';
import { GroupMediaTab } from '../components/social/GroupMediaTab';
import { GroupMembersTab } from '../components/social/GroupMembersTab';
import { GroupModerationTab } from '../components/social/GroupModerationTab';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  Send, 
  Plus, 
  Search, 
  ExternalLink,
  ShieldCheck,
  Link2,
  ArrowLeft,
  X
} from 'lucide-react';

export const SocialView = () => {
  const { communityId } = useParams();
  const {
    communities,
    posts,
    createPost,
    conversations,
    activeConversationId,
    setActiveConversationId,
    sendDirectMessage,
    currentUser,
    openCreateGroupModal,
    toggleJoinCommunity,
    plans,
    observations,
    requests,
    viewPlanDetail,
    navigateTo,
    currentSubTab,
    selectedCommunityId,
    setSelectedCommunityId,
    viewUserProfile
  } = useCareMesh();

  // If navigated via /social/:communityId, select it immediately
  useEffect(() => {
    if (communityId && communities.some(c => c.id === communityId)) {
      setSelectedCommunityId(communityId);
    }
  }, [communityId, communities, setSelectedCommunityId]);

  // Top-level tabs
  const [localActiveMainTab, setLocalActiveMainTab] = useState('communities'); // 'communities' | 'feed' | 'messages'
  const activeMainTab = (currentSubTab && ['communities', 'feed', 'messages'].includes(currentSubTab))
    ? currentSubTab
    : localActiveMainTab;
  const setActiveMainTab = (tab) => {
    setLocalActiveMainTab(tab);
    if (navigateTo) navigateTo('social', tab);
  };
  const [groupSubTab, setGroupSubTab] = useState('discussion'); // 'discussion' | 'about' | 'requests' | 'media' | 'members'
  
  // Left rail group search & category filter
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupCategoryFilter, setGroupCategoryFilter] = useState('all');

  // Direct messages & feed creation states
  const [newFeedPostText, setNewFeedPostText] = useState('');
  const [feedLinkedEntity, setFeedLinkedEntity] = useState('');
  const [directMessageText, setDirectMessageText] = useState('');

  // Mobile navigation states
  const [isMobileGroupsOpen, setIsMobileGroupsOpen] = useState(false);
  const [isMobileChatViewing, setIsMobileChatViewing] = useState(false);

  const topTabs = [
    { id: 'communities', label: 'Communities & Groups', icon: <Users size={16} />, count: communities.length },
    { id: 'feed', label: 'Neighborhood Feed', icon: <Share2 size={16} />, count: posts.length },
    { id: 'messages', label: 'Direct Coordination Messages', icon: <MessageSquare size={16} /> }
  ];

  // Active community resolution
  const selectedCommunity = communities.find(c => c.id === selectedCommunityId) || communities[0];

  // Filtered groups for left rail
  const joinedGroups = communities.filter(c => c.isJoined);
  const discoverGroups = communities.filter(c => {
    if (groupCategoryFilter !== 'all' && c.category !== groupCategoryFilter) return false;
    if (groupSearchQuery.trim()) {
      const q = groupSearchQuery.toLowerCase();
      const locStr = typeof c.location === 'object' ? (c.location?.address || '') : (c.location || '');
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || locStr.toLowerCase().includes(q);
    }
    return true;
  });


  // Group-specific posts (sorted: pinned first, then newest)
  const groupPosts = posts
    .filter(p => p.communityId === selectedCommunity?.id || (!p.communityId && selectedCommunity?.id === 'com_01'))
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const groupPostsPagination = usePagination(groupPosts, 5);
  const feedPostsPagination = usePagination(posts, 6);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  const handleCreateFeedPost = (e) => {
    e.preventDefault();
    if (!newFeedPostText.trim()) return;

    let linked = null;
    if (feedLinkedEntity) {
      if (feedLinkedEntity.startsWith('obs_')) {
        const o = observations.find(obs => obs.id === feedLinkedEntity);
        if (o) linked = { type: 'observation', id: o.id, title: o.title };
      } else if (feedLinkedEntity.startsWith('plan_')) {
        const p = plans.find(plan => plan.id === feedLinkedEntity);
        if (p) linked = { type: 'plan', id: p.id, title: p.title };
      } else if (feedLinkedEntity.startsWith('req_')) {
        const r = requests.find(req => req.id === feedLinkedEntity);
        if (r) linked = { type: 'request', id: r.id, title: r.title };
      }
    }

    createPost(newFeedPostText.trim(), linked);
    setNewFeedPostText('');
    setFeedLinkedEntity('');
  };

  const handleSendDirectMessage = (e) => {
    e.preventDefault();
    if (!directMessageText.trim() || !activeConversation) return;

    sendDirectMessage(activeConversation.id, directMessageText);
    setDirectMessageText('');
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Header */}
      <div className="d-flex align-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-primary">Communities, Circles & Direct Coordination</h2>
          <p className="text-xs text-muted d-none d-sm-block">
            Organize neighbors in collaborative groups, coordinate action on shared feeds, and communicate without popularity algorithms.
          </p>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <Tabs
        tabs={topTabs}
        activeTab={activeMainTab}
        onChange={setActiveMainTab}
      />

      {/* ============================================================ */}
      {/* TAB 1: FACEBOOK GROUPS WORKSPACE                             */}
      {/* ============================================================ */}
      {activeMainTab === 'communities' && (
        <div className="social-workspace-grid">
          {/* Mobile Group Switcher Bar (Visible on mobile <= 900px) */}
          <div className="d-flex d-md-none align-center justify-between p-2 card w-100" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div className="d-flex align-center gap-2 min-w-0">
              <img
                src={selectedCommunity.avatar}
                alt=""
                style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
              />
              <span className="font-bold text-xs text-primary text-truncate">
                {selectedCommunity.name}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
              onClick={() => setIsMobileGroupsOpen(!isMobileGroupsOpen)}
            >
              <span>{isMobileGroupsOpen ? 'Hide Directory' : 'Switch Group'}</span>
            </button>
          </div>

          {/* LEFT RAIL: GROUPS DIRECTORY & DISCOVERY (Facebook Groups Sidebar) */}
          <aside 
            className={`social-left-rail flex-column gap-3 ${isMobileGroupsOpen ? 'd-flex' : 'd-none d-md-flex'}`}
          >
            {/* Mobile Header with Close Button */}
            {isMobileGroupsOpen && (
              <div className="d-flex d-md-none align-center justify-between p-2.5 rounded bg-white border mb-1">
                <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                  <Users size={14} className="text-brand" />
                  <span>Community Groups & Circles</span>
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-muted"
                  onClick={() => setIsMobileGroupsOpen(false)}
                  aria-label="Close group directory"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Create Group Button */}
            <button
              className="btn btn-primary w-100 d-flex align-center justify-center gap-2"
              onClick={() => {
                setIsMobileGroupsOpen(false);
                openCreateGroupModal();
              }}
            >
              <Plus size={16} />
              <span>Create New Group</span>
            </button>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} className="text-muted" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search groups..."
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
              />
            </div>

            {/* "Your Groups" (Joined Circles) */}
            <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
              <span className="text-xs font-bold text-muted text-uppercase d-block mb-2">
                Your Groups ({joinedGroups.length})
              </span>

              <div className="d-flex flex-column gap-1">
                {joinedGroups.map(grp => {
                  const isSelected = grp.id === selectedCommunityId;
                  return (
                    <div
                      key={grp.id}
                      className="d-flex align-center gap-2 p-2 rounded cursor-pointer card-interactive"
                      style={{
                        background: isSelected ? 'var(--primary-50)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--primary-600)' : '3px solid transparent'
                      }}
                      onClick={() => {
                        setSelectedCommunityId(grp.id);
                        setGroupSubTab('discussion');
                        setIsMobileGroupsOpen(false);
                      }}
                    >
                      <img
                        src={grp.avatar}
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-primary d-block text-truncate">
                          {grp.name}
                        </span>
                        <span className="text-muted text-truncate d-block" style={{ fontSize: '0.68rem' }}>
                          {grp.memberCount} neighbors
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* "Discover Groups" (Categories & Explorer) */}
            <div className="card p-3" style={{ background: '#ffffff', border: '1px solid var(--border-light)' }}>
              <div className="d-flex align-center justify-between mb-2">
                <span className="text-xs font-bold text-muted text-uppercase">
                  Discover Groups
                </span>
              </div>

              {/* Category Pills */}
              <div className="d-flex gap-1 flex-wrap mb-3">
                {['all', 'environmental', 'mutual_aid', 'food_security', 'safety'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-xs ${groupCategoryFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                    onClick={() => setGroupCategoryFilter(cat)}
                  >
                    {cat === 'all' ? 'All' : cat === 'environmental' ? '🌱 Eco' : cat === 'mutual_aid' ? '🤝 Aid' : cat === 'food_security' ? '🍎 Food' : '🚸 Safety'}
                  </button>
                ))}
              </div>

              {/* Discover List */}
              <div className="d-flex flex-column gap-2">
                {discoverGroups.map(grp => {
                  const isSelected = grp.id === selectedCommunityId;
                  return (
                    <div
                      key={grp.id}
                      className="p-2 rounded card-interactive cursor-pointer"
                      style={{
                        background: isSelected ? 'var(--primary-50)' : 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)'
                      }}
                      onClick={() => {
                        setSelectedCommunityId(grp.id);
                        setGroupSubTab('discussion');
                        setIsMobileGroupsOpen(false);
                      }}
                    >
                      <div className="d-flex align-center gap-2 mb-1">
                        <img
                          src={grp.avatar}
                          alt=""
                          style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        />
                        <span className="font-bold text-xs text-primary text-truncate flex-1">
                          {grp.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-2 text-truncate" style={{ fontSize: '0.7rem' }}>
                        {grp.description}
                      </p>
                      <div className="d-flex align-center justify-between">
                        <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>
                          {grp.memberCount} neighbors
                        </span>
                        <button
                          type="button"
                          className={`btn btn-xs ${grp.isJoined ? 'btn-ghost text-brand' : 'btn-secondary'}`}
                          style={{ padding: '0.1rem 0.45rem', fontSize: '0.7rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleJoinCommunity(grp.id);
                          }}
                        >
                          {grp.isJoined ? 'Joined' : '+ Join'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* MAIN COLUMN: ACTIVE GROUP WORKSPACE */}
          <main className="d-flex flex-column min-w-0 w-100" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            {selectedCommunity ? (
              <>
                {/* 1. Facebook Group Cover Header */}
                <GroupCoverHeader
                  community={selectedCommunity}
                  activeTab={groupSubTab}
                  onTabChange={setGroupSubTab}
                />

                {/* 2. TAB: DISCUSSION (Focused, Clean Single Feed Stream) */}
                {groupSubTab === 'discussion' && (
                  <div className="d-flex flex-column min-w-0 w-100" style={{ maxWidth: '740px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    {/* Post Composer */}
                    <GroupPostComposer community={selectedCommunity} />

                    {/* Posts Feed */}
                    <div className="d-flex flex-column min-w-0 w-100" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                      {groupPosts.length > 0 ? (
                        <>
                          {groupPostsPagination.paginatedItems.map(post => (
                            <GroupPostCard
                              key={post.id}
                              post={post}
                              community={selectedCommunity}
                            />
                          ))}

                          {groupPostsPagination.totalPages > 1 && (
                            <Pagination
                              currentPage={groupPostsPagination.currentPage}
                              totalPages={groupPostsPagination.totalPages}
                              totalItems={groupPostsPagination.totalItems}
                              startIndex={groupPostsPagination.startIndex}
                              endIndex={groupPostsPagination.endIndex}
                              onPageChange={groupPostsPagination.setPage}
                              pageSize={groupPostsPagination.pageSize}
                              onPageSizeChange={groupPostsPagination.setPageSize}
                              pageSizeOptions={[3, 5, 10, 20]}
                              itemName="posts"
                            />
                          )}
                        </>
                      ) : (
                        <div className="card p-5 text-center text-muted">
                          <MessageSquare size={36} className="mx-auto mb-2 opacity-50" />
                          <h4 className="font-bold text-sm text-primary mb-1">No Posts Yet</h4>
                          <p className="text-xs">Be the first neighbor to publish an update or coordination poll in this group!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. TAB: ABOUT & RULES */}
                {groupSubTab === 'about' && (
                  <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
                    <GroupAboutTab community={selectedCommunity} />
                  </div>
                )}

                {/* 4. TAB: HELP REQUESTS & MUTUAL AID */}
                {groupSubTab === 'requests' && (
                  <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
                    <GroupRequestsTab community={selectedCommunity} />
                  </div>
                )}

                {/* 5. TAB: MEDIA & FILES */}
                {groupSubTab === 'media' && (
                  <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
                    <GroupMediaTab community={selectedCommunity} />
                  </div>
                )}

                {/* 6. TAB: MEMBERS & ROLES */}
                {groupSubTab === 'members' && (
                  <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
                    <GroupMembersTab community={selectedCommunity} />
                  </div>
                )}

                {/* 7. TAB: COMMUNITY MODERATION (Admins & Elected Moderators) */}
                {groupSubTab === 'moderation' && (
                  <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
                    <GroupModerationTab community={selectedCommunity} />
                  </div>
                )}
              </>
            ) : (
              <div className="card p-5 text-center text-muted">
                Select a community group from the left sidebar to view.
              </div>
            )}
          </main>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: NEIGHBORHOOD COORDINATION FEED                        */}
      {/* ============================================================ */}
      {activeMainTab === 'feed' && (
        <div className="d-flex flex-column gap-4" style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
          {/* Create Post Box */}
          <form onSubmit={handleCreateFeedPost} className="card p-4">
            <h4 className="font-bold text-sm text-primary mb-2">Publish Public Coordination Update</h4>
            <textarea
              placeholder="Share an update, request peer assistance, or provide situational context to the whole neighborhood..."
              value={newFeedPostText}
              onChange={(e) => setNewFeedPostText(e.target.value)}
              rows={3}
              className="form-textarea mb-3"
              required
            />

            {/* Link to CareMesh Entity Selector */}
            <div className="d-flex align-center justify-between gap-2 flex-wrap">
              <div className="d-flex align-center gap-2">
                <Link2 size={15} className="text-muted" />
                <select
                  value={feedLinkedEntity}
                  onChange={(e) => setFeedLinkedEntity(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                >
                  <option value="">Link to Context Object (Optional)</option>
                  <optgroup label="Observations">
                    {observations.map(o => (
                      <option key={o.id} value={o.id}>Obs: {o.title}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Long-term Plans">
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>Plan: {p.title}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Help Requests">
                    {requests.map(r => (
                      <option key={r.id} value={r.id}>Need: {r.title}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                <Send size={14} />
                <span>Post Update</span>
              </button>
            </div>
          </form>

          {/* Posts List */}
          <div className="d-flex flex-column gap-3">
            {feedPostsPagination.paginatedItems.length === 0 ? (
              <EmptyState
                icon={<Share2 size={36} className="text-muted" />}
                title="No Neighborhood Feed Updates Yet"
                description="Be the first neighbor to post a public announcement, situational update, or mutual aid request to the feed."
              />
            ) : (
              feedPostsPagination.paginatedItems.map(post => (
              <div key={post.id} className="card p-4">
                {/* Author Header */}
                <div className="d-flex align-center justify-between mb-3">
                  <div 
                    className="d-flex align-center gap-2 user-profile-trigger"
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
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h5 className="font-bold text-sm text-primary user-profile-name mb-0">{post.author?.name}</h5>
                      <span className="text-xs text-muted">{post.author?.handle || '@neighbor'} • {post.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.5', fontSize: '0.875rem' }}>
                  {post.content}
                </p>

                {/* Attached Entity Card */}
                {post.linkedEntityType && (
                  <div 
                    className="card p-2 p-sm-3 mb-3 card-interactive cursor-pointer"
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                    onClick={() => {
                      if (post.linkedEntityType === 'plan') {
                        const p = plans.find(plan => plan.id === post.linkedEntityId);
                        if (p) viewPlanDetail(p);
                      } else {
                        navigateTo(post.linkedEntityType === 'request' ? 'collaborate' : 'explore');
                      }
                    }}
                  >
                    <div className="d-flex align-center justify-between gap-2 min-w-0">
                      <div className="d-flex align-center gap-2 min-w-0 flex-1 flex-wrap">
                        <span className="badge badge-primary text-xs text-uppercase font-semibold flex-shrink-0">
                          Linked {post.linkedEntityType}
                        </span>
                        <span className="font-semibold text-xs text-primary text-truncate flex-1 min-w-0" style={{ wordBreak: 'break-word' }}>
                          {post.linkedEntityTitle}
                        </span>
                      </div>
                      <ExternalLink size={13} className="text-brand flex-shrink-0" />
                    </div>
                  </div>
                )}

                {/* Footer Corroborations / Coordination Replies */}
                <div className="d-flex align-center justify-between pt-2 border-top text-xs text-muted">
                  <span className="d-flex align-center gap-1">
                    <ShieldCheck size={14} className="text-brand" /> {post.endorsedCount || 0} Peer Corroborations
                  </span>
                  <span>{post.comments?.length || 0} Coordination Replies</span>
                </div>
              </div>
            )))}

            {/* Global Feed Pagination */}
            {feedPostsPagination.totalPages > 1 && (
              <Pagination
                currentPage={feedPostsPagination.currentPage}
                totalPages={feedPostsPagination.totalPages}
                totalItems={feedPostsPagination.totalItems}
                startIndex={feedPostsPagination.startIndex}
                endIndex={feedPostsPagination.endIndex}
                onPageChange={feedPostsPagination.setPage}
                pageSize={feedPostsPagination.pageSize}
                onPageSizeChange={feedPostsPagination.setPageSize}
                pageSizeOptions={[4, 6, 12, 24]}
                itemName="feed posts"
              />
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: DIRECT COORDINATION MESSAGES                          */}
      {/* ============================================================ */}
      {activeMainTab === 'messages' && (
        <div className="card p-0 messages-grid" style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
          {/* Conversation List Column (Hidden on mobile if actively viewing a chat) */}
          <div 
            className={`d-flex flex-column ${isMobileChatViewing ? 'd-none d-md-flex' : 'd-flex'}`}
            style={{ borderRight: '1px solid var(--border-light)', overflowY: 'auto', background: 'var(--bg-subtle)' }}
          >
            <div className="p-3 border-bottom font-bold text-xs text-muted text-uppercase">
              Direct Peer Channels
            </div>
            {conversations.map(conv => {
              const isSelected = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  className="p-3 cursor-pointer d-flex align-center gap-2"
                  style={{
                    background: isSelected ? '#ffffff' : 'transparent',
                    borderLeft: isSelected ? '4px solid var(--primary-600)' : '4px solid transparent',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setIsMobileChatViewing(true);
                  }}
                >
                  <img
                    src={conv.participant?.avatar}
                    alt=""
                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="d-flex align-center justify-between">
                      <span className="font-bold text-xs text-primary text-truncate">{conv.title}</span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>{conv.lastTime}</span>
                    </div>
                    <p className="text-xs text-secondary text-truncate" style={{ margin: 0 }}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversation Messages Surface (Hidden on mobile if in conversation list) */}
          <div 
            className={`d-flex flex-column ${!isMobileChatViewing ? 'd-none d-md-flex' : 'd-flex'}`}
            style={{ background: '#ffffff', minWidth: 0 }}
          >
            {activeConversation ? (
              <>
                {/* Header */}
                <div className="p-3 border-bottom d-flex align-center justify-between">
                  <div className="d-flex align-center gap-2 min-w-0">
                    {/* Mobile Back to Channels Button */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm d-flex d-md-none p-1"
                      onClick={() => setIsMobileChatViewing(false)}
                      title="Back to Channels"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <div 
                      className="d-flex align-center gap-2 min-w-0 user-profile-trigger"
                      onClick={() => activeConversation.participant && viewUserProfile && viewUserProfile(activeConversation.participant)}
                      title={`View ${activeConversation.title}'s profile & contributions`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          activeConversation.participant && viewUserProfile && viewUserProfile(activeConversation.participant);
                        }
                      }}
                    >
                      <img
                        src={activeConversation.participant?.avatar}
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-primary text-truncate user-profile-name">{activeConversation.title}</h4>
                        <span className="text-xs text-muted text-truncate d-block">{activeConversation.subtitle}</span>
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-primary text-xs flex-shrink-0">Direct Channel</span>
                </div>

                {/* Messages Body */}
                <div className="p-3 p-md-4 d-flex flex-column gap-3 flex-1" style={{ overflowY: 'auto' }}>
                  {activeConversation.messages.map((m) => {
                    const isMe = m.senderId === currentUser?.id;
                    return (
                      <div
                        key={m.id}
                        className={`d-flex flex-column p-2 rounded text-xs ${isMe ? 'align-end' : 'align-start'}`}
                        style={{
                          background: isMe ? 'var(--primary-50)' : 'var(--bg-muted)',
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <p className="text-secondary" style={{ margin: 0, lineHeight: '1.45' }}>{m.text}</p>
                        <span className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>{m.timestamp}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendDirectMessage} className="p-3 border-top d-flex gap-2">
                  <input
                    type="text"
                    placeholder="Type coordination message..."
                    value={directMessageText}
                    onChange={(e) => setDirectMessageText(e.target.value)}
                    className="form-input"
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Send size={15} />
                  </button>
                </form>
              </>
            ) : (
              <div className="p-5 text-center text-muted">Select a conversation to begin.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
