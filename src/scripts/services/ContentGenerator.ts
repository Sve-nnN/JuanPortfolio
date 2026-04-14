import { KeywordData } from '../syncKeywords';

export interface GeneratedContent {
  title: string;
  body: string;
  html: string;
}

export interface ContentGenerator {
  generate(keyword: string, data?: KeywordData): Promise<GeneratedContent>;
}