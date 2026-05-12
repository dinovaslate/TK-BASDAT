export const formatCurrencyIdr = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-US').format(Number(value || 0));

export const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const titleCase = (value) =>
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
    .join(' ');

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const getTierProgress = (member, tiers) => {
  const ordered = [...tiers].sort((left, right) => left.threshold - right.threshold);
  const currentIndex = ordered.findIndex((tier) => tier.name === member.tier);
  const currentTier = ordered[currentIndex] || ordered[0];
  const nextTier = ordered[currentIndex + 1];

  if (!nextTier) {
    return {
      percent: 100,
      currentTier: currentTier?.name || member.tier,
      nextTier: 'Top Tier',
      remaining: 0,
      currentValue: member.tierMiles,
      targetValue: member.tierMiles,
    };
  }

  const progressBase = currentTier.threshold;
  const targetRange = nextTier.threshold - progressBase;
  const currentRangeValue = member.tierMiles - progressBase;
  const percent = Math.max(0, Math.min(100, Math.round((currentRangeValue / targetRange) * 100)));

  return {
    percent,
    currentTier: currentTier.name,
    nextTier: nextTier.name,
    remaining: nextTier.threshold - member.tierMiles,
    currentValue: member.tierMiles,
    targetValue: nextTier.threshold,
  };
};

export const isWithinWarningWindow = (date, days = 14) => {
  if (!date) {
    return false;
  }

  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  const diffDays = diff / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
};
