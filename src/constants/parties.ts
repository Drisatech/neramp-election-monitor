export interface InecPoliticalParty {
  id: string;
  code: string;
  name: string;
  color: string;
  logoUrl: string;
  chairman: string;
  secretary: string;
}

// Official Registered Political Parties in Nigeria
// Source: Independent National Electoral Commission (INEC) - https://www.inecnigeria.org/parties
export const OFFICIAL_INEC_PARTIES: InecPoliticalParty[] = [
  {
    id: 'pty-a',
    code: 'A',
    name: 'Accord',
    color: '#f97316',
    logoUrl: '/party-logos/a.jpg',
    chairman: 'Bar. Maxwell Mgbudem',
    secretary: 'Hon. Adebukola Abiola Ajaja',
  },
  {
    id: 'pty-aa',
    code: 'AA',
    name: 'Action Alliance',
    color: '#1d4ed8',
    logoUrl: '/party-logos/aa.jpg',
    chairman: 'Hon. Adekunle Rufai Omoaje',
    secretary: 'Miller C. Orgwu',
  },
  {
    id: 'pty-aac',
    code: 'AAC',
    name: 'African Action Congress',
    color: '#b91c1c',
    logoUrl: '/party-logos/aac.jpg',
    chairman: 'Omoyele Sowore',
    secretary: 'Oshiokhue Philip Ikpeminoghena',
  },
  {
    id: 'pty-adc',
    code: 'ADC',
    name: 'African Democratic Congress',
    color: '#15803d',
    logoUrl: '/party-logos/adc.jpg',
    chairman: 'Sen. David Mark',
    secretary: 'Ogbeni Rauf Aregbesola',
  },
  {
    id: 'pty-adp',
    code: 'ADP',
    name: 'Action Democratic Party',
    color: '#1e3a8a',
    logoUrl: '/party-logos/adp.png',
    chairman: 'Engr. Yabagi Yusuf Sani',
    secretary: 'Victor Fingesi',
  },
  {
    id: 'pty-apc',
    code: 'APC',
    name: 'All Progressives Congress',
    color: '#16a34a',
    logoUrl: '/party-logos/apc.jpg',
    chairman: 'Prof. Nentawe Yilwatda Goshwe',
    secretary: 'Sen. Surajudeen Ajibola Basiru PhD, BL',
  },
  {
    id: 'pty-apga',
    code: 'APGA',
    name: 'All Progressives Grand Alliance',
    color: '#ca8a04',
    logoUrl: '/party-logos/apga.jpg',
    chairman: 'Barrister Sylvester Ezeokenwa',
    secretary: 'Ibrahim Mani',
  },
  {
    id: 'pty-apm',
    code: 'APM',
    name: 'Allied Peoples Movement',
    color: '#7c3aed',
    logoUrl: '/party-logos/apm.jpg',
    chairman: 'Yusuf Mamman Dantalle',
    secretary: 'Oyadeyi Ayodele Adebayo',
  },
  {
    id: 'pty-app',
    code: 'APP',
    name: 'Action Peoples Party',
    color: '#0369a1',
    logoUrl: '/party-logos/app.png',
    chairman: 'Uchenna Nnadi',
    secretary: 'Abu Ibrahim Sossan',
  },
  {
    id: 'pty-bp',
    code: 'BP',
    name: 'Boot Party',
    color: '#0f766e',
    logoUrl: '/party-logos/bp.jpg',
    chairman: 'Adenuga Sunday',
    secretary: 'Egwuatu Maryann .C',
  },
  {
    id: 'pty-dla',
    code: 'DLA',
    name: 'Democratic Leadership Alliance',
    color: '#4338ca',
    logoUrl: '/party-logos/dla.jpg',
    chairman: 'Barr. Samuel M. Memeh',
    secretary: 'Grace E. Obekpa',
  },
  {
    id: 'pty-lp',
    code: 'LP',
    name: 'Labour Party',
    color: '#ea580c',
    logoUrl: '/party-logos/lp.jpg',
    chairman: 'Sen. Nenadi E. Usman',
    secretary: 'Hon. Iheanacho Obioma',
  },
  {
    id: 'pty-ndc',
    code: 'NDC',
    name: 'Nigeria Democratic Congress',
    color: '#047857',
    logoUrl: '/party-logos/ndc.jpeg',
    chairman: 'Sen. Cleopas Moses Zuwoghe',
    secretary: 'Barr. Ikenna Morgan Enekwei',
  },
  {
    id: 'pty-ndp',
    code: 'NDP',
    name: 'National Democratic Party',
    color: '#b45309',
    logoUrl: '/party-logos/ndp.jpg',
    chairman: 'Hon. Ada Elizabeth Fredrick Okwori',
    secretary: 'Mr. Silva Opusunju',
  },
  {
    id: 'pty-nnpp',
    code: 'NNPP',
    name: 'New Nigeria Peoples Party',
    color: '#2563eb',
    logoUrl: '/party-logos/nnpp.jpg',
    chairman: 'Dr. Agbo Gilbert Major',
    secretary: 'Com. Olaposi Sunday Oginni',
  },
  {
    id: 'pty-nrm',
    code: 'NRM',
    name: 'National Rescue Movement',
    color: '#d97706',
    logoUrl: '/party-logos/nrm.png',
    chairman: 'Prince (Dr.) Chinedu Obi',
    secretary: 'Alh. Hassan Aminu Ibrahim',
  },
  {
    id: 'pty-pdp',
    code: 'PDP',
    name: 'Peoples Democratic Party',
    color: '#dc2626',
    logoUrl: '/party-logos/pdp.png',
    chairman: 'Hon. Abdulrahman Mohammed',
    secretary: 'Senator Samuel Anyanwu',
  },
  {
    id: 'pty-prp',
    code: 'PRP',
    name: 'Peoples Redemption Party',
    color: '#991b1b',
    logoUrl: '/party-logos/prp.png',
    chairman: 'Dr. Hakeem Baba-Ahmed',
    secretary: 'Mr. Kanu Sunday Uchenna',
  },
  {
    id: 'pty-sdp',
    code: 'SDP',
    name: 'Social Democratic Party',
    color: '#0891b2',
    logoUrl: '/party-logos/sdp.png',
    chairman: 'Prof. Sadiq Umar Abubakar Gombe',
    secretary: 'Dr. Olu Agunloye',
  },
  {
    id: 'pty-yp',
    code: 'YP',
    name: 'Youth Party',
    color: '#65a30d',
    logoUrl: '/party-logos/yp.png',
    chairman: 'Mr. Abdulraham Abubakar',
    secretary: 'Mrs. Helen Adoh',
  },
  {
    id: 'pty-ypp',
    code: 'YPP',
    name: 'Young Progressives Party',
    color: '#e11d48',
    logoUrl: '/party-logos/ypp.jpeg',
    chairman: 'Comrade Bishop Amakiri',
    secretary: 'Barr. Vidiyeno Bamaiyi',
  },
  {
    id: 'pty-zlp',
    code: 'ZLP',
    name: 'Zenith Labour Party',
    color: '#0d9488',
    logoUrl: '/party-logos/zlp.jpg',
    chairman: 'Chief Dan Nwanyanwu, OFR',
    secretary: 'Yahaya Makama',
  },
];

export function getPartyInfo(codeOrName?: string): InecPoliticalParty | undefined {
  if (!codeOrName) return undefined;
  const normalized = codeOrName.trim().toUpperCase();
  if (normalized === 'ACCORD') {
    return OFFICIAL_INEC_PARTIES.find((p) => p.code === 'A');
  }
  return OFFICIAL_INEC_PARTIES.find(
    (p) => p.code.toUpperCase() === normalized || p.name.toUpperCase() === normalized
  );
}
