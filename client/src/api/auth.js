import { http } from './http';

export async function registerUser(payload) {
  const res = await http.post('/auth/register', payload);
  return res.data;
}

export async function loginUser(payload) {
  const res = await http.post('/auth/login', payload);
  return res.data; // { access_token, token_type }
}

export async function loginWithGoogle(idToken, role) {
  const res = await http.post('/auth/google', { id_token: idToken, role });
  return res.data; // { access_token, token_type }
}

export async function getMe() {
  const res = await http.get('/users/me');
  return res.data;
}
