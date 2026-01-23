function normalizeApiBaseUrl(value) {
	if (!value) return 'http://localhost:8000/api';
	const trimmed = value.replace(/\/+$/, '');
	return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
