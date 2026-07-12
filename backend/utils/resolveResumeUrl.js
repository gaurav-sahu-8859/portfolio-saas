const { cloudinary } = require('../config/cloudinary');

/**
 * Resolves the BEST currently-fetchable URL for a portfolio's resume.
 *
 * WHY THIS EXISTS: Cloudinary's "Restricted media types" account setting
 * (on by default for accounts created after Cloudinary's 2023 security
 * change) blocks PUBLIC, unsigned delivery of raw/PDF assets. Critically,
 * a SIGNED `type:'upload'` URL does NOT bypass this — that was tried
 * first (see streamRemoteFile.js's sign_url retry) and still got a 401
 * from Cloudinary, confirming the restriction is tied to the asset's
 * delivery `type`, not to whether the URL is signed. The only mechanism
 * Cloudinary documents as a reliable bypass is the `private` delivery
 * type, paired with a freshly-signed `private_download_url()` generated
 * server-side using the account's API secret — a genuinely different
 * trust/auth model than a signed `upload`-type URL.
 *
 * Resumes uploaded AFTER this fix (see config/cloudinary.js, `type:
 * 'private'`) have their Cloudinary public_id persisted as
 * `portfolio.resumePublicId` specifically so this function can regenerate
 * a fresh signed download URL on every single view request — private
 * delivery URLs are meant to be (re)generated on demand, not cached
 * indefinitely the way a public secure_url is.
 *
 * Resumes uploaded BEFORE this fix only have `resumeUrl` (a plain
 * `type:'upload'` URL) — this falls back to that. It may still 401 if the
 * account restriction is active, since nothing can retroactively change
 * an already-uploaded asset's delivery type without re-uploading the
 * bytes. The durable fix for those specific legacy files is simply
 * re-uploading the resume once from the dashboard, which produces a
 * resumePublicId and switches it onto the reliable path above.
 */
const resolveResumeUrl = (portfolio) => {
  if (portfolio?.resumePublicId) {
    try {
      return cloudinary.utils.private_download_url(portfolio.resumePublicId, undefined, {
        resource_type: 'raw',
        type: 'private',
        attachment: false,
      });
    } catch (err) {
      console.error('[resolveResumeUrl] Failed to generate a private download URL, falling back to resumeUrl:', err.message);
      return portfolio.resumeUrl || null;
    }
  }
  return portfolio?.resumeUrl || null;
};

module.exports = resolveResumeUrl;
