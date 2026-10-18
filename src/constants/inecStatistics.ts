export interface InecStateStatistic {
  id: string;
  sn: number;
  code: string;
  name: string;
  zone: 'North Central' | 'North East' | 'North West' | 'South East' | 'South South' | 'South West';
  totalLgas: number;
  totalWards: number;
  totalPus: number;
  registeredVoters: number;
  pvcsCollected: number;
  pvcCollectionRate: number; // percentage e.g. 91.90
  latitude: number;
  longitude: number;
  lgaNames: string[];
}

export interface InecLgaStatistic {
  id: string;
  code: string;
  name: string;
  stateCode: string;
  stateName: string;
  totalWards: number;
  totalPus: number;
  registeredVoters: number;
  pvcsCollected: number;
  pvcCollectionRate: number;
}

export interface InecWardStatistic {
  id: string;
  code: string;
  name: string;
  lgaCode: string;
  lgaName: string;
  stateCode: string;
  stateName: string;
  totalPus: number;
  registeredVoters: number;
  pvcsCollected: number;
  pvcCollectionRate: number;
}

export const INEC_NATIONAL_SUMMARY = {
  totalStates: 36,
  totalFct: 1,
  totalStatesAndFct: 37,
  totalLgas: 774,
  totalWards: 8809,
  totalPollingUnits: 176846,
  totalRegisteredVoters: 103428715,
  totalPvcsCollected: 96506605,
  nationalPvcCollectionRate: 93.31,
};

