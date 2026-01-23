const colors = {
  Pending: 'badge gray',
  Verified: 'badge blue',
  Assigned: 'badge orange',
  Cleaned: 'badge purple',
  Approved: 'badge green',
  Completed: 'badge green',
  Rejected: 'badge red',
};

export default function StatusBadge({ status }) {
  return <span className={colors[status] || 'badge gray'}>{status}</span>;
}
