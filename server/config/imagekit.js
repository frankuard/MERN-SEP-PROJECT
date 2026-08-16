let imagekitInstance = null;

const isImageKitConfigured = () =>
  Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT
  );

const getImageKit = () => {
  if (!isImageKitConfigured()) {
    return null;
  }

  if (!imagekitInstance) {
    const ImageKit = require('imagekit');
    imagekitInstance = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }

  return imagekitInstance;
};

module.exports = {
  getImageKit,
  isImageKitConfigured,
};