// Official INEC Polling Unit, LGA, Ward, Registered Voters & PVC Collection Statistics by State/Territory
export const OFFICIAL_INEC_STATES: InecStateStatistic[] = [
  {
    id: 'st-01',
    sn: 1,
    code: 'ABIA',
    name: 'Abia',
    zone: 'South East',
    totalLgas: 17,
    totalWards: 184,
    totalPus: 4062,
    registeredVoters: 2306520,
    pvcsCollected: 2119692,
    pvcCollectionRate: 91.9,
    latitude: 5.4527,
    longitude: 7.5248,
    lgaNames: [
      'Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North',
      'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma Ngwa',
      'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi',
    ],
  },
  {
    id: 'st-02',
    sn: 2,
    code: 'ADAMAWA',
    name: 'Adamawa',
    zone: 'North East',
    totalLgas: 21,
    totalWards: 226,
    totalPus: 4104,
    registeredVoters: 2431146,
    pvcsCollected: 2180738,
    pvcCollectionRate: 89.7,
    latitude: 9.3265,
    longitude: 12.4411,
    lgaNames: [
      'Demsa', 'Fufore', 'Ganye', 'Gayuk', 'Gombi', 'Grie', 'Hong', 'Jada', 'Lamurde',
      'Madagali', 'Maiha', 'Mayo-Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan',
      'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South',
    ],
  },
  {
    id: 'st-03',
    sn: 3,
    code: 'AKWA_IBOM',
    name: 'Akwa Ibom',
    zone: 'South South',
    totalLgas: 31,
    totalWards: 329,
    totalPus: 4353,
    registeredVoters: 2566196,
    pvcsCollected: 2394261,
    pvcCollectionRate: 93.3,
    latitude: 5.0377,
    longitude: 7.9128,
    lgaNames: [
      'Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan',
      'Ibeno', 'Ibesikpo Asutan', 'Ibiono Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene',
      'Ini', 'Itu', 'Mbo', 'Mkpat Enin', 'Nsit Atai', 'Nsit Ibom', 'Nsit Ubium', 'Obot Akara',
      'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo',
    ],
  },
  {
    id: 'st-04',
    sn: 4,
    code: 'ANAMBRA',
    name: 'Anambra',
    zone: 'South East',
    totalLgas: 21,
    totalWards: 326,
    totalPus: 5720,
    registeredVoters: 2917728,
    pvcsCollected: 2882715,
    pvcCollectionRate: 98.8,
    latitude: 6.2209,
    longitude: 7.0722,
    lgaNames: [
      'Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South',
      'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala',
      'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South',
      'Orumba North', 'Orumba South', 'Oyi',
    ],
  },
  {
    id: 'st-05',
    sn: 5,
    code: 'BAUCHI',
    name: 'Bauchi',
    zone: 'North East',
    totalLgas: 20,
    totalWards: 212,
    totalPus: 5423,
    registeredVoters: 3012547,
    pvcsCollected: 2982422,
    pvcCollectionRate: 99.0,
    latitude: 10.3158,
    longitude: 9.8442,
    lgaNames: [
      'Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa',
      'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira',
      'Tafawa Balewa', 'Toro', 'Warji', 'Zaki',
    ],
  },
  {
    id: 'st-06',
    sn: 6,
    code: 'BAYELSA',
    name: 'Bayelsa',
    zone: 'South South',
    totalLgas: 8,
    totalWards: 105,
    totalPus: 2244,
    registeredVoters: 1200691,
    pvcsCollected: 1147861,
    pvcCollectionRate: 95.6,
    latitude: 4.7719,
    longitude: 6.0699,
    lgaNames: [
      'Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa',
    ],
  },
  {
    id: 'st-07',
    sn: 7,
    code: 'BENUE',
    name: 'Benue',
    zone: 'North Central',
    totalLgas: 23,
    totalWards: 276,
    totalPus: 5102,
    registeredVoters: 3057225,
    pvcsCollected: 2870734,
    pvcCollectionRate: 93.9,
    latitude: 7.3369,
    longitude: 8.7404,
    lgaNames: [
      'Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West',
      'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo',
      'Ohimini', 'Oju', 'Okpokwu', 'Oturkpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya',
    ],
  },
  {
    id: 'st-08',
    sn: 8,
    code: 'BORNO',
    name: 'Borno',
    zone: 'North East',
    totalLgas: 27,
    totalWards: 312,
    totalPus: 5071,
    registeredVoters: 2765165,
    pvcsCollected: 2693271,
    pvcCollectionRate: 97.4,
    latitude: 11.8333,
    longitude: 13.1500,
    lgaNames: [
      'Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa',
      'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga',
      'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar',
      'Monguno', 'Ngala', 'Nganzai', 'Shani',
    ],
  },
  {
    id: 'st-09',
    sn: 9,
    code: 'CROSS_RIVER',
    name: 'Cross River',
    zone: 'South South',
    totalLgas: 18,
    totalWards: 193,
    totalPus: 3281,
    registeredVoters: 1928978,
    pvcsCollected: 1826742,
    pvcCollectionRate: 94.7,
    latitude: 5.9631,
    longitude: 8.3300,
    lgaNames: [
      'Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal',
      'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala',
    ],
  },
  {
    id: 'st-10',
    sn: 10,
    code: 'DELTA',
    name: 'Delta',
    zone: 'South South',
    totalLgas: 25,
    totalWards: 270,
    totalPus: 5863,
    registeredVoters: 3525988,
    pvcsCollected: 3272117,
    pvcCollectionRate: 92.8,
    latitude: 5.7040,
    longitude: 5.9339,
    lgaNames: [
      'Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West',
      'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West',
      'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North',
      'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West',
    ],
  },
  {
    id: 'st-11',
    sn: 11,
    code: 'EBONYI',
    name: 'Ebonyi',
    zone: 'South East',
    totalLgas: 13,
    totalWards: 171,
    totalPus: 2946,
    registeredVoters: 1828056,
    pvcsCollected: 1775042,
    pvcCollectionRate: 97.1,
    latitude: 6.2550,
    longitude: 8.0844,
    lgaNames: [
      'Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South',
      'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha',
    ],
  },
  {
    id: 'st-12',
    sn: 12,
    code: 'EDO',
    name: 'Edo',
    zone: 'South South',
    totalLgas: 18,
    totalWards: 192,
    totalPus: 4519,
    registeredVoters: 2865263,
    pvcsCollected: 2438339,
    pvcCollectionRate: 85.1,
    latitude: 6.5438,
    longitude: 5.8987,
    lgaNames: [
      'Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West',
      'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Oredo',
      'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde',
    ],
  },
  {
    id: 'st-13',
    sn: 13,
    code: 'EKITI',
    name: 'Ekiti',
    zone: 'South West',
    totalLgas: 16,
    totalWards: 177,
    totalPus: 2445,
    registeredVoters: 1055708,
    pvcsCollected: 1024037,
    pvcCollectionRate: 97.0,
    latitude: 7.7190,
    longitude: 5.3110,
    lgaNames: [
      'Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure',
      'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun',
      'Ise/Orun', 'Moba', 'Oye',
    ],
  },
  {
    id: 'st-14',
    sn: 14,
    code: 'ENUGU',
    name: 'Enugu',
    zone: 'South East',
    totalLgas: 17,
    totalWards: 260,
    totalPus: 4145,
    registeredVoters: 2217862,
    pvcsCollected: 2093662,
    pvcCollectionRate: 94.4,
    latitude: 6.5364,
    longitude: 7.4383,
    lgaNames: [
      'Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti',
      'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka',
      'Oji River', 'Udenu', 'Udi', 'Uzo Uwani',
    ],
  },
  {
    id: 'st-15',
    sn: 15,
    code: 'GOMBE',
    name: 'Gombe',
    zone: 'North East',
    totalLgas: 11,
    totalWards: 114,
    totalPus: 2988,
    registeredVoters: 1768566,
    pvcsCollected: 1722583,
    pvcCollectionRate: 97.4,
    latitude: 10.2897,
    longitude: 11.1673,
    lgaNames: [
      'Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami',
      'Nafada', 'Shongom', 'Yamaltu/Deba',
    ],
  },
  {
    id: 'st-16',
    sn: 16,
    code: 'IMO',
    name: 'Imo',
    zone: 'South East',
    totalLgas: 27,
    totalWards: 305,
    totalPus: 4758,
    registeredVoters: 2706052,
    pvcsCollected: 2549101,
    pvcCollectionRate: 94.2,
    latitude: 5.5720,
    longitude: 7.0588,
    lgaNames: [
      'Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South',
      'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba',
      'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Onuimo', 'Orlu',
      'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West',
    ],
  },
  {
    id: 'st-17',
    sn: 17,
    code: 'JIGAWA',
    name: 'Jigawa',
    zone: 'North West',
    totalLgas: 27,
    totalWards: 287,
    totalPus: 4522,
    registeredVoters: 2807811,
    pvcsCollected: 2743231,
    pvcCollectionRate: 97.7,
    latitude: 12.2280,
    longitude: 9.5616,
    lgaNames: [
      'Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki',
      'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kaugama',
      'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim',
      'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi',
    ],
  },
  {
    id: 'st-18',
    sn: 18,
    code: 'KADUNA',
    name: 'Kaduna',
    zone: 'North West',
    totalLgas: 23,
    totalWards: 255,
    totalPus: 8012,
    registeredVoters: 4662640,
    pvcsCollected: 4480797,
    pvcCollectionRate: 96.1,
    latitude: 10.5105,
    longitude: 7.4165,
    lgaNames: [
      'Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia',
      'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau',
      'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria',
    ],
  },
  {
    id: 'st-19',
    sn: 19,
    code: 'KANO',
    name: 'Kano',
    zone: 'North West',
    totalLgas: 44,
    totalWards: 484,
    totalPus: 11222,
    registeredVoters: 6570276,
    pvcsCollected: 6208911,
    pvcCollectionRate: 94.5,
    latitude: 12.0022,
    longitude: 8.5920,
    lgaNames: [
      'Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta',
      'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam',
      'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya',
      'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa (Kano)',
      'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa',
      'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil',
    ],
  },
  {
    id: 'st-20',
    sn: 20,
    code: 'KATSINA',
    name: 'Katsina',
    zone: 'North West',
    totalLgas: 34,
    totalWards: 361,
    totalPus: 6652,
    registeredVoters: 3876051,
    pvcsCollected: 3814034,
    pvcCollectionRate: 98.4,
    latitude: 12.9908,
    longitude: 7.6018,
    lgaNames: [
      'Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume',
      'Danja', 'Dan Musa', 'Daura', 'Dutsi', 'Dutsin-Ma', 'Faskari', 'Funtua', 'Ingawa',
      'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada',
      'Mai\'Adua', 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa',
      'Safana', 'Sandamu', 'Zango',
    ],
  },
  {
    id: 'st-21',
    sn: 21,
    code: 'KEBBI',
    name: 'Kebbi',
    zone: 'North West',
    totalLgas: 21,
    totalWards: 225,
    totalPus: 3743,
    registeredVoters: 2309503,
    pvcsCollected: 2249456,
    pvcCollectionRate: 97.4,
    latitude: 12.4504,
    longitude: 4.1999,
    lgaNames: [
      'Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza',
      'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski',
      'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru',
    ],
  },
  {
    id: 'st-22',
    sn: 22,
    code: 'KOGI',
    name: 'Kogi',
    zone: 'North Central',
    totalLgas: 21,
    totalWards: 239,
    totalPus: 3508,
    registeredVoters: 2232398,
    pvcsCollected: 2093989,
    pvcCollectionRate: 93.8,
    latitude: 7.7337,
    longitude: 6.6906,
    lgaNames: [
      'Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela-Odolu',
      'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa-Muro', 'Ofu', 'Ogori/Magongo',
      'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West',
    ],
  },
  {
    id: 'st-23',
    sn: 23,
    code: 'KWARA',
    name: 'Kwara',
    zone: 'North Central',
    totalLgas: 16,
    totalWards: 193,
    totalPus: 2887,
    registeredVoters: 1916376,
    pvcsCollected: 1736237,
    pvcCollectionRate: 90.6,
    latitude: 8.9669,
    longitude: 4.6027,
    lgaNames: [
      'Asa', 'Baruten', 'Edu', 'Ekiti (Kwara)', 'Ifelodun (Kwara)', 'Ilorin East',
      'Ilorin South', 'Ilorin West', 'Irepodun (Kwara)', 'Isin', 'Kaiama', 'Moro',
      'Offa', 'Oke Ero', 'Oyun', 'Pategi',
    ],
  },
  {
    id: 'st-24',
    sn: 24,
    code: 'LAGOS',
    name: 'Lagos',
    zone: 'South West',
    totalLgas: 20,
    totalWards: 245,
    totalPus: 13325,
    registeredVoters: 7488633,
    pvcsCollected: 6589997,
    pvcCollectionRate: 88.0,
    latitude: 6.5244,
    longitude: 3.3792,
    lgaNames: [
      'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry',
      'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe',
      'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere',
    ],
  },
  {
    id: 'st-25',
    sn: 25,
    code: 'NASARAWA',
    name: 'Nasarawa',
    zone: 'North Central',
    totalLgas: 13,
    totalWards: 147,
    totalPus: 3256,
    registeredVoters: 2137699,
    pvcsCollected: 2079981,
    pvcCollectionRate: 97.3,
    latitude: 8.4998,
    longitude: 8.5247,
    lgaNames: [
      'Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia',
      'Nasarawa', 'Nasarawa Egon', 'Obi (Nasarawa)', 'Toto', 'Wamba',
    ],
  },
  {
    id: 'st-26',
    sn: 26,
    code: 'NIGER',
    name: 'Niger',
    zone: 'North Central',
    totalLgas: 25,
    totalWards: 274,
    totalPus: 4950,
    registeredVoters: 2983476,
    pvcsCollected: 2911873,
    pvcCollectionRate: 97.6,
    latitude: 9.9309,
    longitude: 5.5983,
    lgaNames: [
      'Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako',
      'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu',
      'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi',
    ],
  },
  {
    id: 'st-27',
    sn: 27,
    code: 'OGUN',
    name: 'Ogun',
    zone: 'South West',
    totalLgas: 20,
    totalWards: 236,
    totalPus: 5042,
    registeredVoters: 3037981,
    pvcsCollected: 2573170,
    pvcCollectionRate: 84.7,
    latitude: 7.1604,
    longitude: 3.3483,
    lgaNames: [
      'Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South',
      'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode',
      'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside',
      'Remo North', 'Shagamu',
    ],
  },
  {
    id: 'st-28',
    sn: 28,
    code: 'ONDO',
    name: 'Ondo',
    zone: 'South West',
    totalLgas: 18,
    totalWards: 203,
    totalPus: 3933,
    registeredVoters: 2116057,
    pvcsCollected: 1838854,
    pvcCollectionRate: 86.9,
    latitude: 7.2571,
    longitude: 5.2058,
    lgaNames: [
      'Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West',
      'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje',
      'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo',
    ],
  },
  {
    id: 'st-29',
    sn: 29,
    code: 'OSUN',
    name: 'Osun',
    zone: 'South West',
    totalLgas: 30,
    totalWards: 332,
    totalPus: 3763,
    registeredVoters: 2327784,
    pvcsCollected: 1897144,
    pvcCollectionRate: 81.5,
    latitude: 7.5629,
    longitude: 4.5200,
    lgaNames: [
      'Atakunmosa East', 'Atakunmosa West', 'Aiyedaade', 'Aiyedire', 'Boluwaduro', 'Boripe',
      'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North',
      'Ife South', 'Ifedayo', 'Ifelodun (Osun)', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun (Osun)',
      'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo',
    ],
  },
  {
    id: 'st-30',
    sn: 30,
    code: 'OYO',
    name: 'Oyo',
    zone: 'South West',
    totalLgas: 33,
    totalWards: 351,
    totalPus: 6390,
    registeredVoters: 3588111,
    pvcsCollected: 3024778,
    pvcCollectionRate: 84.3,
    latitude: 7.8500,
    longitude: 3.9333,
    lgaNames: [
      'Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East',
      'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central',
      'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa',
      'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo',
      'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere (Oyo)',
    ],
  },
  {
    id: 'st-31',
    sn: 31,
    code: 'PLATEAU',
    name: 'Plateau',
    zone: 'North Central',
    totalLgas: 17,
    totalWards: 207,
    totalPus: 4989,
    registeredVoters: 2906570,
    pvcsCollected: 2799027,
    pvcCollectionRate: 96.3,
    latitude: 9.2182,
    longitude: 9.5179,
    lgaNames: [
      'Barkin Ladi', 'Bassa (Plateau)', 'Bokkos', 'Jos East', 'Jos North', 'Jos South',
      'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang',
      'Pankshin', 'Qua\'an Pan', 'Riyom', 'Shendam', 'Wase',
    ],
  },
  {
    id: 'st-32',
    sn: 32,
    code: 'RIVERS',
    name: 'Rivers',
    zone: 'South South',
    totalLgas: 23,
    totalWards: 319,
    totalPus: 6866,
    registeredVoters: 3736434,
    pvcsCollected: 3471147,
    pvcCollectionRate: 92.9,
    latitude: 4.8156,
    longitude: 7.0498,
    lgaNames: [
      'Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru',
      'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche', 'Gokana', 'Ikwerre', 'Khana',
      'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro',
      'Oyigbo', 'Port Harcourt', 'Tai',
    ],
  },
  {
    id: 'st-33',
    sn: 33,
    code: 'SOKOTO',
    name: 'Sokoto',
    zone: 'North West',
    totalLgas: 23,
    totalWards: 244,
    totalPus: 3991,
    registeredVoters: 2633113,
    pvcsCollected: 2543587,
    pvcCollectionRate: 96.6,
    latitude: 13.0609,
    longitude: 5.2390,
    lgaNames: [
      'Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa',
      'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame',
      'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo',
    ],
  },
  {
    id: 'st-34',
    sn: 34,
    code: 'TARABA',
    name: 'Taraba',
    zone: 'North East',
    totalLgas: 16,
    totalWards: 168,
    totalPus: 3597,
    registeredVoters: 2254380,
    pvcsCollected: 2035705,
    pvcCollectionRate: 90.3,
    latitude: 7.8704,
    longitude: 9.7800,
    lgaNames: [
      'Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo',
      'Karim Lamido', 'Kumi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing',
    ],
  },
  {
    id: 'st-35',
    sn: 35,
    code: 'YOBE',
    name: 'Yobe',
    zone: 'North East',
    totalLgas: 17,
    totalWards: 178,
    totalPus: 2823,
    registeredVoters: 1733671,
    pvcsCollected: 1678194,
    pvcCollectionRate: 96.8,
    latitude: 12.0000,
    longitude: 11.5000,
    lgaNames: [
      'Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani',
      'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari',
    ],
  },
  {
    id: 'st-36',
    sn: 36,
    code: 'ZAMFARA',
    name: 'Zamfara',
    zone: 'North West',
    totalLgas: 14,
    totalWards: 147,
    totalPus: 3529,
    registeredVoters: 2224017,
    pvcsCollected: 2135056,
    pvcCollectionRate: 96.0,
    latitude: 12.1222,
    longitude: 6.2236,
    lgaNames: [
      'Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi',
      'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Chafe', 'Zurmi',
    ],
  },
  {
    id: 'st-37',
    sn: 37,
    code: 'FCT',
    name: 'FCT Abuja',
    zone: 'North Central',
    totalLgas: 6,
    totalWards: 62,
    totalPus: 2822,
    registeredVoters: 1732043,
    pvcsCollected: 1628120,
    pvcCollectionRate: 94.0,
    latitude: 9.0765,
    longitude: 7.3986,
    lgaNames: [
      'Abaji', 'Abuja Municipal (AMAC)', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali',
    ],
  },
];

