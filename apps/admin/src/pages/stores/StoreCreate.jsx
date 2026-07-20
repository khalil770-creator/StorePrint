import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { colors, shadow } from '../../theme';
import PageHeader from '../../components/PageHeader';

const FORMAT_OPTIONS = ['flagship', 'standard', 'pop-up', 'franchise'];

const createStore = async (payload) => {
  const res = await client.post('/stores', payload);
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
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: colors.text ?? '#1a1a1a',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${colors.border ?? '#f0f0f0'}`,
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
  inputError: {
    border: `1px solid ${colors.danger ?? '#e53e3e'}`,
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
  fieldError: {
    fontSize: '12px',
    color: colors.danger ?? '#e53e3e',
    marginTop: '2px',
  },
  actions: {
    marginTop: '24px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  submitBtn: {
    padding: '10px 24px',
    backgroundColor: colors.primary ?? '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: colors.textSecondary ?? '#666',
    border: `1px solid ${colors.border ?? '#e0e0e0'}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  errorMsg: {
    marginTop: '10px',
    fontSize: '13px',
    color: colors.danger ?? '#e53e3e',
  },
};

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

export default function StoreCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const createMutation = useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      window.alert('Store created successfully.');
      navigate('/admin/stores');
    },
    onError: (err) => {
      setSubmitError(
        err?.response?.data?.message ?? err.message ?? 'Failed to create store.'
      );
    },
  });

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Store name is required.';
    }
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    createMutation.mutate(formToPayload(form));
  };

  return (
    <div style={styles.page}>
      <PageHeader
        title="New Store"
        subtitle="Fill in the details to create a new store location."
        onBack={() => navigate('/admin/stores')}
      />

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Store Information</div>
        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.fieldGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Name <span style={{ color: colors.danger ?? '#e53e3e' }}>*</span>
              </label>
              <input
                style={{
                  ...styles.input,
                  ...(fieldErrors.name ? styles.inputError : {}),
                }}
                value={form.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Store name"
                aria-required="true"
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
              {fieldErrors.name && (
                <span id="name-error" style={styles.fieldError}>
                  {fieldErrors.name}
                </span>
              )}
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

          {submitError && <div style={styles.errorMsg}>{submitError}</div>}

          <div style={styles.actions}>
            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                ...(createMutation.isPending ? styles.submitBtnDisabled : {}),
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create Store'}
            </button>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={() => navigate('/admin/stores')}
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
