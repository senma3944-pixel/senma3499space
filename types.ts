
export interface ClothItem {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'dresses';
  imageUrl: string;
  description: string;
}

export interface BackgroundOption {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
}

export interface GeneratedResult {
  id: string;
  imageUrl: string;
  timestamp: number;
  prompt: string;
  scene?: string;
}

export enum AppTab {
  TRY_ON = 'TRY_ON',
  DEV_GUIDE = 'DEV_GUIDE'
}
