import { PortfolioProject } from './types';

const UPLOAD_URL = '/pyapi/6f0735b1-7477-4660-b2b0-0b694b4f36ea';

interface UploadImageParams {
  file: File;
  field: 'carousel_image_url' | 'preview_image_url' | 'image_url';
  project: PortfolioProject;
  onChange: (project: PortfolioProject) => void;
  setIsUploading: (uploading: boolean) => void;
}

interface UploadGalleryImageParams {
  file: File;
  project: PortfolioProject;
  galleryImages: string[];
  onChange: (project: PortfolioProject) => void;
  setIsUploading: (uploading: boolean) => void;
}

export const uploadImage = async ({
  file,
  field,
  project,
  onChange,
  setIsUploading,
}: UploadImageParams) => {
  console.log('[PortfolioModal] Starting upload for field:', field);
  console.log('[PortfolioModal] File info:', { name: file.name, size: file.size, type: file.type });
  setIsUploading(true);
  
  try {
    const reader = new FileReader();
    reader.onloadend = async () => {
      console.log('[PortfolioModal] File read complete');
      const base64Full = reader.result as string;
      const base64 = base64Full.split(',')[1];
      console.log('[PortfolioModal] Base64 length:', base64.length);
      
      try {
        console.log('[PortfolioModal] Uploading to:', UPLOAD_URL);
        
        const response = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name, storage_type: 's3', folder: 'portfolio' })
        });
        
        console.log('[PortfolioModal] Response status:', response.status);
        const data = await response.json();
        console.log('[PortfolioModal] Response data:', data);
        
        if (data.url) {
          console.log('[PortfolioModal] Upload success, URL:', data.url);
          onChange({ ...project, [field]: data.url });
        } else {
          console.error('[PortfolioModal] No URL in response');
          alert('Ошибка: сервер не вернул URL');
        }
      } catch (error) {
        console.error('[PortfolioModal] Upload failed:', error);
        alert('Ошибка загрузки изображения');
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('[PortfolioModal] FileReader error:', error);
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('[PortfolioModal] File read error:', error);
    setIsUploading(false);
  }
};

export const uploadGalleryImage = async ({
  file,
  project,
  galleryImages,
  onChange,
  setIsUploading,
}: UploadGalleryImageParams) => {
  if (galleryImages.length >= 5) {
    alert('Максимум 5 изображений в галерее');
    return;
  }
  
  console.log('[PortfolioModal] Starting gallery upload');
  console.log('[PortfolioModal] File info:', { name: file.name, size: file.size, type: file.type });
  setIsUploading(true);
  
  try {
    const reader = new FileReader();
    reader.onloadend = async () => {
      console.log('[PortfolioModal] Gallery file read complete');
      const base64Full = reader.result as string;
      const base64 = base64Full.split(',')[1];
      console.log('[PortfolioModal] Base64 length:', base64.length);
      
      try {
        console.log('[PortfolioModal] Uploading to:', UPLOAD_URL);
        
        const response = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name, storage_type: 's3', folder: 'portfolio' })
        });
        
        console.log('[PortfolioModal] Response status:', response.status);
        const data = await response.json();
        console.log('[PortfolioModal] Response data:', data);
        
        if (data.url) {
          console.log('[PortfolioModal] Gallery upload success, URL:', data.url);
          onChange({ 
            ...project, 
            gallery_images: [...galleryImages, data.url]
          });
        } else {
          console.error('[PortfolioModal] No URL in response');
          alert('Ошибка: сервер не вернул URL');
        }
      } catch (error) {
        console.error('[PortfolioModal] Gallery upload failed:', error);
        alert('Ошибка загрузки изображения');
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('[PortfolioModal] Gallery FileReader error:', error);
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('[PortfolioModal] Gallery file read error:', error);
    setIsUploading(false);
  }
};