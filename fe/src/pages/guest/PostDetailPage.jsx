import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../../components/SectionTitle';
import { postService } from '../../services/postService';

function formatDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function estimateReadTime(content = '') {
  const text = String(content).replace(/<[^>]+>/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function stripHtml(content = '') {
  return String(content).replace(/<[^>]+>/g, ' ');
}

function getPostSlugFromHash() {
  const rawHash = window.location.hash || '';
  if (!rawHash.startsWith('#post/')) return '';
  return decodeURIComponent(rawHash.replace('#post/', '').trim());
}

function getPostImage(post) {
  return (
    post?.thumbnail ||
    post?.thumbnail_url ||
    post?.cover_image ||
    post?.featured_image ||
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80'
  );
}

function getAuthorName(post, auth) {
  return (
    post?.author_name ||
    post?.author?.name ||
    post?.user?.name ||
    (post?.author_id === auth?.user?.id ? auth?.user?.name : null) ||
    'Unknown Author'
  );
}

function getCategoryName(post) {
  if (post?.category_name) return post.category_name;
  if (Array.isArray(post?.categories) && post.categories.length > 0) {
    return post.categories[0].name || post.categories[0];
  }
  return 'General';
}

export default function PostDetailPage({ auth, onLogout }) {
  const [slug, setSlug] = useState(getPostSlugFromHash());
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentNotice, setCommentNotice] = useState('');

  const [repliesByComment, setRepliesByComment] = useState({}); 
  const [expandedComments, setExpandedComments] = useState({}); 
  const [loadingReplies, setLoadingReplies] = useState({}); 

  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [likeError, setLikeError] = useState('');

  useEffect(() => {
    const onHashChange = () => {
      setSlug(getPostSlugFromHash());
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchPost() {
      if (!slug) {
        setError('Post slug not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await postService.getPostDetailBySlug(slug);
        const postData = data?.post || data;

        if (!cancelled) {
          setPost(postData || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load post detail');
          setPost(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPost();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function fetchComments() {
      if (!post?.id) return;

      try {
        setCommentsLoading(true);
        const data = await postService.getPostComments(post.id);
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.comments)
          ? data.comments
          : [];

        if (!cancelled) {
          setComments(items);
        }
      } catch (err) {
        if (!cancelled) {
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      }
    }

    fetchComments();

    setRepliesByComment({});
    setExpandedComments({});
    setLoadingReplies({});

    return () => {
      cancelled = true;
    };
  }, [post?.id]);

  const plainContent = useMemo(
    () => stripHtml(post?.content || post?.excerpt || ''),
    [post]
  );

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!auth?.user) {
      setCommentError('Please login to comment.');
      return;
    }

    if (!commentContent.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentError('');
      setCommentNotice('');

      const payload = {
        post_id: post.id,
        content: commentContent.trim(),
      };

      const result = await postService.createComment(payload);
      const created = result?.comment || result?.data || result;

      if (created && created.status === 'approved') {
        setComments((prev) => [created, ...prev]);
      } else if (created && created.status === 'pending') {
        setCommentNotice('Comment của bạn đang chờ duyệt (pending) và sẽ hiển thị sau khi được phê duyệt.');
      } else if (created && created.status === 'rejected') {
        setCommentNotice('Comment của bạn đã bị từ chối vì vi phạm quy định cộng đồng.');
      } else {
        const refreshed = await postService.getPostComments(post.id);
        const items = Array.isArray(refreshed)
          ? refreshed
          : Array.isArray(refreshed?.comments)
          ? refreshed.comments
          : [];
        setComments(items);
      }

      setCommentContent('');
    } catch (err) {
      setCommentError(err.message || 'Failed to post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleToggleReplies = async (commentId) => {
    const isExpanded = expandedComments[commentId];

    if (isExpanded) {
      setExpandedComments((prev) => ({ ...prev, [commentId]: false }));
      return;
    }

    if (repliesByComment[commentId]) {
      setExpandedComments((prev) => ({ ...prev, [commentId]: true }));
      return;
    }

    try {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
      const data = await postService.getCommentReplies(commentId);
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.replies)
        ? data.replies
        : [];

      setRepliesByComment((prev) => ({ ...prev, [commentId]: items }));
      setExpandedComments((prev) => ({ ...prev, [commentId]: true }));
    } catch (err) {
      setRepliesByComment((prev) => ({ ...prev, [commentId]: [] }));
      setExpandedComments((prev) => ({ ...prev, [commentId]: true }));
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {

      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleToggleLike = async () => {
    if (!auth?.user) {
      setLikeError('Please login to like this post.');
      return;
    }

    if (!post?.id || likeSubmitting) return;

    try {
      setLikeSubmitting(true);
      setLikeError('');

      const result = await postService.toggleLike(post.id);

      setPost((prev) =>
        prev
          ? { ...prev, is_liked: result.isLiked, like_count: result.likeCount }
          : prev
      );
    } catch (err) {
      setLikeError(err.message || 'Failed to like post.');
    } finally {
      setLikeSubmitting(false);
    }
  };

  return (
    <>
      {loading && <div className="card">Loading post...</div>}
      {error && !loading && <div className="card" style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && post && (
        <>
          <div
            className="hero-detail"
          >
            <div className="detail-overlay">
              <div className="category-line">
                <span className="badge">{getCategoryName(post)}</span>
                <span className="badge secondary">{post.visibility || 'Public'}</span>
              </div>

              <h1>{post.title}</h1>

              <div className="article-meta">
                <span className="author-block">
                  <img
                    className="avatar-sm"
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
                    alt="Author"
                  />
                  <span>
                    <strong>{getAuthorName(post, auth)}</strong>
                    <div className="small-text">Author</div>
                  </span>
                </span>

                <span>{formatDate(post.published_at || post.created_at)}</span>
                <span>{post.view_count || 0} views</span>
                <span>{estimateReadTime(post.content || post.excerpt)}</span>
              </div>

              <div style={{ marginTop: 20 }}>
                <button className="btn btn-primary btn-sm">Follow</button>
              </div>
            </div>
          </div>

          <div className="page-layout-full">
            <div className="card article-body">
              {post.excerpt && <p>{post.excerpt}</p>}
              <p>{plainContent || 'No content available.'}</p>
            </div>

            <div className="card">
              <SectionTitle title="Enjoyed the article? Tap to interact" />
              <div className="article-actions">
                <button
                  type="button"
                  className={`btn btn-primary${post.is_liked ? ' active' : ''}`}
                  onClick={handleToggleLike}
                  disabled={likeSubmitting}
                >
                  {post.is_liked ? 'Liked' : 'Like'}
                  {typeof post.like_count === 'number' ? ` (${post.like_count})` : ''}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleShare}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 6, verticalAlign: '-3px' }}
                  >
                    {shareCopied ? (
                      <path d="M20 6L9 17l-5-5" />
                    ) : (
                      <>
                        <rect x="9" y="9" width="11" height="11" rx="2" />
                        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                      </>
                    )}
                  </svg>
                  {shareCopied ? 'Link copied!' : 'Copy link'}
                </button>
              </div>

              {likeError && (
                <div className="profile-alert error" style={{ marginTop: 12, marginBottom: 0 }}>
                  {likeError}
                </div>
              )}
            </div>

            <div className="card">
              <SectionTitle
                title="Comments"
                subtitle={
                  commentsLoading
                    ? 'Loading comments...'
                    : `${comments.length} ${comments.length <= 1 ? 'comment' : 'comments'}`
                }
              />

              {auth?.user ? (
                <form className="comment-compose" onSubmit={handleSubmitComment}>
                  <div className="comment-compose-bar">
                    <img
                      className="avatar-sm"
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                      alt="Your avatar"
                    />
                    <textarea
                      className="comment-input"
                      rows={1}
                      placeholder="Write an answer..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      disabled={!auth?.user}
                    />
                    <button
                      type="submit"
                      className="comment-send-btn"
                      disabled={!auth?.user || commentSubmitting || !commentContent.trim()}
                      aria-label="Send comment"
                      title="Send comment"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" />
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                  </div>

                  {commentNotice && (
                    <div className="profile-alert" style={{ marginBottom: 0 }}>
                      {commentNotice}
                    </div>
                  )}

                  {commentError && (
                    <div className="profile-alert error" style={{ marginBottom: 0 }}>
                      {commentError}
                    </div>
                  )}
                </form>
              ) : (
                <div className="comment-empty" style={{ margin: '18px 0 22px' }}>
                  <p>Please login to write a comment.</p>
                </div>
              )}

              <div className="comment-group">
                {!commentsLoading && comments.length === 0 && (
                  <div className="comment-empty">
                    <p>No comments yet.</p>
                  </div>
                )}

                {comments.map((comment) => {
                  const replies = repliesByComment[comment.id] || [];
                  const isExpanded = !!expandedComments[comment.id];
                  const isLoadingReplies = !!loadingReplies[comment.id];

                  return (
                    <div key={comment.id}>
                      <div className="comment-row">
                        <img
                          className="avatar-sm"
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                          alt="User"
                        />
                        <div className="comment-main">
                          <div className="comment-bubble">
                            <strong>
                              {comment.username || comment.user_name || comment.author_name || 'User'}
                            </strong>
                            <p>{comment.content}</p>
                          </div>
                          <div className="comment-meta">
                            <button type="button">Like</button>
                            <button type="button">Reply</button>
                            <span className="comment-time">{formatDate(comment.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {comment.reply_count > 0 && (
                        <button
                          type="button"
                          className={`view-replies-btn${isExpanded ? ' expanded' : ''}`}
                          onClick={() => handleToggleReplies(comment.id)}
                          disabled={isLoadingReplies}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                          {isLoadingReplies
                            ? 'Loading replies...'
                            : isExpanded
                            ? 'Hide replies'
                            : `View ${comment.reply_count} ${comment.reply_count === 1 ? 'reply' : 'replies'}`}
                        </button>
                      )}

                      {isExpanded && (
                        <div className="reply-group">
                          {replies.map((reply) => (
                            <div key={reply.id} className="comment-row">
                              <img
                                className="avatar-sm"
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                                alt="User"
                              />
                              <div className="comment-main">
                                <div className="comment-bubble">
                                  <strong>
                                    {reply.username || reply.user_name || reply.author_name || 'User'}
                                  </strong>
                                  <p>{reply.content}</p>
                                </div>
                                <div className="comment-meta">
                                  <button type="button">Like</button>
                                  <button type="button">Reply</button>
                                  <span className="comment-time">{formatDate(reply.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}