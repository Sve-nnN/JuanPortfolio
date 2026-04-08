import { KeywordData } from '../seo/keyword-utils';

export interface GeneratedContent {
  title: string;
  body: string;
  html: string;
}

export interface ContentGenerator {
  generate(keyword: string, data?: KeywordData): Promise<GeneratedContent>;
}