import { useEffect, useState, useCallback } from 'react';
import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { authorNav, adminNav } from '../../data/pageData';
import { categoryService } from '../../services/categoryService';


const emptyForm = { id: null, name: '', slug: '', description: '' };


export default function CategoryManagementPage({ auth, onLogout, onNavigate }) {
  const [categories, setCategories] = useState([]);
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


  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách category');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);


  function openCreateForm() {
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }


  function openEditForm(category) {
    setForm({
      id: category.id,
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
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
      setFormError('Tên category không được để trống');
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
        await categoryService.update(form.id, payload);
      } else {
        await categoryService.create(payload);
      }


      closeForm();
      await fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Lưu category thất bại');
    } finally {
      setSaving(false);
    }
  }


  async function handleDelete(category) {
    const confirmed = window.confirm(`Xoá category "${category.name}"?`);
    if (!confirmed) return;


    try {
      setDeletingId(category.id);
      await categoryService.remove(category.id);
      await fetchCategories();
    } catch (err) {
      alert(err.message || 'Xoá category thất bại');
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
        <SidebarNav items={navItems} activeKey="categories" onSelect={onNavigate} />
      </aside>


      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Categories</h1>
            <p className="text-muted">Quản lý danh mục bài viết trên toàn hệ thống.</p>
          </div>
          <div className="header-actions">
            {userForMenu && <UserMenu user={userForMenu} onLogout={onLogout} />}
          </div>
        </div>


        {error && <div className="card text-muted">Không tải được dữ liệu: {error}</div>}


        <div className="card">
          <SectionTitle
            title="All categories"
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
                + New category
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
                  placeholder="Ví dụ: Technology"
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
                  placeholder="Mô tả ngắn cho category"
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
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted">Chưa có category nào.</td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.slug}</td>
                      <td>{category.description || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditForm(category)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={deletingId === category.id}
                          onClick={() => handleDelete(category)}
                        >
                          {deletingId === category.id ? 'Deleting...' : 'Delete'}
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