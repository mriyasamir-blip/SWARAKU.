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

export interface CampaignEventDoc {
  id: string;
  title: string;
  partyName: string;
  region: string;
  eventDate: string;
  pointReward: number;
  address: string;
  lat: number;
  lng: number;
  rsvpYes: string[];
  rsvpNo: string[];
  createdAt?: Timestamp;
}

export interface RewardDoc {
  id: string;
  itemName: string;
  pointCost: number;
  stock: number;
  description: string;
  createdAt?: Timestamp;
}

export interface RewardClaimDoc {
  id: string;
  uid: string;
  voterName: string;
  phone: string;
  rewardId: string;
  itemName: string;
  pointUsed: number;
  status: 'MENUNGGU' | 'DISERAHKAN';
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
