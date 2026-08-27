export function scoreStyle(score) {
  if (score >= 0.7) return { width: `${score * 100}%`, background: 'rgba(255,71,87,0.9)' };
  if (score >= 0.35) return { width: `${score * 100}%`, background: 'rgba(255,165,2,0.9)' };
  return { width: `${score * 100}%`, background: 'rgba(46,213,115,0.9)' };
}

export function statusBadge(status) {
  if (status === 'Published') return 'status-pill published';
  if (status === 'Draft') return 'status-pill draft';
  if (status === 'Pending') return 'status-pill pending';
  if (status === 'Active') return 'status-pill active';
  if (status === 'Banned') return 'status-pill banned';
  return 'status-pill';
}

export function timeAgo(dateString) {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}