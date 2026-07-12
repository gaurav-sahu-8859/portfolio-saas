const zlib = require('zlib');
const { cloudinary } = require('../config/cloudinary');

const CLOUDINARY_URL_RE = /res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/upload\/v\d+\/(.+)/;

const parseCloudinaryUrl = (url) => {
  const match = url.match(CLOUDINARY_URL_RE);
  if (!match) return null;
  return { resourceType: match[1], publicId: decodeURIComponent(match[2]) };
};

// Cloudinary's archive uses a data descriptor (general-purpose flag 0x08),
// so compressed sizes live in the central directory, not the local header.
const extractPdfFromZip = (zipBuffer) => {
  const eocdOffset = zipBuffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocdOffset < 0) throw new Error('Invalid zip archive');

  const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirOffset;

  while (offset < eocdOffset) {
    if (zipBuffer.readUInt32LE(offset) !== 0x02014b50) break;

    const compMethod = zipBuffer.readUInt16LE(offset + 10);
    const compSize = zipBuffer.readUInt32LE(offset + 20);
    const nameLen = zipBuffer.readUInt16LE(offset + 28);
    const extraLen = zipBuffer.readUInt16LE(offset + 30);
    const commentLen = zipBuffer.readUInt16LE(offset + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);
    const name = zipBuffer.toString('utf8', offset + 46, offset + 46 + nameLen);

    offset += 46 + nameLen + extraLen + commentLen;

    if (!name.toLowerCase().endsWith('.pdf')) continue;

    const localNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const data = zipBuffer.subarray(dataStart, dataStart + compSize);

    if (compMethod === 0) return data;
    if (compMethod === 8) return zlib.inflateRawSync(data);
    throw new Error(`Unsupported zip compression for ${name}`);
  }

  throw new Error('No PDF found in Cloudinary archive');
};

const fetchViaCloudinaryApi = async (publicId, resourceType) => {
  const archiveUrl = cloudinary.utils.download_zip_url({
    resource_type: resourceType,
    public_ids: [publicId],
    mode: 'download',
  });

  const res = await fetch(archiveUrl);
  if (!res.ok) {
    throw new Error(`Cloudinary API download failed (${res.status})`);
  }

  const zipBuffer = Buffer.from(await res.arrayBuffer());
  return extractPdfFromZip(zipBuffer);
};

module.exports = { parseCloudinaryUrl, fetchViaCloudinaryApi };
