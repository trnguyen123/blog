import { useEffect, useState, useCallback } from 'react';
import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { adminNav } from '../../data/pageData';
import { subscriptionPlanService } from '../../services/subscriptionPlanService';


const emptyForm = {
  id: null,
  name: '',
  price: '',
  duration_days: '',
  features: '',
};


export default function SubscriptionPlanManagementPage({ auth, onLogout, onNavigate }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Admin',
    email: auth.email || '',
    avatarUrl: null,
  } : null;

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subscriptionPlanService.getAll();
      setPlans(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách subscription plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  function openCreateForm() {
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(plan) {
    setForm({
      id: plan.id,
      name: plan.name || '',
      price: plan.price ?? '',
      duration_days: plan.duration_days ?? '',
      features: Array.isArray(plan.features)
        ? JSON.stringify(plan.features, null, 2)
        : (plan.features || ''),
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

  function parseFeatures(input) {
    if (!input) return null;
    const trimmed = String(input).trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new Error('Features phải là JSON hợp lệ');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setFormError('Name không được để trống');
      return;
    }
    if (!form.price && form.price !== 0) {
      setFormError('Price không được để trống');
      return;
    }
    if (!form.duration_days && form.duration_days !== 0) {
      setFormError('Duration days không được để trống');
      return;
    }

    let features = null;
    try {
      features = parseFeatures(form.features);
    } catch (err) {
      setFormError(err.message || 'Features không hợp lệ');
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      duration_days: Number(form.duration_days),
      features,
    };

    try {
      setSaving(true);
      setFormError(null);

      if (form.id) {
        await subscriptionPlanService.update(form.id, payload);
      } else {
        await subscriptionPlanService.create(payload);
      }

      closeForm();
      await fetchPlans();
    } catch (err) {
      setFormError(err.message || 'Lưu subscription plan thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plan) {
    const confirmed = window.confirm(`Xoá subscription plan "${plan.name}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(plan.id);
      await subscriptionPlanService.remove(plan.id);
      await fetchPlans();
    } catch (err) {
      alert(err.message || 'Xoá subscription plan thất bại');
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
            <div className="small-text">Admin console</div>
          </div>
        </a>
        <SidebarNav items={adminNav} activeKey="subscription-plans" onSelect={onNavigate} />
      </aside>

      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Subscription Plans</h1>
            <p className="text-muted">Quản lý các gói subscription trên hệ thống.</p>
          </div>
          <div className="header-actions">
            {userForMenu && <UserMenu user={userForMenu} onLogout={onLogout} />}
          </div>
        </div>

        {error && <div className="card text-muted">Không tải được dữ liệu: {error}</div>}

        <div className="card">
          <SectionTitle
            title="All plans"
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
                + New plan
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
                  placeholder="Ví dụ: Pro Monthly"
                />
              </div>

              <div className="form-row">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="Ví dụ: 99000"
                />
              </div>

              <div className="form-row">
                <label>Duration days</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.duration_days}
                  onChange={(e) => handleChange('duration_days', e.target.value)}
                  placeholder="Ví dụ: 30"
                />
              </div>

              <div className="form-row">
                <label>Features (JSON)</label>
                <textarea
                  value={form.features}
                  onChange={(e) => handleChange('features', e.target.value)}
                  placeholder='Ví dụ: ["Unlimited posts","Priority support"]'
                  rows={4}
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
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Features</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-muted">Đang tải...</td>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted">Chưa có plan nào.</td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id}>
                      <td>{plan.name}</td>
                      <td>{Number(plan.price).toLocaleString('vi-VN')}</td>
                      <td>{plan.duration_days} ngày</td>
                      <td>
                        {Array.isArray(plan.features) && plan.features.length > 0
                          ? plan.features.join(', ')
                          : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditForm(plan)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={deletingId === plan.id}
                          onClick={() => handleDelete(plan)}
                        >
                          {deletingId === plan.id ? 'Deleting...' : 'Delete'}
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