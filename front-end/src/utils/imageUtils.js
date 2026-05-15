const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend-ovbc.onrender.com';

export const parseImages = (images) => {
  if (Array.isArray(images)) return images;
  if (!images) return [];

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erreur parseImages:', error.message, images);
      return [];
    }
  }

  return [];
};

export const resolveImageUrl = (image) => {
  if (!image) return null;
  if (typeof image !== 'string') return null;

  const trimmed = image.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (trimmed.startsWith('/')) {
    return `${BACKEND_BASE_URL}${trimmed}`;
  }

  return `${BACKEND_BASE_URL}/${trimmed}`;
};

export const handleImageError = (event) => {
  const img = event.target;
  img.onerror = null;
  img.style.display = 'none';
  const placeholder = img.nextElementSibling;
  if (placeholder) placeholder.style.display = 'flex';
};
