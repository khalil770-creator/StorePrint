import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { colors, shadow } from '../../theme';
import Badge from '../../components/Badge';
import PageHeader from '../../components/PageHeader';

const FORMAT_OPTIONS = ['flagship', 'standard', 'pop-up', 'franchise'];
const STATUS_OPTIONS = ['active', 'inactive', 'renovating'];

const fetchStore = async (id) => {
  const res = await client.get(`/stores/${id}`);
  return res.data?.data ?? res.data;
};

const updateStore = async ({ id, payload }) => {
  const res = await client.put(`/stores/${id}`, payload);
  return res.data;
};

const updateStatus = async ({ id, status }) => {
  const res = await client.put(`/stores/${id}/status`, { status });
  return res.data;
};

const deleteStore = async (id) => {
  const res = await client.delete(`/stores/${id}`);
  return res.data;
};

const styles = {
  page: {
    padding: '24px',
    minHeight: '100vh',
    backgroundColor: colors.background ?? '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: shadow?.card ?? '0 1px 4px rgba(0,0,0,0.1)',
    border: `1px solid ${colors.border ?? '#e8e8e8'}`,
    marginBottom: '20px',
  },
  dangerSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: shadow?.card ?? '0 1px 4px rgba(0,0,0,0.1)',
    border: `1px solid ${colors.danger ?? '#e53e3e'}`,
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: colors.text ?? '#1a1a1a',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${colors.border ?? '#f0f0f0'}`,
  },
  dangerTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: colors.danger ?? '#e53e3e',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${colors.danger ?? '#e53e3e'}33`,
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textSecondary ?? '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    padding: '9px 12px',
    fontSize: '14px',
    border: `1px solid ${colors.border ?? '#e0e0e0'}`,
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#fff',
    color: colors.text ?? '#1a1a1a',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    padding: '9px 12px',
    fontSize: '14px',
    border: `1px solid ${colors.border ?? '#e0e0e0'}`,
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#fff',
    color: colors.text ?? '#1a1a1a',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  saveBtn: {
    marginTop: '20px',
    padding: '10px 22px',
    backgroundColor: colors.primary ?? '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  statusRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  statusChip: (active, status) => ({
    padding: '8px 18px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: '2px solid',
    transition: 'all 0.15s',
    borderColor: active
      ? statusColor(status)
      : colors.border ?? '#e0e0e0',
    backgroundColor: active ? statusColor(status) : '#fff',
    color: active ? '#fff' : colors.textSecondary ?? '#666',
  }),
  deleteBtn: {
    padding: '10px 22px',
    backgroundColor: colors.danger ?? '#e53e3e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deleteBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  dangerDesc: {
    fontSize: '13px',
    color: colors.textSecondary ?? '#666',
    marginBottom: '16px',
  },
  errorMsg: {
    marginTop: '10px',
    fontSize: '13px',
    color: colors.danger ?? '#e53e3e',
  },
  loadingState: {
    textAlign: 'center',
    padding: '80px 0',
    color: colors.textSecondary ?? '#666',
    fontSize: '15px',
  },
  errorState: {
    textAlign: 'center',
    padding: '80px 0',
    color: colors.danger ?? '#e53e3e',
    fontSize: '15px',
  },
};

function statusColor(status) {
  switch (status) {
    case 'active': return colors.success ?? '#38a169';
    case 'inactive': return colors.textMuted ?? '#999';
    case 'renovating': return colors.warning ?? '#d69e2e';
    default: return colors.primary ?? '#3182ce';
  }
}

const EMPTY_FORM = {
  name: '',
  code: '',
  format: 'standard',
  address: '',
  city: '',
  country: '',
  lat: '',
  lng: '',
  geofence_radius: '',
  tags: '',
  phone: '',
  contact_person: '',
  contact_cell: '',
};

function storeToForm(store) {
  if (!store) return EMPTY_FORM;
  return {
    name: store.name ?? '',
    code: store.code ?? '',
    format: store.format ?? 'standard',
    address: store.address ?? '',
    city: store.city ?? '',
    country: store.country ?? '',
    lat: store.lat != null ? String(store.lat) : '',
    lng: store.lng != null ? String(store.lng) : '',
    geofence_radius: store.geofence_radius != null ? String(store.geofence_radius) : '',
    tags: Array.isArray(store.tags) ? store.tags.join(', ') : (store.tags ?? ''),
    phone: store.phone ?? '',
    contact_person: store.contact_person ?? '',
    contact_cell: store.contact_cell ?? '',
  };
}

