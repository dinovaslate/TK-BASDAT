import { companyDomains, mockCredentials } from '../data/mockData';

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

export const isCompanyEmail = (value) => companyDomains.some((domain) => String(value || '').toLowerCase().endsWith(domain));

export const validateLogin = ({ role, email, password }) => {
  const errors = {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  } else if (role === 'staff' && !isCompanyEmail(normalizedEmail)) {
    errors.email = 'Staff login requires an approved company airline email.';
  }

  if (!String(password || '').trim()) {
    errors.password = 'Password is required.';
  }

  return errors;
};

export const validateCredentials = ({ role, email, password }) => {
  const expected = mockCredentials[role];
  if (!expected) {
    return 'Invalid role.';
  }

  if (email.trim().toLowerCase() !== expected.email || password !== expected.password) {
    return 'The email or password is incorrect.';
  }

  return '';
};

export const validateClaim = (values) => {
  const errors = {};
  const requiredFields = {
    airline: 'Airline is required.',
    flightNumber: 'Flight number is required.',
    flightDate: 'Flight date is required.',
    origin: 'Origin airport is required.',
    destination: 'Destination airport is required.',
    cabinClass: 'Cabin class is required.',
    ticketNumber: 'Ticket number is required.',
    pnr: 'PNR is required.',
  };

  Object.entries(requiredFields).forEach(([key, message]) => {
    if (!String(values[key] || '').trim()) {
      errors[key] = message;
    }
  });

  if (values.flightDate) {
    const selectedDate = new Date(values.flightDate);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    if (selectedDate < cutoff) {
      errors.flightDate = 'Flight date must be within the last 6 months.';
    }
  }

  if (
    values.origin &&
    values.destination &&
    String(values.origin).trim().toUpperCase() === String(values.destination).trim().toUpperCase()
  ) {
    errors.destination = 'Origin and destination cannot be the same.';
  }

  return errors;
};

export const validateTransfer = (values, currentMember) => {
  const errors = {};
  const recipient = String(values.recipientMemberNumber || '').trim().toUpperCase();
  const amount = Number(values.amount);

  if (!recipient) {
    errors.recipientMemberNumber = 'Recipient member number is required.';
  } else if (recipient === String(currentMember.memberNumber).toUpperCase()) {
    errors.recipientMemberNumber = 'You cannot transfer miles to yourself.';
  }

  if (!values.amount) {
    errors.amount = 'Transfer amount is required.';
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Transfer amount must be greater than 0.';
  } else if (amount > Number(currentMember.awardMiles)) {
    errors.amount = 'Transfer amount cannot exceed your Award Miles balance.';
  }

  return errors;
};

export const validateIdentity = (values) => {
  const errors = {};

  if (!String(values.type || '').trim()) {
    errors.type = 'Identity type is required.';
  }
  if (!String(values.number || '').trim()) {
    errors.number = 'Identity number is required.';
  }
  if (!String(values.issuingCountry || '').trim()) {
    errors.issuingCountry = 'Issuing country is required.';
  }
  if (!String(values.issueDate || '').trim()) {
    errors.issueDate = 'Issue date is required.';
  }
  if (!values.lifetime && !String(values.expiryDate || '').trim()) {
    errors.expiryDate = 'Expiry date is required unless lifetime KTP is selected.';
  }

  return errors;
};

const fullName = (values) =>
  [values.firstName, values.middleName, values.lastName].map((item) => String(item || '').trim()).filter(Boolean).join(' ');

export const validateMember = (values, members, editingId) => {
  const errors = {};
  const email = String(values.email || '').trim().toLowerCase();
  const memberNumber = String(values.memberNumber || '').trim().toUpperCase();
  const duplicate = members.find(
    (member) => member.memberNumber.toUpperCase() === memberNumber && member.id !== editingId
  );

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!memberNumber) {
    errors.memberNumber = 'Member number is required.';
  } else if (duplicate) {
    errors.memberNumber = 'Member number must be unique.';
  }

  if (!fullName(values)) {
    errors.firstName = 'Full name is required.';
  }

  if (!String(values.tier || '').trim()) {
    errors.tier = 'Tier is required.';
  }

  if (!String(values.status || '').trim()) {
    errors.status = 'Status is required.';
  }

  return errors;
};

export const validateStaff = (values, staff, editingId) => {
  const errors = {};
  const email = String(values.email || '').trim().toLowerCase();
  const staffId = String(values.staffId || '').trim().toUpperCase();
  const duplicate = staff.find((item) => item.staffId.toUpperCase() === staffId && item.id !== editingId);

  if (!staffId) {
    errors.staffId = 'Staff ID is required.';
  } else if (duplicate) {
    errors.staffId = 'Staff ID must be unique.';
  }

  if (!email) {
    errors.email = 'Company email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  } else if (!isCompanyEmail(email)) {
    errors.email = `Company email must use one of these domains: ${companyDomains.join(', ')}.`;
  }

  if (!String(values.airline || '').trim()) {
    errors.airline = 'Airline is required.';
  }

  if (!String(values.role || '').trim()) {
    errors.role = 'Role is required.';
  }

  return errors;
};

export const validateRejectReason = (reason) => {
  if (!String(reason || '').trim()) {
    return 'Reject reason is required.';
  }
  return '';
};

export const validateMasterItem = (section, values, items, editingId) => {
  const errors = {};
  const keyMap = {
    airlines: ['code', 'name'],
    airports: ['code', 'city', 'country'],
    tiers: ['name', 'threshold'],
    milesPackages: ['amount', 'price'],
  };
  const required = keyMap[section] || [];

  required.forEach((key) => {
    if (!String(values[key] ?? '').trim()) {
      errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required.`;
    }
  });

  if (section === 'airlines' || section === 'airports') {
    const duplicateCode = items.find(
      (item) => String(item.code || '').toUpperCase() === String(values.code || '').trim().toUpperCase() && item.id !== editingId
    );
    if (duplicateCode) {
      errors.code = 'Code must be unique.';
    }
  }

  return errors;
};

export const validatePartner = (values) => {
  const errors = {};
  ['name', 'type', 'status'].forEach((key) => {
    if (!String(values[key] || '').trim()) {
      errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required.`;
    }
  });
  return errors;
};

export const validateReward = (values) => {
  const errors = {};
  ['title', 'category', 'partner', 'milesCost', 'status', 'activeFrom', 'activeTo'].forEach((key) => {
    if (!String(values[key] || '').trim()) {
      errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required.`;
    }
  });
  if (values.activeFrom && values.activeTo && new Date(values.activeFrom) > new Date(values.activeTo)) {
    errors.activeTo = 'Active to date must be after active from date.';
  }
  return errors;
};
