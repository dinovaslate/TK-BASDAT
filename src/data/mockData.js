export const allianceAirlines = [
  { code: 'NA', name: 'Nusantara Air', domain: '@nusantaraair.com', region: 'Indonesia' },
  { code: 'LS', name: 'LionSky', domain: '@lionsky.com', region: 'Singapore' },
  { code: 'BA', name: 'Bumi Airlines', domain: '@bumiairlines.com', region: 'Malaysia' },
  { code: 'OZ', name: 'Ozi Skies', domain: '@oziskies.com', region: 'Australia' },
  { code: 'SA', name: 'Sakura Airways', domain: '@sakuraairways.com', region: 'Japan' },
];

export const companyDomains = allianceAirlines.map((airline) => airline.domain);

export const mockCredentials = {
  member: {
    email: 'adi.pratama@gmail.com',
    password: 'password123',
  },
  staff: {
    email: 'raka.mahendra@oziskies.com',
    password: 'password123',
  },
};

const currentMember = {
  id: 'member-001',
  salutation: 'Mr',
  firstName: 'Adi',
  middleName: '',
  lastName: 'Pratama',
  email: 'adi.pratama@gmail.com',
  countryCode: '+62',
  mobileNumber: '8123456789',
  dateOfBirth: '1991-08-14',
  nationality: 'Indonesia',
  memberNumber: 'AM-100001',
  joinDate: '2022-03-12',
  tier: 'Gold',
  awardMiles: 18250,
  tierMiles: 38400,
  status: 'Active',
};

const members = [
  currentMember,
  {
    id: 'member-002',
    salutation: 'Ms',
    firstName: 'Maya',
    middleName: '',
    lastName: 'Laras',
    email: 'maya.laras@gmail.com',
    countryCode: '+62',
    mobileNumber: '8139002211',
    dateOfBirth: '1993-02-11',
    nationality: 'Indonesia',
    memberNumber: 'AM-100002',
    joinDate: '2023-07-08',
    tier: 'Silver',
    awardMiles: 9250,
    tierMiles: 17600,
    status: 'Active',
  },
  {
    id: 'member-003',
    salutation: 'Mr',
    firstName: 'Kenji',
    middleName: '',
    lastName: 'Satou',
    email: 'kenji.satou@gmail.com',
    countryCode: '+81',
    mobileNumber: '8091112200',
    dateOfBirth: '1988-11-21',
    nationality: 'Japan',
    memberNumber: 'AM-100003',
    joinDate: '2021-11-19',
    tier: 'Platinum',
    awardMiles: 65200,
    tierMiles: 82100,
    status: 'Active',
  },
  {
    id: 'member-004',
    salutation: 'Mrs',
    firstName: 'Claire',
    middleName: '',
    lastName: 'Owen',
    email: 'claire.owen@gmail.com',
    countryCode: '+61',
    mobileNumber: '412908221',
    dateOfBirth: '1986-04-30',
    nationality: 'Australia',
    memberNumber: 'AM-100004',
    joinDate: '2024-01-05',
    tier: 'Blue',
    awardMiles: 3100,
    tierMiles: 5400,
    status: 'Active',
  },
  {
    id: 'member-005',
    salutation: 'Mr',
    firstName: 'Rizal',
    middleName: 'Dwi',
    lastName: 'Saputra',
    email: 'rizal.saputra@gmail.com',
    countryCode: '+62',
    mobileNumber: '8572220098',
    dateOfBirth: '1996-06-17',
    nationality: 'Indonesia',
    memberNumber: 'AM-100005',
    joinDate: '2023-03-18',
    tier: 'Gold',
    awardMiles: 22340,
    tierMiles: 40610,
    status: 'Suspended',
  },
];

