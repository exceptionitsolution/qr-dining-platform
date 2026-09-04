export function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  const rawApiUrl = import.meta.env.VITE_API_URL || '';
  const backendBase = rawApiUrl.replace(/\/api\/?$/, '');
  
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return backendBase ? `${backendBase}${cleanPath}` : cleanPath;
}
