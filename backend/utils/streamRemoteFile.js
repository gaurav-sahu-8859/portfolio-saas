// const { cloudinary } = require('../config/cloudinary');

// /**
//  * Fetches a remote file server-side and streams it back with EXPLICITLY
//  * correct headers, regardless of what the upstream (Cloudinary) actually
//  * sent. This is what makes resume viewing reliable for BOTH:
//  *   - resumes uploaded before the resource_type:'raw' fix (old, broken
//  *     /image/upload/... URLs that Cloudinary serves with a non-standard
//  *     `image/pdf` content-type)
//  *   - any future edge case where an upstream's headers can't be trusted
//  *
//  * No data migration is required — every existing resumeUrl in the
//  * database keeps working through this proxy without needing to be
//  * re-uploaded, because we control the Content-Type on OUR response,
//  * not whatever Cloudinary happened to send on theirs.
//  *
//  * SECURITY: only ever call this with a URL read from OUR OWN database
//  * (portfolio.resumeUrl) — never with arbitrary client-supplied input.
//  * That constraint is what keeps this from being an open proxy / SSRF
//  * vector; every caller in this codebase fetches the URL from a Mongo
//  * document first, never from a query param or request body.
//  *
//  * KNOWN FAILURE MODE THIS HANDLES: many Cloudinary accounts have
//  * "Restricted media types" enabled by default (Settings → Security →
//  * "Allow delivery of PDF and ZIP files" = off). When that's the case,
//  * the PUBLIC, unsigned delivery URL for a raw/PDF asset is rejected by
//  * Cloudinary's CDN edge — even though the upload itself succeeded and
//  * the file genuinely exists. Cloudinary's own documented workaround is
//  * a SIGNED delivery URL, which authenticates the request and is exempt
//  * from that restriction. This function tries the plain URL first, and
//  * only falls back to a signed retry if that first attempt fails —
//  * so accounts that already have the setting enabled never pay the
//  * cost of a second request.
//  */

// // Parses a standard Cloudinary delivery URL into its components so a
// // signed retry URL can be regenerated without needing to store the
// // public_id separately — the existing resumeUrl field already has
// // everything we need encoded in it.
// const parseCloudinaryUrl = (url) => {
//   try {
//     const u = new URL(url);
//     if (!u.hostname.endsWith('cloudinary.com')) return null;
//     const parts = u.pathname.split('/').filter(Boolean);
//     // Expected shape: /<cloudName>/<resourceType>/<deliveryType>/[v<version>/]<publicId...>
//     if (parts.length < 4) return null;
//     const [, resourceType, deliveryType, ...rest] = parts;
//     const publicIdParts = /^v\d+$/.test(rest[0]) ? rest.slice(1) : rest;
//     if (publicIdParts.length === 0) return null;
//     return { resourceType, deliveryType, publicId: publicIdParts.join('/') };
//   } catch {
//     return null;
//   }
// };

// const streamRemoteFile = async (res, url, options = {}) => {
//   const { filename = 'resume.pdf', contentType = 'application/pdf', inline = true } = options;

//   let upstream = await fetch(url);

//   if (!upstream.ok) {
//     const bodySnippet = await upstream.text().catch(() => '');
//     console.error(
//       `[streamRemoteFile] Direct fetch failed — HTTP ${upstream.status} ${upstream.statusText}\n` +
//       `  URL: ${url}\n` +
//       `  Upstream body (first 300 chars): ${bodySnippet.slice(0, 300)}`
//     );

//     const parsed = parseCloudinaryUrl(url);
//     if (parsed) {
//       const signedUrl = cloudinary.url(parsed.publicId, {
//         resource_type: parsed.resourceType,
//         type: parsed.deliveryType,
//         sign_url: true,
//         secure: true,
//       });
//       console.log(`[streamRemoteFile] Retrying with a signed URL (resource_type=${parsed.resourceType}, type=${parsed.deliveryType})`);
//       upstream = await fetch(signedUrl);

//       if (!upstream.ok) {
//         const retrySnippet = await upstream.text().catch(() => '');
//         console.error(
//           `[streamRemoteFile] Signed retry ALSO failed — HTTP ${upstream.status} ${upstream.statusText}\n` +
//           `  Upstream body (first 300 chars): ${retrySnippet.slice(0, 300)}`
//         );
//       } else {
//         console.log('[streamRemoteFile] Signed retry succeeded.');
//       }
//     } else {
//       console.error('[streamRemoteFile] URL did not look like a standard Cloudinary delivery URL — skipping signed-URL retry.');
//     }
//   }