const staff = [
  {
    id: 'staff-001',
    staffId: 'STF-1001',
    salutation: 'Mr',
    firstName: 'Raka',
    middleName: '',
    lastName: 'Mahendra',
    email: 'raka.mahendra@oziskies.com',
    countryCode: '+62',
    mobileNumber: '8118765001',
    dateOfBirth: '1990-01-10',
    nationality: 'Indonesia',
    airline: 'Ozi Skies',
    role: 'Loyalty Operations Lead',
    status: 'Active',
  },
  {
    id: 'staff-002',
    staffId: 'STF-1002',
    salutation: 'Ms',
    firstName: 'Hana',
    middleName: '',
    lastName: 'Kobayashi',
    email: 'hana.kobayashi@sakuraairways.com',
    countryCode: '+81',
    mobileNumber: '805551200',
    dateOfBirth: '1989-09-02',
    nationality: 'Japan',
    airline: 'Sakura Airways',
    role: 'Rewards Manager',
    status: 'Active',
  },
  {
    id: 'staff-003',
    staffId: 'STF-1003',
    salutation: 'Mr',
    firstName: 'Dimas',
    middleName: '',
    lastName: 'Putra',
    email: 'dimas.putra@nusantaraair.com',
    countryCode: '+62',
    mobileNumber: '8782310022',
    dateOfBirth: '1992-12-14',
    nationality: 'Indonesia',
    airline: 'Nusantara Air',
    role: 'Claims Reviewer',
    status: 'Active',
  },
  {
    id: 'staff-004',
    staffId: 'STF-1004',
    salutation: 'Mrs',
    firstName: 'Nadia',
    middleName: '',
    lastName: 'Lee',
    email: 'nadia.lee@lionsky.com',
    countryCode: '+65',
    mobileNumber: '92340112',
    dateOfBirth: '1991-05-26',
    nationality: 'Singapore',
    airline: 'LionSky',
    role: 'Data Steward',
    status: 'Leave',
  },
];

const recentActivity = [
  {
    id: 'activity-001',
    title: 'Flight credited from CGK to SYD',
    meta: 'Ozi Skies OZ611',
    amount: '+2,450 miles',
    date: '2026-04-24',
  },
  {
    id: 'activity-002',
    title: 'Reward redemption completed',
    meta: 'Airport lounge voucher',
    amount: '-6,000 miles',
    date: '2026-04-18',
  },
  {
    id: 'activity-003',
    title: 'Purchased Award Miles',
    meta: '2,000 miles package',
    amount: '+2,000 miles',
    date: '2026-04-12',
  },
  {
    id: 'activity-004',
    title: 'Transfer received',
    meta: 'From member AM-100003',
    amount: '+750 miles',
    date: '2026-04-03',
  },
];

const claims = [
  {
    id: 'CLM-260401',
    memberNumber: 'AM-100001',
    memberName: 'Adi Pratama',
    airline: 'Ozi Skies',
    flightNumber: 'OZ611',
    flightDate: '2026-04-01',
    origin: 'CGK',
    destination: 'SYD',
    cabinClass: 'Business',
    ticketNumber: '0811234567890',
    pnr: 'AB12CD',
    notes: 'Boarding pass attached in email.',
    status: 'Pending Review',
    requestedMiles: 2450,
    submittedAt: '2026-04-02',
  },
  {
    id: 'CLM-260327',
    memberNumber: 'AM-100002',
    memberName: 'Maya Laras',
    airline: 'Sakura Airways',
    flightNumber: 'SA342',
    flightDate: '2026-03-27',
    origin: 'HND',
    destination: 'SIN',
    cabinClass: 'Economy',
    ticketNumber: '1312234567801',
    pnr: 'JK87OP',
    notes: '',
    status: 'More Info Requested',
    requestedMiles: 1280,
    submittedAt: '2026-03-29',
    reviewerNote: 'Please attach e-ticket receipt.',
  },
  {
    id: 'CLM-260310',
    memberNumber: 'AM-100004',
    memberName: 'Claire Owen',
    airline: 'LionSky',
    flightNumber: 'LS901',
    flightDate: '2026-03-10',
    origin: 'MEL',
    destination: 'DPS',
    cabinClass: 'Premium Economy',
    ticketNumber: '2201234567892',
    pnr: 'LM11QA',
    notes: '',
    status: 'Approved',
    requestedMiles: 1640,
    submittedAt: '2026-03-11',
  },
];

