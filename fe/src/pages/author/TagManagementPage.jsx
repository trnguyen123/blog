import { useEffect, useState, useCallback } from 'react';
import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { authorNav, adminNav } from '../../data/pageData';
import { tagService } from '../../services/tagService';


const emptyForm = { id: null, name: '', slug: '', description: '' };


export default function TagManagementPage({ auth, onLogout, onNavigate }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);


  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Author',
    email: auth.email || '',
    avatarUrl: null,
  } : null;


  const isAdmin = auth?.role === 'admin';
  const navItems = isAdmin ? adminNav : authorNav;
  const consoleLabel = isAdmin ? 'Admin console' : 'Author console';


  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tagService.getAll();
      setTags(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách tag');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchTags();
  }, [fetchTags]);


  function openCreateForm() {
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }


  function openEditForm(tag) {
    setForm({
      id: tag.id,
      name: tag.name || '',
      slug: tag.slug || '',
      description: tag.description || '',
    });
    setFormError(null);
    setShowForm(true);
  }


  function closeForm() {
    setShowForm(false);
    setForm(emptyForm);
    setFormError(null);
  }


  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }


  async function handleSubmit(e) {
    e.preventDefault();


    if (!form.name.trim()) {
      setFormError('Tên tag không được để trống');
      return;
    }


    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
    };


    try {
      setSaving(true);
      setFormError(null);


      if (form.id) {
        await tagService.update(form.id, payload);
      } else {
        await tagService.create(payload);
      }


      closeForm();
      await fetchTags();
    } catch (err) {
      setFormError(err.message || 'Lưu tag thất bại');
    } finally {
      setSaving(false);
    }
  }


  async function handleDelete(tag) {
    const confirmed = window.confirm(`Xoá tag "${tag.name}"?`);
    if (!confirmed) return;


    try {
      setDeletingId(tag.id);
      await tagService.remove(tag.id);
      await fetchTags();
    } catch (err) {
      alert(err.message || 'Xoá tag thất bại');
    } finally {
      setDeletingId(null);
    }
  }


  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a href="#home" className="sidebar-logo">
          <div className="brand-logo">IW</div>
          <div>
            <strong>Inkwell</strong>
            <div className="small-text">{consoleLabel}</div>
          </div>
        </a>
        <SidebarNav items={navItems} activeKey="tags" onSelect={onNavigate} />
      </aside>


      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Tags</h1>
            <p className="text-muted">Quản lý các tag gắn cho bài viết.</p>
          </div>
          <div className="header-actions">
            {userForMenu && <UserMenu user={userForMenu} onLogout={onLogout} />}
          </div>
        </div>


        {error && <div className="card text-muted">Không tải được dữ liệu: {error}</div>}


        <div className="card">
          <SectionTitle
            title="All tags"
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
                + New tag
              </button>
            }
          />


          {showForm && (
            <form className="category-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ví dụ: React"
                />
              </div>


              <div className="form-row">
                <label>Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="Để trống sẽ tự tạo từ name"
                />
              </div>


              <div className="form-row">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Mô tả ngắn cho tag"
                  rows={3}
                />
              </div>


              {formError && <p className="text-muted form-error">{formError}</p>}


              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Đang lưu...' : form.id ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}


          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-muted">Đang tải...</td>
                  </tr>
                ) : tags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted">Chưa có tag nào.</td>
                  </tr>
                ) : (
                  tags.map((tag) => (
                    <tr key={tag.id}>
                      <td>{tag.name}</td>
                      <td>{tag.slug}</td>
                      <td>{tag.description || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditForm(tag)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={deletingId === tag.id}
                          onClick={() => handleDelete(tag)}
                        >
                          {deletingId === tag.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}