const { query } = require('../../../config/db');
const { uploadFile, getPresignedUrl } = require('../../../config/minio');
const { Readable } = require('stream');

exports.getBrand = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, app_name, logo_url, primary_color, secondary_color FROM brands WHERE id=$1`,
      [req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Brand not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get brand' }); }
};

exports.updateBrand = async (req, res) => {
  try {
    const { name, app_name, primary_color, secondary_color } = req.body;
    await query(
      `UPDATE brands SET name=$1, app_name=$2, primary_color=$3, secondary_color=$4, updated_at=NOW()
       WHERE id=$5`,
      [name, app_name, primary_color, secondary_color, req.user.brand_id]
    );
    res.json({ message: 'Brand updated' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update brand' }); }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const ext = req.file.originalname.split('.').pop() || 'png';
    const objectName = `brands/${req.user.brand_id}/logo.${ext}`;
    const stream = Readable.from(req.file.buffer);
    await uploadFile(objectName, stream, req.file.size, req.file.mimetype);
    const url = await getPresignedUrl(objectName, 60 * 60 * 24 * 365);
    await query(
      `UPDATE brands SET logo_url=$1, updated_at=NOW() WHERE id=$2`,
      [url, req.user.brand_id]
    );
    res.json({ logo_url: url });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to upload logo' }); }
};
