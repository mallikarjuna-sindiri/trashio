import { http } from './http';

export async function createReport({ description, lat, lng, beforeFile }) {
  const form = new FormData();
  form.append('description', description);
  form.append('lat', String(lat));
  form.append('lng', String(lng));
  form.append('before_image', beforeFile);

  const res = await http.post('/reports/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getMyReports() {
  const res = await http.get('/reports/my');
  return res.data;
}

export async function getAssignedReports() {
  const res = await http.get('/reports/assigned');
  return res.data;
}

export async function adminListReports(status) {
  const res = await http.get('/admin/reports', {
    params: status ? { status_filter: status } : {},
  });
  return res.data;
}

export async function adminListCleaners() {
  const res = await http.get('/admin/cleaners');
  return res.data;
}

export async function adminVerifyReport(reportId, body) {
  const res = await http.post(`/admin/reports/${reportId}/verify`, body);
  return res.data;
}

export async function adminAssignCleaner(reportId, body) {
  const res = await http.post(`/admin/reports/${reportId}/assign`, body);
  return res.data;
}

export async function adminVerifyCleaning(reportId, body) {
  const res = await http.post(`/admin/reports/${reportId}/verify-cleaning`, body);
  return res.data;
}

export async function adminUpdateReportStatus(reportId, body) {
  const res = await http.patch(`/admin/reports/${reportId}/status`, body);
  return res.data;
}

export async function adminDeleteReport(reportId) {
  const res = await http.delete(`/admin/reports/${reportId}`);
  return res.data;
}

export async function adminCreateUser(payload) {
  const res = await http.post('/admin/users', payload);
  return res.data;
}

export async function cleanerUploadAfter(reportId, afterFile) {
  const form = new FormData();
  form.append('after_image', afterFile);
  const res = await http.post(`/cleaner/reports/${reportId}/upload-after`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
