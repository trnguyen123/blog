import { useEffect, useState } from 'react';
import PublicLayout from '../../components/PublicLayout';

const API_BASE_URL = 'http://localhost:8000/api';

export default function MyProfilePage({ auth, onLogout }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    bio: '',
    phone: '',
    avatar: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Author request state ---
  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [authorForm, setAuthorForm] = useState({
    bio: '',
    reason: '',
    experience: '',
    sampleWork: '',
  });
  const [authorSubmitting, setAuthorSubmitting] = useState(false);
  const [authorError, setAuthorError] = useState('');
  const [authorRequestStatus, setAuthorRequestStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'

  const savedAuth = JSON.parse(window.localStorage.getItem('inkwell-auth') || '{}');
  const token = auth?.token || savedAuth?.token;

  useEffect(() => {
    let cancelled = false;

    async function fetchProfileData() {
      try {
        setLoading(true);
        setError('');

        if (!token) {
          throw new Error('No access token found. Please log in again.');
        }

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };

        const [meRes, profileRes] = await Promise.all([
          fetch(`${API_BASE_URL}/auth/me`, { method: 'GET', headers }),
          fetch(`${API_BASE_URL}/profile/me`, { method: 'GET', headers }),
        ]);

        const meJson = await meRes.json();
        const profileJson = await profileRes.json();

        if (!meRes.ok || meJson.success === false) {
          throw new Error(meJson.message || 'Failed to load current user');
        }

        if (!profileRes.ok || profileJson.success === false) {
          throw new Error(profileJson.message || 'Failed to load profile');
        }

        const meData = meJson.data || meJson.user || meJson;
        const profileData = profileJson.data || profileJson.profile || profileJson;

        if (!cancelled) {
          setAuthUser(meData);
          setProfile(profileData);
          setForm({
            name: profileData.name || meData.name || '',
            email: profileData.email || meData.email || '',
            bio: profileData.bio || '',
            phone: profileData.phone || '',
            avatar: profileData.avatar_url || profileData.avatar || '',
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfileData();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSave() {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!token) {
        throw new Error('No access token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to update profile');
      }

      const updatedProfile = result.data || result.profile || result;

      setProfile(updatedProfile);
      setForm({
        name: updatedProfile.name || '',
        email: updatedProfile.email || '',
        bio: updatedProfile.bio || '',
        phone: updatedProfile.phone || '',
        avatar: updatedProfile.avatar_url || updatedProfile.avatar || '',
      });
      setIsEditing(false);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setForm({
      name: profile?.name || authUser?.name || '',
      email: profile?.email || authUser?.email || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
      avatar: profile?.avatar_url || profile?.avatar || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchAuthorRequestStatus() {
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/author-requests/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        // No request submitted yet -> backend may respond 404, treat as "no request"
        if (res.status === 404) {
          if (!cancelled) setAuthorRequestStatus(null);
          return;
        }

        const json = await res.json();

        if (!res.ok || json.success === false) {
          // Don't surface this as a blocking error, the profile page still works
          if (!cancelled) setAuthorRequestStatus(null);
          return;
        }

        // API returns an array of the user's own requests (newest first,
        // based on `created_at DESC` in getAuthorRequestsByUserId), e.g.
        // { success: true, data: [{ id, status, created_at, ... }, ...] }
        const list = Array.isArray(json.data) ? json.data : [];
        const latest = list[0] || null;

        if (!cancelled) {
          setAuthorRequestStatus(latest?.status || null);
        }
      } catch (err) {
        if (!cancelled) setAuthorRequestStatus(null);
      }
    }

    fetchAuthorRequestStatus();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleAuthorRequestSubmit(e) {
    e.preventDefault();
    try {
      setAuthorSubmitting(true);
      setAuthorError('');

      if (!token) {
        throw new Error('No access token found. Please log in again.');
      }

      if (!authorForm.bio.trim() || !authorForm.reason.trim()) {
        throw new Error('Please fill in bio and reason.');
      }

      const response = await fetch(`${API_BASE_URL}/author-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bio: authorForm.bio,
          reason: authorForm.reason,
          experience: authorForm.experience || null,
          sampleWork: authorForm.sampleWork || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to submit author request');
      }

      setAuthorRequestStatus('pending');
      setShowAuthorForm(false);
      setSuccess('Author request submitted. Please wait for admin review.');
    } catch (err) {
      setAuthorError(err.message || 'Failed to submit author request');
    } finally {
      setAuthorSubmitting(false);
    }
  }

  const displayName = profile?.name || authUser?.name || '-';
  const displayEmail = profile?.email || authUser?.email || '-';

  // `roles` comes back in different shapes depending on the endpoint:
  // - /auth/me      -> roles: ['user']
  // - /profile/me   -> roles: [{ id, name, description }]
  // Normalize both cases. We trust the API response over the value cached
  // in localStorage at login time, since that one can go stale.
  function extractRoleName(rolesArray) {
    const first = rolesArray?.[0];
    if (!first) return null;
    return typeof first === 'string' ? first : first.name;
  }

  const displayRole =
    extractRoleName(profile?.roles) ||
    extractRoleName(authUser?.roles) ||
    authUser?.role ||
    auth?.role ||
    '-';

  const displayPhone = profile?.phone || '-';
  const displayBio = profile?.bio || '-';
  const displayAvatar = profile?.avatar_url || profile?.avatar || '';

  const initials = displayName
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-container profile-page-shell">
      {loading ? (
        <div className="card">Loading profile...</div>
      ) : (
        <div className="profile-content-wrap">
          <section className="card profile-hero-card">
            <div className="profile-hero-left">
              <div className="profile-hero-avatar">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="profile-hero-copy">
                <span className="profile-eyebrow">My Profile</span>
                <h1>{displayName}</h1>
                <p>{displayEmail}</p>

                <div className="profile-meta-row">
                  <span className="profile-role-chip">{displayRole}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="card profile-overview-card">
            <div className="profile-card-header">
              <div>
                <h2>Account overview</h2>
                <p className="text-muted">
                  Manage your personal details and public account information.
                </p>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  className="icon-edit-btn"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit profile"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 20h4l10-10-4-4L4 16v4Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13.5 6.5l4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <div className="profile-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {error && <div className="profile-alert error">{error}</div>}
            {success && <div className="profile-alert success">{success}</div>}

            <div className="profile-info-grid">
              <div className="profile-info-row">
                <div className="profile-info-label">Name</div>
                <div className="profile-info-value">
                  {isEditing ? (
                    <input
                      className="profile-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  ) : (
                    displayName
                  )}
                </div>
              </div>

              <div className="profile-info-row">
                <div className="profile-info-label">Email</div>
                <div className="profile-info-value">
                  {isEditing ? (
                    <input
                      className="profile-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  ) : (
                    displayEmail
                  )}
                </div>
              </div>

              <div className="profile-info-row">
                <div className="profile-info-label">Role</div>
                <div className="profile-info-value">{displayRole}</div>
              </div>

              <div className="profile-info-row">
                <div className="profile-info-label">Phone</div>
                <div className="profile-info-value">
                  {isEditing ? (
                    <input
                      className="profile-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  ) : (
                    displayPhone
                  )}
                </div>
              </div>

              <div className="profile-info-row">
                <div className="profile-info-label">Avatar URL</div>
                <div className="profile-info-value">
                  {isEditing ? (
                    <input
                      className="profile-input"
                      value={form.avatar}
                      onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                    />
                  ) : (
                    displayAvatar || '-'
                  )}
                </div>
              </div>

              <div className="profile-info-row bio-row">
                <div className="profile-info-label">Bio</div>
                <div className="profile-info-value">
                  {isEditing ? (
                    <textarea
                      className="profile-input profile-textarea"
                      rows="5"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  ) : (
                    displayBio
                  )}
                </div>
              </div>
            </div>
          </section>

          {displayRole === 'user' && (
            <section className="card profile-author-card">
              <div className="profile-card-header">
                <div>
                  <h2>Become an Author</h2>
                  <p className="text-muted">
                    Submit a request to publish content on the platform. A
                    super admin will review it.
                  </p>
                </div>

                {authorRequestStatus === 'pending' ? (
                  <span className="profile-role-chip">Pending review</span>
                ) : authorRequestStatus === 'approved' ? (
                  <span className="profile-role-chip">Approved</span>
                ) : authorRequestStatus === 'rejected' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAuthorForm(true)}
                  >
                    Request again
                  </button>
                ) : !showAuthorForm ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAuthorForm(true)}
                  >
                    Request to become Author
                  </button>
                ) : null}
              </div>

              {authorRequestStatus === 'pending' && (
                <div className="profile-alert success">
                  Your author request has been submitted and is awaiting
                  review.
                </div>
              )}

              {authorRequestStatus === 'approved' && (
                <div className="profile-alert success">
                  Your author request has been approved. Refresh your session
                  to pick up the new role.
                </div>
              )}

              {authorRequestStatus === 'rejected' && (
                <div className="profile-alert error">
                  Your previous author request was rejected. You can submit a
                  new one below.
                </div>
              )}

              {authorError && (
                <div className="profile-alert error">{authorError}</div>
              )}

              {showAuthorForm && authorRequestStatus !== 'pending' && (
                <form
                  className="profile-info-grid"
                  onSubmit={handleAuthorRequestSubmit}
                >
                  <div className="profile-info-row bio-row">
                    <div className="profile-info-label">Bio</div>
                    <div className="profile-info-value">
                      <textarea
                        className="profile-input profile-textarea"
                        rows="3"
                        placeholder="Tell us a bit about yourself"
                        value={authorForm.bio}
                        onChange={(e) =>
                          setAuthorForm({ ...authorForm, bio: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="profile-info-row bio-row">
                    <div className="profile-info-label">Reason</div>
                    <div className="profile-info-value">
                      <textarea
                        className="profile-input profile-textarea"
                        rows="3"
                        placeholder="Why do you want to become an author?"
                        value={authorForm.reason}
                        onChange={(e) =>
                          setAuthorForm({
                            ...authorForm,
                            reason: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="profile-info-row bio-row">
                    <div className="profile-info-label">Experience</div>
                    <div className="profile-info-value">
                      <textarea
                        className="profile-input profile-textarea"
                        rows="3"
                        placeholder="Relevant writing/publishing experience (optional)"
                        value={authorForm.experience}
                        onChange={(e) =>
                          setAuthorForm({
                            ...authorForm,
                            experience: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="profile-info-row">
                    <div className="profile-info-label">Sample work URL</div>
                    <div className="profile-info-value">
                      <input
                        className="profile-input"
                        placeholder="Link to a sample of your work (optional)"
                        value={authorForm.sampleWork}
                        onChange={(e) =>
                          setAuthorForm({
                            ...authorForm,
                            sampleWork: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAuthorForm(false);
                        setAuthorError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={authorSubmitting}
                    >
                      {authorSubmitting ? 'Submitting...' : 'Submit request'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}