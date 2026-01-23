export interface NewsItem {
  id?: number;
  original_title: string;
  translated_title: string;
  original_excerpt: string;
  translated_excerpt: string;
  original_content: string;
  translated_content: string;
  source: string;
  source_url: string;
  link: string;
  image_url: string;
  category: string;
  published_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

