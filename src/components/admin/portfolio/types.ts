export interface PortfolioProject {
  id?: number;
  title: string;
  description: string;
  image_url: string;
  carousel_image_url?: string;
  preview_image_url?: string;
  gallery_images?: string[];
  website_url: string;
  display_order: number;
  is_active: boolean;
}