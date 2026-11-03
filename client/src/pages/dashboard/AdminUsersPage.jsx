import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ShieldOff, Trash2, UserCheck, Users } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { PageLoading } from '../../components/Skeletons';
import { ROLE_LABELS, formatDate } from '../../utils/format';

const ROLES = Object.entries(ROLE_LABELS);

export default function AdminUsersPage() {
  usePageMeta('Members', 'Manage StayMate member accounts, roles and suspensions.');
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [role, setRole] = useState(searchParams.get('role') || 'all');
  const [active, setActive] = useState(searchParams.get('active') || 'all');
  const [busy, setBusy] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (page > 1) params.set('page', page);
      if (query.trim()) params.set('q', query.trim());
      if (role !== 'all') params.set('role', role);
      if (active !== 'all') params.set('active', active);
      api
        .get(`/admin/users?limit=20&${params.toString()}`)
        .then(({ data }) => {
          setUsers(data.items);
          setPagination(data.pagination);
          setError('');
        })
        .catch((loadError) => setError(loadError.message))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(timer);
  }, [page, query, role, active]);

  const syncParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') params.delete(key);
      else params.set(key, value);
    });
    if (updates.page === undefined) params.delete('page');
    setSearchParams(params);
  };

  const updateUser = async (member, payload, label) => {
    setBusy(member._id);
    try {
      const { data } = await api.patch(`/admin/users/${member._id}`, payload);
      setUsers((current) => current.map((item) => (item._id === member._id ? { ...item, ...data.user, _id: item._id } : item)));
      toast.success(label);
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const memberId = deleting._id || deleting.id;
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/users/${memberId}`);
      setUsers((current) => current.filter((item) => (item._id || item.id) !== memberId));
      toast.success('Member and related records deleted.');
      setDeleting(null);
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Members</h2>
          <p>Search accounts, change roles and suspend members who break the rules.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              syncParams({ q: event.target.value });
            }}
            placeholder="Search name, email or city"
            aria-label="Search members"
          />
        </label>
        <select className="select" value={role} onChange={(event) => { setRole(event.target.value); syncParams({ role: event.target.value }); }} aria-label="Filter by role">
          <option value="all">All roles</option>
          {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="select" value={active} onChange={(event) => { setActive(event.target.value); syncParams({ active: event.target.value }); }} aria-label="Filter by account status">
          <option value="all">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>
        {pagination && <span className="small muted">{pagination.total} member{pagination.total === 1 ? '' : 's'}</span>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <PageLoading />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Try a different search term or clear the filters."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setRole('all');
            setActive('all');
            setSearchParams({});
          }}
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>City</th>
                <th>Joined</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((member) => {
                const isSelf = member._id === currentUser?.id;
                return (
                  <tr key={member._id}>
                    <td>
                      <div className="table-user">
                        <Avatar src={member.avatar} name={member.name} size="sm" />
                        <div>
                          <strong>{member.name}{member.isDemo && <span className="badge badge-demo" style={{ marginLeft: 6 }}>Demo</span>}</strong>
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="select select-sm"
                        value={member.role}
                        onChange={(event) => updateUser(member, { role: event.target.value }, 'Role updated.')}
                        disabled={isSelf || busy === member._id}
                        aria-label={`Role for ${member.name}`}
                      >
                        {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </td>
                    <td>{member.city || '—'}</td>
                    <td>{formatDate(member.createdAt)}</td>
                    <td><span className={`badge ${member.isActive ? 'badge-green' : 'badge-red'}`}>{member.isActive ? 'Active' : 'Suspended'}</span></td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => updateUser(member, { isActive: !member.isActive }, member.isActive ? 'Member suspended.' : 'Member reactivated.')}
                          disabled={isSelf || busy === member._id}
                        >
                          {member.isActive ? <><ShieldOff size={13} /> Suspend</> : <><UserCheck size={13} /> Activate</>}
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => setDeleting(member)}
                          disabled={isSelf || member.role === 'admin'}
                          aria-label={`Delete ${member.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        pagination={pagination}
        onChange={(next) => syncParams({ page: next > 1 ? String(next) : '' })}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => (deleteBusy ? null : setDeleting(null))}
        title="Delete member account?"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy ? 'Deleting…' : 'Delete permanently'}
            </button>
          </>
        )}
      >
        <p className="muted">
          <strong>{deleting?.name || 'This member'}</strong> {deleting?.email ? `(${deleting.email})` : ''} will be deleted along with their listings, enquiries,
          reviews, roommate data and notifications. This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
