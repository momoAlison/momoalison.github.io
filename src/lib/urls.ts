export const withBase = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const postUrl = (id: string) => withBase(`blog/${id.split('/').map(encodeURIComponent).join('/')}/`);
