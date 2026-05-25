import { KeywordResearchInput, KeywordResearchResult } from '../types';

export interface SEOProvider {
  name: string;
  
  /**
   * Checks if this provider is configured and available (e.g., checks for environment variables)
   */
  isAvailable(): boolean;

  /**
   * Performs the keyword research search
   */
  search(input: KeywordResearchInput): Promise<Partial<KeywordResearchResult>>;
}