//   if (!upstream.ok) {
//     res.status(502);
//     throw new Error(
//       `Could not retrieve the file from storage (upstream returned ${upstream.status} ${upstream.statusText}). ` +
//       'Check server logs for the upstream response body — this usually means Cloudinary is blocking delivery ' +
//       'of this resource type (Settings → Security → "Allow delivery of PDF and ZIP files").'
//     );
//   }

//   const buffer = Buffer.from(await upstream.arrayBuffer());

//   res.set({
//     'Content-Type': contentType,
//     'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
//     'Content-Length': buffer.length,
//     'Cache-Control': 'public, max-age=3600',
//   });
//   res.send(buffer);
// };

// module.exports = streamRemoteFile;



/**
 * Fetches a remote file server-side and streams it back with EXPLICITLY
 * correct headers, regardless of what the upstream (Cloudinary) actually
 * sent. This is what makes resume viewing reliable for BOTH:
 *   - resumes uploaded before the resource_type:'raw' fix (old, broken
 *     /image/upload/... URLs that Cloudinary serves with a non-standard
 *     `image/pdf` content-type)
 *   - any future edge case where an upstream's headers can't be trusted
 *
 * No data migration is required — every existing resumeUrl in the
 * database keeps working through this proxy without needing to be
 * re-uploaded, because we control the Content-Type on OUR response,
 * not whatever Cloudinary happened to send on theirs.
 *
 * SECURITY: only ever call this with a URL read from OUR OWN database
 * (portfolio.resumeUrl) — never with arbitrary client-supplied input.
 * That constraint is what keeps this from being an open proxy / SSRF
 * vector; every caller in this codebase fetches the URL from a Mongo
 * document first, never from a query param or request body.
 */
const { parseCloudinaryUrl, fetchViaCloudinaryApi } = require('./cloudinaryDelivery');

const streamRemoteFile = async (res, url, options = {}) => {
  const { filename = 'resume.pdf', contentType = 'application/pdf', inline = true } = options;

  let buffer;
  // Cache-Control: 'public, max-age=3600' used to be set below, keyed only
  // off the STATIC route URL (/api/portfolio/resume, /api/public/:username/
  // resume, /api/public/owner/resume). Those URLs never change even when a
  // user replaces their resume, so browsers (and any CDN in front of this
  // API) happily served the FIRST uploaded PDF back out of cache for up to
  // an hour on every later request — without ever re-hitting this handler
  // — even though Mongo and Cloudinary both already held the new file.
  // That mismatch (server always fetches/streams the latest DB value, but
  // the client never asks it to) was the actual root cause of "old resume
  // still shown after re-upload". This response must always be treated as
  // dynamic and re-validated from the DB on every request; see also the
  // `?v=` cache-busting query param appended client-side to these same
  // routes for defense-in-depth against any intermediate cache that
  // ignores this header.
  const upstream = await fetch(url, { cache: 'no-store' });

  if (upstream.ok) {
    buffer = Buffer.from(await upstream.arrayBuffer());
  } else {
    // Free Cloudinary accounts block public PDF CDN delivery by default
    // (401 + x-cld-error: "deny or ACL failure") even though upload succeeds.
    // Fall back to the signed Admin API, which is not subject to that restriction.
    const cloudinaryAsset = parseCloudinaryUrl(url);
    if (!cloudinaryAsset || (upstream.status !== 401 && upstream.status !== 403)) {
      res.status(502);
      throw new Error('Could not retrieve the file from storage');
    }

    try {
      buffer = await fetchViaCloudinaryApi(cloudinaryAsset.publicId, cloudinaryAsset.resourceType);
    } catch {
      res.status(502);
      throw new Error(
        'Could not retrieve the file from storage. If you use Cloudinary, enable '
        + '"Allow delivery of PDF and ZIP files" under Settings → Security.'
      );
    }
  }

  res.set({
    'Content-Type': contentType,
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
    'Content-Length': buffer.length,
    // 'Cache-Control': 'public, max-age=3600',
    // // Was 'public, max-age=3600' — see the note above `fetch(url, ...)`
    // // above for why that was the root cause of stale resumes. This is a
    // // small file re-fetched from the DB's current pointer on every single
    // // request, so there is no correctness-safe way to let a browser or
    // // CDN reuse a previous response for it.
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
  });
  res.send(buffer);
};

module.exports = streamRemoteFile;
