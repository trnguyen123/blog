import { useEffect, useState } from 'react';
import { postManageService } from '../../services/postManageService';

const emptyForm = {
  title: '',
  content: '',
  excerpt: '',
  thumbnail_url: '',
  visibility: 'public',
};

export default function EditorPage({ editingPost, onNavigate, onShowToast }) {
  const isEditMode = Boolean(editingPost);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingPost) {
      setForm({
        title: editingPost.title || '',
        content: editingPost.content || '',
        excerpt: editingPost.excerpt || '',
        thumbnail_url: editingPost.thumbnail_url || '',
        visibility: editingPost.visibility || 'public',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingPost]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(status) {
    if (!form.title.trim()) {
      setError('Vui lòng nhập tiêu đề bài viết.');
      return;
    }
    if (!form.content.trim()) {
      setError('Vui lòng nhập nội dung bài viết.');
      return;
    }

    const payload = { ...form, status };

    try {
      setSaving(true);
      setError(null);

      if (isEditMode) {
        await postManageService.updatePost(editingPost.id, payload);
        onShowToast?.('Đã cập nhật bài viết');
      } else {
        await postManageService.createPost(payload);
        onShowToast?.(status === 'published' ? 'Đã đăng bài viết' : 'Đã lưu bản nháp');
      }

      onNavigate('myposts');
    } catch (err) {
      setError(err.message || 'Lưu bài viết thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <div className="top-header card">
        <div>
          <h1>{isEditMode ? 'Edit post' : 'Create post'}</h1>
          <p className="text-muted">Write with a distraction-free editor and publish on your schedule.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('myposts')}>Back</button>
          <button className="btn btn-secondary" disabled={saving} onClick={() => handleSubmit('draft')}>
            {saving ? 'Đang lưu...' : 'Save Draft'}
          </button>
          <button className="btn btn-primary" disabled={saving} onClick={() => handleSubmit('published')}>
            {saving ? 'Đang lưu...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <div className="card text-muted">{error}</div>}

      <div className="page-layout">
        <div className="card editor-card">
          <input
            className="input-field editor-title"
            placeholder="Write your post title here"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
          />
          <textarea
            className="input-field editor-body"
            style={{ minHeight: 280, width: '100%', background: 'transparent', color: 'inherit', border: 'none', resize: 'vertical' }}
            placeholder="Write your content here..."
            value={form.content}
            onChange={(e) => updateField('content', e.target.value)}
          />
        </div>

        <aside className="sidebar-card">
          <div className="section-title">
            <h2>Post details</h2>
          </div>
          <div className="card sidebar-detail-card">
            <label className="small-text">Excerpt</label>
            <input
              className="input-field"
              placeholder="Mô tả ngắn cho bài viết"
              value={form.excerpt}
              onChange={(e) => updateField('excerpt', e.target.value)}
            />

            <label className="small-text">Thumbnail URL</label>
            <input
              className="input-field"
              placeholder="https://..."
              value={form.thumbnail_url}
              onChange={(e) => updateField('thumbnail_url', e.target.value)}
            />
            {form.thumbnail_url && (
              <div className="thumbnail-preview">
                <img src={form.thumbnail_url} alt="Thumbnail preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
              </div>
            )}

            <label className="small-text">Visibility</label>
            <select
              className="input-field"
              value={form.visibility}
              onChange={(e) => updateField('visibility', e.target.value)}
            >
              <option value="public">Public</option>
              <option value="premium">Premium (Members only)</option>
            </select>
          </div>
        </aside>
      </div>
    </div>
  );
}