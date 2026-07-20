import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import PageHeader from '../../components/PageHeader'

function getData(res) { return res?.data?.data ?? res?.data ?? null }

const ACCEPT = '.pdf,.zip,.doc,.docx,.ppt,.pptx,.psd,.ai,.eps,.svg,.png,.jpg,.jpeg,.gif,.webp'

const FILE_ICON = (ext) => {
  const m = { pdf:'📄', zip:'🗜️', doc:'📝', docx:'📝', ppt:'📊', pptx:'📊',
               psd:'🖼️', ai:'🎨', eps:'🎨', svg:'🎨',
               png:'🖼️', jpg:'🖼️', jpeg:'🖼️', gif:'🖼️', webp:'🖼️' }
  return m[(ext||'').toLowerCase()] || '📁'
}

function fmtBytes(b) {
  if (!b) return '—'
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}

// ─── Category Modal ───────────────────────────────────────────
function CategoryModal({ cat, onClose, onSaved }) {
  const qc = useQueryClient()
  const isEdit = !!cat
  const [form, setForm] = useState({
    name:        cat?.name        || '',
    description: cat?.description || '',
    icon:        cat?.icon        || '📁',
    color:       cat?.color       || '#0052CC',
  })
  const [err, setErr] = useState('')

  const mut = useMutation({
    mutationFn: (body) => isEdit
      ? client.put(`/brand-hub/categories/${cat.id}`, body).then(r => r.data)
      : client.post('/brand-hub/categories', body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bh-categories'] }); onSaved() },
    onError: (e) => setErr(e.response?.data?.error || 'Failed to save'),
  })

  const ICONS = ['📖','🎨','🖌️','🔤','📁','🖼️','📋','🗂️','🔗','📦','✏️','🎯']
  const COLORS = ['#0052CC','#1E40AF','#7C3AED','#E65100','#0891B2','#C05621','#DC2626','#374151']

  const s = {
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
    modal:   { background:colors.white, borderRadius:14, width:440, padding:'28px 32px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
    title:   { fontSize:17, fontWeight:800, color:colors.dark, marginBottom:20 },
    label:   { display:'block', fontSize:12, fontWeight:600, color:colors.darkGrey, marginBottom:5 },
    input:   { width:'100%', padding:'9px 12px', border:`1.5px solid ${colors.border}`, borderRadius:8, fontSize:14, color:colors.dark, boxSizing:'border-box', marginBottom:14, outline:'none' },
    row:     { display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 },
    iconBtn: (active) => ({ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:`2px solid ${active ? colors.primary : colors.border}`, cursor:'pointer', fontSize:18, background: active ? colors.primary + '15' : colors.white }),
    colorDot:(c,active)=> ({ width:24, height:24, borderRadius:'50%', background:c, border:`3px solid ${active?colors.dark:c}`, cursor:'pointer' }),
    actions: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 },
    btn:     { padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', border:'none' },
    err:     { marginBottom:10, padding:'8px 12px', background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:8, color:'#991B1B', fontSize:13 },
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.modal}>
        <div style={s.title}>{isEdit ? 'Edit Category' : 'New Category'}</div>
        {err && <div style={s.err}>⚠️ {err}</div>}
        <label style={s.label}>Category Name *</label>
        <input style={s.input} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Logos" autoFocus />
        <label style={s.label}>Description</label>
        <input style={s.input} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Optional" />
        <label style={s.label}>Icon</label>
        <div style={s.row}>{ICONS.map(ic => <button key={ic} style={s.iconBtn(form.icon===ic)} onClick={() => setForm(f => ({...f, icon:ic}))}>{ic}</button>)}</div>
        <label style={s.label}>Colour</label>
        <div style={s.row}>{COLORS.map(c => <div key={c} style={s.colorDot(c, form.color===c)} onClick={() => setForm(f => ({...f, color:c}))} />)}</div>
        <div style={s.actions}>
          <button style={{...s.btn, background:'transparent', color:colors.midGrey, border:`1.5px solid ${colors.border}`}} onClick={onClose}>Cancel</button>
          <button style={{...s.btn, background:colors.primary, color:'#fff', opacity: mut.isPending ? 0.6 : 1}} disabled={mut.isPending} onClick={() => { if (!form.name.trim()) { setErr('Name is required'); return }; mut.mutate(form) }}>
            {mut.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────
function UploadModal({ categories, preselect, onClose, onSaved }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState('file')   // 'file' | 'link'
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ name:'', description:'', category_id: preselect||'', tags:'', file_url:'' })
  const [err, setErr] = useState('')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef()

  const uploadMut = useMutation({
    mutationFn: (fd) => client.post('/brand-hub/assets/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => setProgress(Math.round(e.loaded / e.total * 100)),
    }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bh-assets'] }); onSaved() },
    onError: (e) => setErr(e.response?.data?.error || 'Upload failed'),
  })

  const linkMut = useMutation({
    mutationFn: (body) => client.post('/brand-hub/assets/link', body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bh-assets'] }); onSaved() },
    onError: (e) => setErr(e.response?.data?.error || 'Failed to add link'),
  })

  const handleSubmit = () => {
    setErr('')
    if (tab === 'file') {
      if (!file) { setErr('Please select a file'); return }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', form.name || file.name)
      if (form.description) fd.append('description', form.description)
      if (form.category_id) fd.append('category_id', form.category_id)
      if (form.tags) fd.append('tags', form.tags)
      uploadMut.mutate(fd)
    } else {
      if (!form.name.trim()) { setErr('Name is required'); return }
      if (!form.file_url.trim()) { setErr('URL is required'); return }
      linkMut.mutate({ name: form.name, description: form.description, file_url: form.file_url, category_id: form.category_id || null, tags: form.tags })
    }
  }

  const isPending = uploadMut.isPending || linkMut.isPending

  const s = {
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
    modal:   { background:colors.white, borderRadius:14, width:520, maxHeight:'90vh', overflowY:'auto', padding:'28px 32px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
    title:   { fontSize:17, fontWeight:800, color:colors.dark, marginBottom:16 },
    tabs:    { display:'flex', gap:0, marginBottom:20, border:`1.5px solid ${colors.border}`, borderRadius:8, overflow:'hidden' },
    tab:     (a) => ({ flex:1, padding:'9px 0', textAlign:'center', fontSize:13, fontWeight:700, cursor:'pointer', background: a ? colors.primary : colors.white, color: a ? '#fff' : colors.midGrey, border:'none' }),
    label:   { display:'block', fontSize:12, fontWeight:600, color:colors.darkGrey, marginBottom:5 },
    input:   { width:'100%', padding:'9px 12px', border:`1.5px solid ${colors.border}`, borderRadius:8, fontSize:14, color:colors.dark, boxSizing:'border-box', marginBottom:14, outline:'none' },
    dropzone:{ border:`2px dashed ${file ? colors.primary : colors.border}`, borderRadius:10, padding:'28px 20px', textAlign:'center', background: file ? colors.primary+'08' : colors.background, cursor:'pointer', marginBottom:14 },
    dropText:{ fontSize:13, color: file ? colors.primary : colors.midGrey, fontWeight: file ? 700 : 400 },
    progBar: { height:6, background:colors.border, borderRadius:3, overflow:'hidden', marginBottom:14 },
    progFill:{ height:6, background:colors.primary, borderRadius:3, transition:'width 0.2s' },
    actions: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 },
    btn:     { padding:'10px 22px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', border:'none' },
    err:     { marginBottom:10, padding:'8px 12px', background:'#FEE2E2', borderRadius:8, color:'#991B1B', fontSize:13 },
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.modal}>
        <div style={s.title}>Add Asset</div>
        {err && <div style={s.err}>⚠️ {err}</div>}

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(tab==='file')} onClick={() => setTab('file')}>📤 Upload File</button>
          <button style={s.tab(tab==='link')} onClick={() => setTab('link')}>🔗 Add Link</button>
        </div>

        {/* File upload */}
        {tab === 'file' && (
          <>
            <div style={s.dropzone} onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setForm(p => ({...p, name: p.name || f.name})) } }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{file ? FILE_ICON(file.name.split('.').pop()) : '📤'}</div>
              <div style={s.dropText}>{file ? file.name : 'Drag & drop or click to select'}</div>
              {file && <div style={{ fontSize:11, color:colors.midGrey, marginTop:4 }}>{fmtBytes(file.size)}</div>}
            </div>
            <input ref={inputRef} type="file" accept={ACCEPT} style={{ display:'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setForm(p => ({...p, name: p.name || f.name})) } }} />
            {isPending && <div style={s.progBar}><div style={{...s.progFill, width:`${progress}%`}} /></div>}
          </>
        )}

        {/* Link */}
        {tab === 'link' && (
          <>
            <label style={s.label}>External URL *</label>
            <input style={s.input} placeholder="https://drive.google.com/file/..." value={form.file_url} onChange={e => setForm(p => ({...p, file_url: e.target.value}))} />
          </>
        )}

        {/* Common fields */}
        <label style={s.label}>Display Name {tab==='link' && '*'}</label>
        <input style={s.input} value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder={tab==='file' ? 'Leave blank to use filename' : 'e.g. Brand Guidelines 2024'} />

        <label style={s.label}>Description</label>
        <input style={s.input} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Optional" />

        <label style={s.label}>Category</label>
        <select style={{...s.input, appearance:'none'}} value={form.category_id} onChange={e => setForm(p => ({...p, category_id: e.target.value}))}>
          <option value="">— Uncategorised —</option>
          {(categories||[]).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        <label style={s.label}>Tags (comma-separated)</label>
        <input style={s.input} value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} placeholder="e.g. logo, green, horizontal" />

        <div style={s.actions}>
          <button style={{...s.btn, background:'transparent', color:colors.midGrey, border:`1.5px solid ${colors.border}`}} onClick={onClose}>Cancel</button>
          <button style={{...s.btn, background:colors.primary, color:'#fff', opacity: isPending?0.6:1}} disabled={isPending} onClick={handleSubmit}>
            {isPending ? (tab==='file' ? `Uploading ${progress}%…` : 'Saving…') : tab==='file' ? 'Upload' : 'Add Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function BrandHubPage() {
  const qc = useQueryClient()
  const [activeCat, setActiveCat]     = useState(null)  // null = All
  const [showCatModal, setShowCatModal] = useState(null) // null|false|catObj
  const [showUpload, setShowUpload]   = useState(false)
  const [search, setSearch]           = useState('')
  const [deleteId, setDeleteId]       = useState(null)

  const { data: catsRaw, isLoading: loadingCats } = useQuery({
    queryKey: ['bh-categories'],
    queryFn:  () => client.get('/brand-hub/categories'),
  })
  const cats = getData(catsRaw) || []

  const { data: assetsRaw, isLoading: loadingAssets } = useQuery({
    queryKey: ['bh-assets', activeCat, search],
    queryFn:  () => client.get('/brand-hub/assets', { params: { category_id: activeCat || undefined, search: search || undefined } }),
  })
  const assets = assetsRaw?.data?.data || assetsRaw?.data || []

  const deleteMut = useMutation({
    mutationFn: (id) => client.delete(`/brand-hub/assets/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['bh-assets'] }); qc.invalidateQueries({ queryKey: ['bh-categories'] }); setDeleteId(null) },
  })

  const deleteCatMut = useMutation({
    mutationFn: (id) => client.delete(`/brand-hub/categories/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['bh-categories'] }); setActiveCat(null) },
  })

  const handleDownload = async (asset) => {
    try {
      const { data } = await client.get(`/brand-hub/assets/${asset.id}/download`)
      window.open(data.url, '_blank')
    } catch { window.alert('Download failed') }
  }

  const s = {
    page:      { padding:'32px 40px', background:colors.background, minHeight:'100vh' },
    layout:    { display:'flex', gap:24, marginTop:24 },
    sidebar:   { width:220, flexShrink:0 },
    catHead:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
    catLabel:  { fontSize:11, fontWeight:700, color:colors.midGrey, textTransform:'uppercase', letterSpacing:0.8 },
    addCatBtn: { fontSize:18, cursor:'pointer', color:colors.primary, lineHeight:1 },
    catItem:   (active) => ({ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, cursor:'pointer', marginBottom:4, background: active ? colors.primary+'15' : 'transparent', border: active ? `1.5px solid ${colors.primary}` : '1.5px solid transparent', fontWeight: active ? 700 : 500, color: active ? colors.primary : colors.dark, fontSize:13 }),
    catCount:  { marginLeft:'auto', fontSize:11, color:colors.midGrey },
    catEdit:   { fontSize:11, color:colors.midGrey, cursor:'pointer', marginLeft:4, opacity:0 },
    main:      { flex:1 },
    toolbar:   { display:'flex', gap:10, marginBottom:16, alignItems:'center' },
    search:    { flex:1, padding:'9px 14px', border:`1.5px solid ${colors.border}`, borderRadius:8, fontSize:13, outline:'none', color:colors.dark },
    uploadBtn: { padding:'9px 18px', background:colors.primary, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' },
    table:     { width:'100%', borderCollapse:'collapse', background:colors.white, borderRadius:12, overflow:'hidden', boxShadow:shadow.sm, border:`1px solid ${colors.border}` },
    th:        { padding:'11px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:colors.midGrey, background:colors.background, borderBottom:`1px solid ${colors.border}`, textTransform:'uppercase', letterSpacing:0.6 },
    td:        { padding:'11px 14px', fontSize:13, color:colors.dark, borderBottom:`1px solid ${colors.border}`, verticalAlign:'middle' },
    nameCell:  { display:'flex', alignItems:'center', gap:8 },
    iconBox:   { fontSize:20, width:34, height:34, background:colors.background, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
    fileName:  { fontWeight:600, color:colors.dark, fontSize:13 },
    fileSub:   { fontSize:11, color:colors.midGrey, marginTop:1 },
    sourceBadge:(s)=> ({ display:'inline-block', padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700, background: s==='link' ? '#EEF4FF' : '#F0F8EA', color: s==='link' ? '#1E40AF' : '#2E7D32' }),
    actionBtn: { padding:'5px 10px', fontSize:11, fontWeight:700, borderRadius:6, border:`1px solid ${colors.border}`, background:colors.white, cursor:'pointer', marginRight:4 },
    delBtn:    { padding:'5px 10px', fontSize:11, fontWeight:700, borderRadius:6, border:'1px solid #FECACA', background:'#FFF0F0', color:'#DC2626', cursor:'pointer' },
    empty:     { textAlign:'center', padding:'48px 0', color:colors.lightGrey, fontSize:14 },
    loading:   { padding:'24px 0', color:colors.midGrey, fontSize:13 },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Brand Hub"
        subtitle="Manage brand assets, guidelines and files"
        onBack={false}
        actions={<button style={s.uploadBtn} onClick={() => setShowUpload(true)}>+ Upload / Add Asset</button>}
      />

      {showCatModal !== null && (
        <CategoryModal
          cat={showCatModal || null}
          onClose={() => setShowCatModal(null)}
          onSaved={() => setShowCatModal(null)}
        />
      )}

      {showUpload && (
        <UploadModal
          categories={cats}
          preselect={activeCat}
          onClose={() => setShowUpload(false)}
          onSaved={() => setShowUpload(false)}
        />
      )}

      <div style={s.layout}>
        {/* Sidebar — categories */}
        <aside style={s.sidebar}>
          <div style={s.catHead}>
            <span style={s.catLabel}>Categories</span>
            <span style={s.addCatBtn} title="New category" onClick={() => setShowCatModal(false)}>＋</span>
          </div>

          {/* All */}
          <div style={s.catItem(!activeCat)} onClick={() => setActiveCat(null)}>
            <span>📦</span> All Assets
            <span style={s.catCount}>{assets.length}</span>
          </div>

          {loadingCats && <div style={s.loading}>Loading…</div>}

          {cats.map(cat => (
            <div key={cat.id} style={{ position:'relative' }}
              onMouseEnter={e => { const btn = e.currentTarget.querySelector('[data-edit]'); if (btn) btn.style.opacity = 1 }}
              onMouseLeave={e => { const btn = e.currentTarget.querySelector('[data-edit]'); if (btn) btn.style.opacity = 0 }}>
              <div style={s.catItem(activeCat === cat.id)} onClick={() => setActiveCat(cat.id)}>
                <span>{cat.icon}</span>
                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.name}</span>
                <span style={s.catCount}>{cat.asset_count}</span>
                <span data-edit style={s.catEdit} onClick={e => { e.stopPropagation(); setShowCatModal(cat) }}>✏️</span>
              </div>
            </div>
          ))}

          {activeCat && cats.find(c => c.id === activeCat) && (
            <button style={{ marginTop:8, width:'100%', padding:'6px 0', fontSize:11, fontWeight:700, color:'#DC2626', background:'transparent', border:`1px solid #FECACA`, borderRadius:6, cursor:'pointer' }}
              onClick={() => { if (window.confirm('Delete this category? Assets will be uncategorised.')) deleteCatMut.mutate(activeCat) }}>
              🗑 Delete Category
            </button>
          )}
        </aside>

        {/* Main — assets table */}
        <div style={s.main}>
          <div style={s.toolbar}>
            <input style={s.search} placeholder="Search assets…" value={search} onChange={e => setSearch(e.target.value)} />
            <button style={s.uploadBtn} onClick={() => setShowUpload(true)}>+ Add</button>
          </div>

          {loadingAssets && <div style={s.loading}>Loading assets…</div>}

          {!loadingAssets && assets.length === 0 && (
            <div style={s.empty}>
              <div style={{ fontSize:36, marginBottom:12 }}>📂</div>
              No assets yet. Click <strong>+ Add</strong> to upload a file or add a link.
            </div>
          )}

          {assets.length > 0 && (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>File</th>
                  <th style={s.th}>Category</th>
                  <th style={s.th}>Size</th>
                  <th style={s.th}>Source</th>
                  <th style={s.th}>Downloads</th>
                  <th style={s.th}>Uploaded</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id}>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <div style={s.iconBox}>{FILE_ICON(a.extension)}</div>
                        <div>
                          <div style={s.fileName}>{a.name}</div>
                          <div style={s.fileSub}>{a.file_name} {a.extension && `· .${a.extension.toUpperCase()}`}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>{a.category_icon} {a.category_name || <span style={{ color:colors.lightGrey }}>—</span>}</td>
                    <td style={s.td}>{fmtBytes(a.file_size)}</td>
                    <td style={s.td}><span style={s.sourceBadge(a.source)}>{a.source === 'link' ? '🔗 Link' : '📤 Upload'}</span></td>
                    <td style={s.td}>{a.download_count}</td>
                    <td style={s.td}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                    <td style={s.td}>
                      <button style={s.actionBtn} onClick={() => handleDownload(a)}>↓ {a.source === 'link' ? 'Open' : 'Download'}</button>
                      <button style={s.delBtn} onClick={() => { if (window.confirm(`Delete "${a.name}"?`)) deleteMut.mutate(a.id) }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
