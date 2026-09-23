export const formatCurrency = (amount: number | null | undefined, currency: string = 'USD'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Present';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const calculatePercentageChange = (oldVal: number, newVal: number): string => {
  if (!oldVal || oldVal <= 0) return '+0%';
  const diff = ((newVal - oldVal) / oldVal) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
};

export const getReasonLabel = (reason: string): string => {
  switch (reason) {
    case 'NEW_HIRE':
      return 'Initial Hire';
    case 'ANNUAL_REVIEW':
      return 'Annual Merit Review';
    case 'PROMOTION':
      return 'Promotion';
    case 'MARKET_ADJUSTMENT':
      return 'Market Adjustment';
    case 'EQUITY_REALIGNMENT':
      return 'Equity Realignment';
    case 'LATERAL_MOVE':
      return 'Lateral Move';
    default:
      return reason.replace(/_/g, ' ');
  }
};