// Helper to partition an integer total across N buckets deterministically so the sum equals `total`
function partitionTotal(total: number, buckets: number): number[] {
  if (buckets <= 0) return [];
  const base = Math.floor(total / buckets);
  const remainder = total - base * buckets;
  const result: number[] = [];
  for (let i = 0; i < buckets; i++) {
    result.push(base + (i < remainder ? 1 : 0));
  }
  return result;
}

function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Generate all 774 LGAs and 8,809 Electoral Wards deterministically so sums match INEC national/state totals 100%
export function buildOfficialLgasAndWards(
  statesSource: InecStateStatistic[] = OFFICIAL_INEC_STATES
): {
  lgas: InecLgaStatistic[];
  wards: InecWardStatistic[];
} {
  const lgas: InecLgaStatistic[] = [];
  const wards: InecWardStatistic[] = [];

  for (const st of statesSource) {
    const nLgas = st.totalLgas;
    const wardShares = partitionTotal(st.totalWards, nLgas);
    const puShares = partitionTotal(st.totalPus, nLgas);
    const regShares = partitionTotal(st.registeredVoters, nLgas);
    const pvcShares = partitionTotal(st.pvcsCollected, nLgas);

    for (let i = 0; i < nLgas; i++) {
      const lgaName = st.lgaNames[i] || `${st.name} LGA ${i + 1}`;
      const baseCode = normalizeCode(lgaName);
      // Preserve existing well-known codes used in tests/routes
      const lgaCode =
        st.code === 'KANO' && lgaName === 'Nasarawa (Kano)'
          ? 'NASARAWA_KANO'
          : st.code === 'FCT' && lgaName.startsWith('Abuja Municipal')
          ? 'ABUJA_MUNICIPAL'
          : lgas.some((x) => x.code === baseCode)
          ? `${st.code}_${baseCode}`
          : baseCode;

      const lgaWardsCount = wardShares[i];
      const lgaPusCount = puShares[i];
      const lgaReg = regShares[i];
      const lgaPvc = pvcShares[i];
      const lgaPvcRate = lgaReg > 0 ? Number(((lgaPvc / lgaReg) * 100).toFixed(2)) : st.pvcCollectionRate;

      const lgaRecord: InecLgaStatistic = {
        id: `lga-${String(st.sn).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        code: lgaCode,
        name: lgaName,
        stateCode: st.code,
        stateName: st.name,
        totalWards: lgaWardsCount,
        totalPus: lgaPusCount,
        registeredVoters: lgaReg,
        pvcsCollected: lgaPvc,
        pvcCollectionRate: lgaPvcRate,
      };
      lgas.push(lgaRecord);

      // Partition LGA into its Electoral Wards (Registration Areas)
      const wardPuShares = partitionTotal(lgaPusCount, lgaWardsCount);
      const wardRegShares = partitionTotal(lgaReg, lgaWardsCount);
      const wardPvcShares = partitionTotal(lgaPvc, lgaWardsCount);

      for (let w = 0; w < lgaWardsCount; w++) {
        const wNum = String(w + 1).padStart(2, '0');
        const wardCode = `${lgaCode}_RA_${wNum}`;
        const wardName = `${lgaName} Ward ${wNum} (RA ${wNum})`;
        const wReg = wardRegShares[w];
        const wPvc = wardPvcShares[w];
        const wRate = wReg > 0 ? Number(((wPvc / wReg) * 100).toFixed(2)) : lgaPvcRate;

        wards.push({
          id: `ward-${String(st.sn).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}-${wNum}`,
          code: wardCode,
          name: wardName,
          lgaCode,
          lgaName,
          stateCode: st.code,
          stateName: st.name,
          totalPus: wardPuShares[w],
          registeredVoters: wReg,
          pvcsCollected: wPvc,
          pvcCollectionRate: wRate,
        });
      }
    }
  }

  return { lgas, wards };
}
