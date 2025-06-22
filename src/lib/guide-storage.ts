// service for handling guide data
export interface GuideData {
  guide: string;
  model: string;
  timestamp: string;
  user: string;
  originalPrompt: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
}

export class GuideStorage {
  private static STORAGE_KEY = 'currentGuide';
  private static SAVED_GUIDES_KEY = 'savedGuides';

  // Store guide data temporarily for viewing
  static storeGuide(data: GuideData): string {
    const guideId = `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        id: guideId,
        data,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));
    }
    
    return guideId;
  }

  static getGuide(): GuideData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const { data, expiresAt } = JSON.parse(stored);
      
      if (Date.now() > expiresAt) {
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to retrieve guide:', error);
      return null;
    }
  }

  static saveGuide(data: GuideData): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const savedGuides = this.getSavedGuides();
      const newGuide = {
        id: Date.now().toString(),
        ...data,
        savedAt: new Date().toISOString()
      };
      
      savedGuides.push(newGuide);
      localStorage.setItem(this.SAVED_GUIDES_KEY, JSON.stringify(savedGuides));
      return true;
    } catch (error) {
      console.error('Failed to save guide:', error);
      return false;
    }
  }

  static getSavedGuides(): Array<GuideData & { id: string; savedAt: string }> {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem(this.SAVED_GUIDES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to get saved guides:', error);
      return [];
    }
  }

  static clearCurrentGuide(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  static estimateTokens(text: string): { input: number; output: number; total: number } {
    const inputTokens = Math.ceil(text.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    
    return {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    };
  }
}