const milesPackages = [
  { id: 'pkg-1000', amount: 1000, price: 400000, label: '1,000 Award Miles' },
  { id: 'pkg-2000', amount: 2000, price: 750000, label: '2,000 Award Miles' },
  { id: 'pkg-3000', amount: 3000, price: 1100000, label: '3,000 Award Miles' },
  { id: 'pkg-5000', amount: 5000, price: 1750000, label: '5,000 Award Miles' },
  { id: 'pkg-10000', amount: 10000, price: 3250000, label: '10,000 Award Miles' },
];

const purchases = [
  {
    id: 'PUR-260412-001',
    memberNumber: 'AM-100001',
    packageId: 'pkg-2000',
    packageLabel: '2,000 Award Miles',
    amount: 2000,
    price: 750000,
    status: 'Settled',
    createdAt: '2026-04-12',
  },
];

const transfers = [
  {
    id: 'TRF-260402-001',
    fromMemberNumber: 'AM-100003',
    toMemberNumber: 'AM-100001',
    amount: 750,
    note: 'Trip top-up',
    status: 'Completed',
    createdAt: '2026-04-03',
  },
];

const redemptions = [
  {
    id: 'RED-260418-001',
    memberNumber: 'AM-100001',
    rewardId: 'rwd-001',
    rewardTitle: 'Airport Lounge Voucher',
    milesCost: 6000,
    status: 'Issued',
    createdAt: '2026-04-18',
  },
];

const identities = [
  {
    id: 'id-001',
    type: 'Passport',
    number: 'A12355678',
    issuingCountry: 'Indonesia',
    issueDate: '2021-05-10',
    expiryDate: '2031-05-09',
    lifetime: false,
  },
  {
    id: 'id-002',
    type: 'KTP',
    number: '3174091408910001',
    issuingCountry: 'Indonesia',
    issueDate: '2019-08-15',
    expiryDate: '',
    lifetime: true,
  },
];

const airlines = [
  { id: 'airline-001', code: 'NA', name: 'Nusantara Air', status: 'Active' },
  { id: 'airline-002', code: 'LS', name: 'LionSky', status: 'Active' },
  { id: 'airline-003', code: 'BA', name: 'Bumi Airlines', status: 'Active' },
  { id: 'airline-004', code: 'OZ', name: 'Ozi Skies', status: 'Active' },
  { id: 'airline-005', code: 'SA', name: 'Sakura Airways', status: 'Active' },
];

const airports = [
  { id: 'airport-001', code: 'CGK', city: 'Jakarta', country: 'Indonesia' },
  { id: 'airport-002', code: 'DPS', city: 'Denpasar', country: 'Indonesia' },
  { id: 'airport-003', code: 'SIN', city: 'Singapore', country: 'Singapore' },
  { id: 'airport-004', code: 'HND', city: 'Tokyo', country: 'Japan' },
  { id: 'airport-005', code: 'SYD', city: 'Sydney', country: 'Australia' },
  { id: 'airport-006', code: 'MEL', city: 'Melbourne', country: 'Australia' },
];

const tiers = [
  { id: 'tier-001', name: 'Blue', threshold: 0, perks: 'Alliance starter benefits' },
  { id: 'tier-002', name: 'Silver', threshold: 15000, perks: 'Priority check-in' },
  { id: 'tier-003', name: 'Gold', threshold: 30000, perks: 'Lounge access and extra baggage' },
  { id: 'tier-004', name: 'Platinum', threshold: 50000, perks: 'Fast-track and concierge support' },
];

const partners = [
  { id: 'partner-001', name: 'SkyLounge Group', type: 'Airport Services', status: 'Active' },
  { id: 'partner-002', name: 'StayVista Hotels', type: 'Hospitality', status: 'Active' },
  { id: 'partner-003', name: 'RideFlow', type: 'Transport', status: 'Inactive' },
];

