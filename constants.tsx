
import { ClothItem, BackgroundOption } from './types';

export const CLOTHING_PRESETS: ClothItem[] = [
  {
    id: '1',
    name: '极简白色 T恤',
    category: 'tops',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400',
    description: '纯棉透气，简约而不简单。'
  },
  {
    id: '2',
    name: '复古丹宁外套',
    category: 'tops',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=400',
    description: '经典水洗色，硬挺有型。'
  },
  {
    id: '3',
    name: '波西米亚连衣裙',
    category: 'dresses',
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=400',
    description: '轻盈飘逸，尽显浪漫风情。'
  },
  {
    id: '4',
    name: '商务深蓝西装',
    category: 'tops',
    imageUrl: 'https://images.unsplash.com/photo-1594932224828-b4b059b6f6f9?auto=format&fit=crop&q=80&w=400',
    description: '专业剪裁，职场精英首选。'
  }
];

export const BACKGROUND_PRESETS: BackgroundOption[] = [
  { id: 'none', name: '原图背景', prompt: '保持原图背景一致', thumbnail: '🖼️' },
  { id: 'studio', name: '极简影棚', prompt: '现代简约的高级灰色影棚背景，柔和灯光', thumbnail: '📸' },
  { id: 'street', name: '时尚街头', prompt: '充满质感的现代都市街头，背景略微虚化', thumbnail: '🏙️' },
  { id: 'nature', name: '自然森林', prompt: '阳光明媚的森林草地背景，光影自然', thumbnail: '🍃' },
  { id: 'office', name: '现代办公', prompt: '明亮的现代办公室或商务中心室内背景', thumbnail: '💼' }
];
