import type { Timestamp } from 'firebase/firestore';

export type VoterTab =
  | 'beranda'
  | 'acara'
  | 'aspirasi'
  | 'referral'
  | 'profil';

export type SuperadminSection =
  | 'acara'
  | 'reward'
  | 'caleg'
  | 'voters'
  | 'aktivitas'
  | 'aspirasi';

export interface VoterDoc {
  uid: string;
  fullName: string;
  address: string;
  region: string;
  phone: string;
  email: string;
  points: number;
  referralCode: string;
  referredBy?: string;
  occupation?: string;
  birthDate?: string;
  lastEventRsvpId?: string;
  authMethod?: 'google' | 'manual';
  createdAt?: Timestamp;
}

export interface ActivityLogDoc {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  activityType: 'LOGIN' | 'REGISTER & LOGIN';
  deviceInfo: string;
  timestamp?: Timestamp;
}

export type EventStatus = 'Akan Datang' | 'Berlangsung' | 'Selesai';

export interface CampaignEventDoc {
  id: string;
  title: string;
  partyName: string;
  region: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  eventDate: string;
  description?: string;
  eventStatus?: EventStatus;
  pointReward: number;
  address: string;
  lat: number;
  lng: number;
  rsvpYes: string[];
  rsvpNo: string[];
  createdByName?: string;
  createdByRole?: string;
  createdAt?: Timestamp;
}

export type RewardIconKey =
  | 'gift'
  | 'shirt'
  | 'package'
  | 'ticket'
  | 'award'
  | 'shopping'
  | 'coffee'
  | 'smartphone';

export interface RewardDoc {
  id: string;
  itemName: string;
  pointCost: number;
  stock: number;
  description: string;
  imageUrl?: string;
  iconKey?: RewardIconKey | string;
  createdAt?: Timestamp;
}

export type RewardClaimStatus =
  | 'MENUNGGU'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'SELESAI'
  | 'DISERAHKAN';

export interface RewardClaimDoc {
  id: string;
  uid: string;
  voterName: string;
  phone: string;
  rewardId: string;
  itemName: string;
  pointUsed: number;
  status: RewardClaimStatus;
  accountType?: 'relawan' | 'voter';
  userRole?: string;
  wilayah?: string;
  processedBy?: string;
  note?: string;
  claimedAt?: Timestamp;
}

export interface AspirationDoc {
  id: string;
  uid: string;
  voterName: string;
  region: string;
  message: string;
  createdAt?: Timestamp;
}

export interface CalegInfoDoc {
  id: string;
  calegName: string;
  partyName: string;
  region: string;
  description: string;
  createdAt?: Timestamp;
}
