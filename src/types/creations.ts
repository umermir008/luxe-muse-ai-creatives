
import type { Timestamp } from 'firebase/firestore';

export interface Creation {
  id: string; // Firestore document ID
  userId: string; 
  prompt: string; 
  enhancedPrompt?: string; 
  stylePresetName?: string; 
  aspectRatio: string; // Store the label e.g., "Square (1:1)"
  negativePrompt?: string;
  imageUrl: string; // Should be GCS URL
  createdAt: Timestamp | number | Date; // Firestore Timestamp, allow number/Date for client-side before save
  imageWidth: number; 
  imageHeight: number;
  // Optional conceptual fields for advanced AI settings
  creativity?: number;
  detailLevel?: number;
  colorPalette?: string;
}
