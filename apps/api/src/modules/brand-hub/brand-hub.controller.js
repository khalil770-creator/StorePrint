const path   = require('path');
const { query } = require('../../config/db');
const { client: minioClient, BUCKET, uploadFile, getPresignedUrl } = require('../../config/minio');

// ─── helpers ──────────────────────────────────────────────────

const EXT_ICON = {
  pdf: '📄', zip: '🗜️', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊',
  psd: '🖼️', ai: '🎨', eps: '🎨', svg: '🎨',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️',
};

function fileIcon(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return EXT_ICON[ext] || '📁';
}

function safeObjectName(brandId, category, filename) {
  const ts   = Date.now();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `brand-hub/${brandId}/${category}/${ts}_${safe}`;
}

// ─── Categories ───────────────────────────────────────────────

exports.listCategories = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT c.*,
              COUNT(a.id)::int  AS asset_count,
              MAX(a.created_at) AS last_updated
       FROM brand_hub_categories c
       LEFT JOIN brand_hub_assets a ON a.category_id = c.id AND a.brand_id = $1
       WHERE c.brand_id = $1
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`,
      [req.user.brand_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list categories' }); }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { rows } = await query(
      `INSERT INTO brand_hub_categories(brand_id, name, description, icon, color, created_by)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.brand_id, name, description || null, icon || '📁', color || '#5CAD2C', req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create category' }); }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, icon, color, sort_order } = req.body;
    const { rows } = await query(
      `UPDATE brand_hub_categories
         SET name=$1, description=$2, icon=$3, color=$4,
             sort_order=COALESCE($5, sort_order), updated_at=NOW()
       WHERE id=$6 AND brand_id=$7
       RETURNING *`,
      [name, description || null, icon || '📁', color || '#5CAD2C',
       sort_order ?? null, req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update category' }); }
};

exports.deleteCategory = async (req, res) => {
  try {
    // Move assets to null category before deleting — scoped to this brand
    await query(
      `UPDATE brand_hub_assets SET category_id=NULL
       WHERE category_id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    await query(`DELETE FROM brand_hub_categories WHERE id=$1 AND brand_id=$2`, [req.params.id, req.user.brand_id]);
    res.json({ message: 'Category deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete category' }); }
};

// ─── Assets ───────────────────────────────────────────────────

exports.listAssets = async (req, res) => {
  try {
    const { category_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.brand_id];
    let where = 'WHERE a.brand_id=$1';
    if (category_id) { params.push(category_id); where += ` AND a.category_id=$${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (a.name ILIKE $${params.length} OR a.description ILIKE $${params.length})`;
    }
    params.push(limit, offset);

    const { rows } = await query(
      `SELECT a.*, c.name AS category_name, c.icon AS category_icon, u.name AS uploaded_by_name
       FROM brand_hub_assets a
       LEFT JOIN brand_hub_categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.uploaded_by
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Count
    const countParams = params.slice(0, params.length - 2);
    const { rows: cnt } = await query(
      `SELECT COUNT(*)::int AS total FROM brand_hub_assets a ${where.replace(/LIMIT.*/, '')}`,
      countParams
    );

    res.json({ data: rows, total: cnt[0]?.total || 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list assets' }); }
};

exports.getAsset = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.*, c.name AS category_name, u.name AS uploaded_by_name
       FROM brand_hub_assets a
       LEFT JOIN brand_hub_categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.uploaded_by
       WHERE a.id=$1 AND a.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get asset' }); }
};

exports.downloadAsset = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM brand_hub_assets WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Asset not found' });

    const asset = rows[0];

    // If it's a link asset, redirect directly
    if (asset.source === 'link') {
      return res.redirect(asset.file_url);
    }

    await query(
      `UPDATE brand_hub_assets SET download_count = download_count + 1 WHERE id=$1`,
      [asset.id]
    );

    // Get object metadata for Content-Length
    let stat;
    try { stat = await minioClient.statObject(BUCKET, asset.object_name); } catch (_) {}

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(asset.file_name)}"`);
    res.setHeader('Content-Type', asset.mime_type || 'application/octet-stream');
    if (stat?.size) res.setHeader('Content-Length', stat.size);

    const stream = await minioClient.getObject(BUCKET, asset.object_name);
    stream.pipe(res);
    stream.on('error', (err) => {
      console.error('[brand-hub] stream error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file' });
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to download asset' }); }
};

exports.uploadAsset = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { category_id, name, description, tags } = req.body;
    const file       = req.file;
    const assetName  = name || file.originalname;
    const objectName = safeObjectName(req.user.brand_id, category_id || 'uncategorised', file.originalname);
    const fileSize   = file.size;
    const mimeType   = file.mimetype;
    const ext        = path.extname(file.originalname).replace('.', '').toLowerCase();

    // Upload to MinIO
    const { Readable } = require('stream');
    const stream = Readable.from(file.buffer);
    await minioClient.putObject(BUCKET, objectName, stream, fileSize, { 'Content-Type': mimeType });

    const fileUrl = `/${BUCKET}/${objectName}`;

    const { rows } = await query(
      `INSERT INTO brand_hub_assets
         (brand_id, category_id, name, description, file_name, file_url, object_name,
          file_size, mime_type, extension, icon, source, tags, uploaded_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'upload',$12,$13)
       RETURNING *`,
      [req.user.brand_id, category_id || null, assetName, description || null,
       file.originalname, fileUrl, objectName,
       fileSize, mimeType, ext, fileIcon(file.originalname),
       tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : '[]',
       req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to upload asset' }); }
};

exports.addLinkAsset = async (req, res) => {
  try {
    const { category_id, name, description, file_url, tags } = req.body;
    if (!name)     return res.status(400).json({ error: 'name is required' });
    if (!file_url) return res.status(400).json({ error: 'file_url is required' });

    const ext = (file_url.split('?')[0].split('.').pop() || 'link').toLowerCase();

    const { rows } = await query(
      `INSERT INTO brand_hub_assets
         (brand_id, category_id, name, description, file_name, file_url,
          extension, icon, source, tags, uploaded_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,'link',$9,$10)
       RETURNING *`,
      [req.user.brand_id, category_id || null, name, description || null,
       name, file_url, ext, fileIcon(file_url),
       tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : '[]',
       req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to add link asset' }); }
};

exports.updateAsset = async (req, res) => {
  try {
    const { name, description, category_id, tags } = req.body;
    const { rows } = await query(
      `UPDATE brand_hub_assets
         SET name=$1, description=$2, category_id=$3,
             tags=COALESCE($4, tags), updated_at=NOW()
       WHERE id=$5 AND brand_id=$6
       RETURNING *`,
      [name, description || null, category_id || null,
       tags ? JSON.stringify(tags) : null,
       req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Asset not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update asset' }); }
};

exports.deleteAsset = async (req, res) => {
  try {
    const { rows } = await query(
      `DELETE FROM brand_hub_assets WHERE id=$1 AND brand_id=$2 RETURNING *`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Asset not found' });

    // Remove from MinIO if it was a direct upload
    const asset = rows[0];
    if (asset.source === 'upload' && asset.object_name) {
      try { await minioClient.removeObject(BUCKET, asset.object_name); } catch (_) {}
    }

    res.json({ message: 'Asset deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete asset' }); }
};
