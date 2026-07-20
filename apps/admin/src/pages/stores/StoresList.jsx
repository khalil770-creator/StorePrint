import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { colors, shadow } from '../../theme';
import Badge from '../../components/Badge';
import PageHeader from '../../components/PageHeader';

const fetchStores = async () => {
  const res = await client.get('/stores');
  return res.data;
};

const styles = {
  page: {
    padding: '24px',
    minHeight: '100vh',
    backgroundColor: colors.background ?? '#f5f5f5',
  },
  searchRow: {
    marginBottom: '24px',
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '10px 14px',
    fontSize: '14px',
    border: `1px solid ${colors.border ?? '#e0e0e0'}`,
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: shadow?.card ?? '0 1px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.1s',
    border: `1px solid ${colors.border ?? '#e8e8e8'}`,
  },
  cardHovered: {
    boxShadow: shadow?.cardHover ?? '0 4px 16px rgba(0,0,0,0.14)',
    transform: 'translateY(-2px)',
  },
  storeName: {
    fontWeight: '700',
    fontSize: '16px',
    color: colors.text ?? '#1a1a1a',
    marginBottom: '8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  meta: {
    fontSize: '13px',
    color: colors.textSecondary ?? '#666',
    marginBottom: '4px',
  },
  code: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: colors.textMuted ?? '#999',
    marginTop: '8px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    color: colors.textSecondary ?? '#666',
    fontSize: '15px',
  },
  errorState: {
    textAlign: 'center',
    padding: '60px 0',
    color: colors.danger ?? '#e53e3e',
    fontSize: '15px',
  },
  loadingState: {
    textAlign: 'center',
    padding: '60px 0',
    color: colors.textSecondary ?? '#666',
    fontSize: '15px',
  },
  newStoreBtn: {
    padding: '9px 18px',
    backgroundColor: colors.success ?? '#38a169',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};

function StoreCard({ store, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      style={{ ...styles.card, ...(hovered ? styles.cardHovered : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View store ${store.name}`}
    >
      <div style={styles.storeName}>{store.name}</div>
      <div style={styles.badgeRow}>
        {store.status && <Badge variant={store.status}>{store.status}</Badge>}
        {store.format && <Badge variant="neutral">{store.format}</Badge>}
      </div>
      {(store.city || store.country) && (
        <div style={styles.meta}>
          {[store.city, store.country].filter(Boolean).join(', ')}
        </div>
      )}
      {store.code && <div style={styles.code}>{store.code}</div>}
    </div>
  );
}

export default function StoresList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['stores'],
    queryFn: fetchStores,
  });

  const stores = Array.isArray(data) ? data : (data?.data ?? []);

  const filtered = stores.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name ?? '').toLowerCase().includes(q) ||
      (s.city ?? '').toLowerCase().includes(q)
    );
  });

  const actions = (
    <button
      style={styles.newStoreBtn}
      onClick={() => navigate('/admin/stores/new')}
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Store
    </button>
  );

  return (
    <div style={styles.page}>
      <PageHeader
        title="Stores"
        subtitle={`${stores.length} location${stores.length !== 1 ? 's' : ''}`}
        onBack={false}
        actions={actions}
      />

      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search by name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search stores"
        />
      </div>

      {isLoading && <div style={styles.loadingState}>Loading stores…</div>}
      {isError && (
        <div style={styles.errorState}>
          Failed to load stores:{' '}
          {error?.message ?? 'Unknown error'}
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <div style={styles.emptyState}>
          {search ? 'No stores match your search.' : 'No stores yet. Create one!'}
        </div>
      )}
      {!isLoading && !isError && filtered.length > 0 && (
        <div style={styles.grid}>
          {filtered.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onClick={() => navigate(`/admin/stores/${store.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