const rewards = [
  {
    id: 'rwd-001',
    title: 'Airport Lounge Voucher',
    category: 'Airport',
    partner: 'SkyLounge Group',
    milesCost: 6000,
    status: 'Active',
    activeFrom: '2026-01-01',
    activeTo: '2026-12-31',
    description: 'Single-use lounge access across AeroTeams hub airports.',
  },
  {
    id: 'rwd-002',
    title: 'Domestic Upgrade Certificate',
    category: 'Flight',
    partner: 'Nusantara Air',
    milesCost: 12500,
    status: 'Active',
    activeFrom: '2026-02-15',
    activeTo: '2026-11-30',
    description: 'Upgrade one eligible domestic segment to Business Class.',
  },
  {
    id: 'rwd-003',
    title: 'Hotel Weekend Stay',
    category: 'Hotel',
    partner: 'StayVista Hotels',
    milesCost: 24000,
    status: 'Active',
    activeFrom: '2026-05-05',
    activeTo: '2026-06-05',
    description: 'Redeem a two-night stay in selected city hotels.',
  },
  {
    id: 'rwd-004',
    title: 'Premium Chauffeur Transfer',
    category: 'Ground Transport',
    partner: 'RideFlow',
    milesCost: 30000,
    status: 'Draft',
    activeFrom: '2026-05-15',
    activeTo: '2026-05-22',
    description: 'One-way premium airport transfer in major cities.',
  },
];

const operationalQueue = [
  { id: 'queue-001', title: 'Claims pending review', value: 7, detail: '2 urgent flights older than 10 days' },
  { id: 'queue-002', title: 'Reward inventory warnings', value: 3, detail: 'Hotel allotment expires this week' },
  { id: 'queue-003', title: 'Identity verification backlog', value: 5, detail: 'KYC review due before tier upgrades' },
];

const airlinePerformance = [
  { airline: 'Nusantara Air', onTime: '91%', claims: 11, satisfaction: '4.8/5' },
  { airline: 'LionSky', onTime: '88%', claims: 9, satisfaction: '4.6/5' },
  { airline: 'Bumi Airlines', onTime: '89%', claims: 5, satisfaction: '4.5/5' },
  { airline: 'Ozi Skies', onTime: '94%', claims: 6, satisfaction: '4.9/5' },
  { airline: 'Sakura Airways', onTime: '93%', claims: 4, satisfaction: '4.9/5' },
];

const reportData = {
  memberGrowth: [
    { month: 'Jan', value: 120 },
    { month: 'Feb', value: 148 },
    { month: 'Mar', value: 164 },
    { month: 'Apr', value: 182 },
    { month: 'May', value: 196 },
    { month: 'Jun', value: 214 },
  ],
  tierDistribution: [
    { label: 'Blue', value: 44 },
    { label: 'Silver', value: 26 },
    { label: 'Gold', value: 19 },
    { label: 'Platinum', value: 11 },
  ],
  milesFlow: { issued: 1420000, redeemed: 938000 },
  claimsSummary: { approved: 84, rejected: 16 },
  purchaseRevenue: [
    { month: 'Jan', value: 48000000 },
    { month: 'Feb', value: 53000000 },
    { month: 'Mar', value: 61000000 },
    { month: 'Apr', value: 68000000 },
  ],
  topRewards: [
    { label: 'Airport Lounge Voucher', value: 44 },
    { label: 'Domestic Upgrade Certificate', value: 28 },
    { label: 'Hotel Weekend Stay', value: 19 },
  ],
};

const baseState = {
  session: null,
  currentMember,
  recentActivity,
  claims,
  purchases,
  transfers,
  redemptions,
  identities,
  members,
  staff,
  masterData: {
    airlines,
    airports,
    tiers,
    milesPackages,
  },
  partners,
  rewards,
  operationalQueue,
  airlinePerformance,
  reportData,
};

export const cloneData = (value) => JSON.parse(JSON.stringify(value));

export const createInitialState = () => cloneData(baseState);