function formToPayload(form) {
  return {
    name: form.name,
    code: form.code,
    format: form.format,
    address: form.address,
    city: form.city,
    country: form.country,
    lat: form.lat !== '' ? parseFloat(form.lat) : null,
    lng: form.lng !== '' ? parseFloat(form.lng) : null,
    geofence_radius: form.geofence_radius !== '' ? parseFloat(form.geofence_radius) : null,
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    phone: form.phone.trim() || null,
    contact_person: form.contact_person.trim() || null,
    contact_cell: form.contact_cell.trim() || null,
  };
}

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [infoError, setInfoError] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const { data: store, isLoading, isError, error } = useQuery({
    queryKey: ['store', id],
    queryFn: () => fetchStore(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (store) {
      setForm(storeToForm(store));
    }
  }, [store]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateStore({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', id] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setInfoError(null);
      window.alert('Store updated successfully.');
    },
    onError: (err) => {
      setInfoError(err?.response?.data?.message ?? err.message ?? 'Failed to save changes.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateStatus({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', id] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setStatusError(null);
      window.alert('Status updated.');
    },
    onError: (err) => {
      setStatusError(err?.response?.data?.message ?? err.message ?? 'Failed to update status.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      window.alert('Store deleted.');
      navigate('/admin/stores');
    },
    onError: (err) => {
      setDeleteError(err?.response?.data?.message ?? err.message ?? 'Failed to delete store.');
    },
  });

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setInfoError(null);
    updateMutation.mutate(formToPayload(form));
  };

  const handleStatusChange = (status) => {
    setStatusError(null);
    statusMutation.mutate(status);
  };

  const handleDelete = () => {
    setDeleteError(null);
    if (window.confirm(`Are you sure you want to delete "${store?.name ?? 'this store'}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingState}>Loading store…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={styles.page}>
        <div style={styles.errorState}>
          Failed to load store: {error?.message ?? 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <PageHeader
        title={store?.name ?? 'Store Details'}
        subtitle="Store details & settings"
        onBack={() => navigate('/admin/stores')}
      />

      {/* Info Card */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Store Information</div>
        <form onSubmit={handleSave}>
          <div style={styles.fieldGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Name</label>
              <input
                style={styles.input}
                value={form.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Store name"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Code</label>
              <input
                style={styles.input}
                value={form.code}
                onChange={(e) => handleFieldChange('code', e.target.value)}
                placeholder="e.g. STORE-001"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Format</label>
              <select
                style={styles.select}
                value={form.format}
                onChange={(e) => handleFieldChange('format', e.target.value)}
              >
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Address</label>
              <input
                style={styles.input}
                value={form.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>City</label>
              <input
                style={styles.input}
                value={form.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Country</label>
              <input
                style={styles.input}
                value={form.country}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                placeholder="Country"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Latitude</label>
              <input
                style={styles.input}
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => handleFieldChange('lat', e.target.value)}
                placeholder="e.g. 51.5074"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Longitude</label>
              <input
                style={styles.input}
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => handleFieldChange('lng', e.target.value)}
                placeholder="e.g. -0.1278"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Geofence Radius (m)</label>
              <input
                style={styles.input}
                type="number"
                min="0"
                value={form.geofence_radius}
                onChange={(e) => handleFieldChange('geofence_radius', e.target.value)}
                placeholder="e.g. 200"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tags (comma-separated)</label>
              <input
                style={styles.input}
                value={form.tags}
                onChange={(e) => handleFieldChange('tags', e.target.value)}
                placeholder="e.g. downtown, flagship, new"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Store Phone</label>
              <input
                style={styles.input}
                value={form.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="e.g. +971 4 123 4567"
                type="tel"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Contact Person</label>
              <input
                style={styles.input}
                value={form.contact_person}
                onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Contact Person Cell</label>
              <input
                style={styles.input}
                value={form.contact_cell}
                onChange={(e) => handleFieldChange('contact_cell', e.target.value)}
                placeholder="e.g. +971 50 123 4567"
                type="tel"
              />
            </div>
          </div>
          {infoError && <div style={styles.errorMsg}>{infoError}</div>}
          <button
            type="submit"
            style={{
              ...styles.saveBtn,
              ...(updateMutation.isPending ? styles.saveBtnDisabled : {}),
            }}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Status Card */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Store Status</div>
        <div style={styles.statusRow}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              style={styles.statusChip(store?.status === s, s)}
              onClick={() => handleStatusChange(s)}
              disabled={statusMutation.isPending}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {statusError && <div style={styles.errorMsg}>{statusError}</div>}
      </div>

      {/* Danger Zone */}
      <div style={styles.dangerSection}>
        <div style={styles.dangerTitle}>Danger Zone</div>
        <div style={styles.dangerDesc}>
          Permanently delete this store and all associated data. This action cannot be undone.
        </div>
        {deleteError && <div style={styles.errorMsg}>{deleteError}</div>}
        <button
          style={{
            ...styles.deleteBtn,
            ...(deleteMutation.isPending ? styles.deleteBtnDisabled : {}),
          }}
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Deleting…' : 'Delete Store'}
        </button>
      </div>
    </div>
  );
}
