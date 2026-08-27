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
  return `${minutes} min`;
}

function getExcerpt(post) {
  if (post.excerpt) return post.excerpt;
  if (post.summary) return post.summary;
  if (post.content) {
    const cleanContent = String(post.content).replace(/<[^>]+>/g, ' ').trim();
    return cleanContent.length > 140 ? `${cleanContent.slice(0, 140)}...` : cleanContent;
  }
  return 'Read this article to explore more details.';
}

function getPostImage(post) {
  return (
    post.thumbnail ||
    post.thumbnail_url ||
    post.cover_image ||
    post.featured_image ||
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
  );
}

function getAuthorName(post) {
  return (
    post.author_name ||
    post.author?.name ||
    post.user?.name ||
    'Unknown Author'
  );
}

function getCategoryName(post) {
  if (post.category_name) return post.category_name;
  if (Array.isArray(post.categories) && post.categories.length > 0) {
    return post.categories[0].name || post.categories[0];
  }
  return 'General';
}

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchHomepageData() {
      try {
        setLoading(true);
        setError('');

        const [postsData, categoriesData, tagsData] = await Promise.all([
          postService.getPublishedPosts(),
          postService.getCategories(),
          postService.getTags(),
        ]);

        const postItems = Array.isArray(postsData)
          ? postsData
          : Array.isArray(postsData?.posts)
          ? postsData.posts
          : [];

        const categoryItems = Array.isArray(categoriesData)
          ? categoriesData
          : Array.isArray(categoriesData?.categories)
          ? categoriesData.categories
          : [];

        const tagItems = Array.isArray(tagsData)
          ? tagsData
          : Array.isArray(tagsData?.tags)
          ? tagsData.tags
          : [];

        if (!cancelled) {
          setPosts(postItems);
          setCategories(categoryItems);
          setTags(tagItems);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load homepage data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHomepageData();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredPost = posts[0] || null;
  const regularPosts = useMemo(() => posts.slice(1, 7), [posts]);

  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 4)
      .map((item) => ({
        title: item.title,
        count: item.view_count || 0,
        slug: item.slug,
      }));
  }, [posts]);

  const openPost = (slug) => {
    if (!slug) return;
    window.location.hash = `#post/${slug}`;
  };

  return (
    <>
      {loading && (
        <div className="card" style={{ marginBottom: 24 }}>
          Loading homepage data...
        </div>
      )}

      {error && (
        <div className="card" style={{ marginBottom: 24, color: 'crimson' }} role="alert">
          {error}
        </div>
      )}

      {!loading && !error && featuredPost && (
        <div className="hero-spotlight">
          <div
            className="hero-card"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.55)), url(${getPostImage(featuredPost)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="hero-overlay">
              <span className="badge">{getCategoryName(featuredPost)}</span>
              <h2>{featuredPost.title}</h2>
              <div className="hero-meta">
                <span className="author-block">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
                    alt="Author avatar"
                  />
                  {getAuthorName(featuredPost)}
                </span>
                <span>{formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                <span>{estimateReadTime(featuredPost.content || featuredPost.excerpt)} read</span>
              </div>
              <div style={{ marginTop: 22 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => openPost(featuredPost.slug)}
                >
                  Read More
                </button>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-section">
              <SectionTitle title="Trending This Week" />
              {trendingPosts.length > 0 ? (
                trendingPosts.map((item) => (
                  <div
                    key={item.slug || item.title}
                    className="trending-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => openPost(item.slug)}
                  >
                    <strong>{item.title}</strong>
                    <span className="badge secondary">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="small-text">No trending posts found</div>
              )}
            </div>

            <div className="sidebar-section">
              <SectionTitle title="Categories" />
              {categories.length > 0 ? (
                categories.map((item) => (
                  <div key={item.id || item.slug || item.name} className="category-item">
                    <span>{item.name}</span>
                    <span className="small-text">{item.count ?? ''}</span>
                  </div>
                ))
              ) : (
                <div className="small-text">No categories found</div>
              )}
            </div>

            <div className="sidebar-section">
              <SectionTitle title="Tags" />
              <div className="tags-cloud">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span key={tag.id || tag.slug || tag.name} className="tag-chip">
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <div className="small-text">No tags found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="post-grid">
        {regularPosts.map((post) => (
          <article
            key={post.id || post.slug || post.title}
            className="post-card card"
            style={{ cursor: 'pointer' }}
            onClick={() => openPost(post.slug)}
          >
            <img src={getPostImage(post)} alt={post.title} />
            <div className="post-body">
              <span className="badge">{getCategoryName(post)}</span>
              <h3>{post.title}</h3>
              <p>{getExcerpt(post)}</p>
              <div className="post-card-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="author-pill">{getAuthorName(post)}</span>
                  <span className="small-text">
                    {formatDate(post.published_at || post.created_at)}
                  </span>
                </div>
                <div className="meta-group">
                  <span>{estimateReadTime(post.content || post.excerpt)}</span>
                  <span>👁️ {post.view_count || 0}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!loading && !error && posts.length === 0 && (
        <div className="card">No published posts found.</div>
      )}
    </>
  );
}