import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface AnalyticsSettings {
  google_analytics_id: string;
  yandex_metrika_id: string;
  yandex_webmaster_user_id: string;
  ai_seo_enabled: boolean;
}

interface SeoTabProps {
  settings: AnalyticsSettings;
  setSettings: (settings: AnalyticsSettings) => void;
}

interface SeoAnalysisResult {
  title: string;
  description: string;
  h1_suggestions: string[];
  keywords: string[];
  improvements: string[];
}

export default function SeoTab({ settings: _settings, setSettings: _setSettings }: SeoTabProps) {
  // Фиктивное использование для удовлетворения TypeScript
  void _settings;
  void _setSettings;
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SeoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');

  useEffect(() => {
    const loadPublicPageContent = async () => {
      const publicUrl = window.location.origin;
      setPageUrl(publicUrl);

      try {
        const response = await fetch('/index.html');
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const metaTitle = doc.querySelector('title')?.textContent || '';
        const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        setCurrentTitle(metaTitle);
        setCurrentDescription(metaDescription);

        const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
        const contentSummary = `${metaDescription} Ключевые слова: ${keywords}`.trim();
        
        setPageContent(contentSummary || 'Веб-студия по разработке и продвижению сайтов. Современный дизайн, адаптивная вёрстка, SEO-оптимизация.');
      } catch (error) {
        console.error('Failed to load index.html:', error);
        setPageContent('Веб-студия по разработке и продвижению сайтов. Современный дизайн, адаптивная вёрстка, SEO-оптимизация.');
      }
    };

    loadPublicPageContent();
  }, []);

  const analyzePage = async () => {
    if (!pageUrl || !pageContent) {
      setError('Заполните URL и содержимое страницы');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/7127ce9f-37a5-4bde-97f7-12edc35f6ab5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pageUrl,
          content: pageContent,
          current_title: currentTitle,
          current_description: currentDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Ошибка анализа';
        
        if (errorMsg.includes('Country') || errorMsg.includes('not supported')) {
          throw new Error('Для работы необходим OpenAI API ключ. Добавьте OPENAI_API_KEY в Secrets проекта. Получить ключ можно на https://platform.openai.com/api-keys');
        }
        
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      
      if (errorMessage.includes('OpenAI API')) {
        console.log('🔑 Чтобы добавить OpenAI API ключ, откройте: https://editor.poehali.dev/secrets');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const applySeoToPage = async () => {
    if (!analysisResult) return;

    setApplying(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/23efbca4-f3c3-48b8-afb7-a2e528bf68f9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_path: pageUrl,
          title: analysisResult.title,
          description: analysisResult.description,
          keywords: analysisResult.keywords
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка применения');
      }

      const data = await response.json();
      
      const blob = new Blob([data.html_content], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('SEO применено! Файл index.html скачан. Замените им текущий файл в корне проекта.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setApplying(false);
    }
  };

  return (
    <TabsContent value="seo" className="space-y-6 mt-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="Sparkles" size={24} />
            ИИ SEO-анализатор
          </CardTitle>
          <CardDescription className="text-gray-400">
            Получите рекомендации по оптимизации страниц для поисковых систем
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Icon name="Lightbulb" size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-1">Автозаполнение</p>
              <p>Поля заполнились автоматически данными текущей страницы. Отредактируйте их при необходимости и нажмите "Анализировать".</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="pageUrl" className="text-gray-300 flex items-center gap-2 mb-2">
                <Icon name="Link" size={16} />
                URL страницы
              </Label>
              <Input
                id="pageUrl"
                placeholder="https://example.com/about"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentTitle" className="text-gray-300 mb-2 block">
                  Текущий Title (опционально)
                </Label>
                <Input
                  id="currentTitle"
                  placeholder="Текущий заголовок страницы"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="currentDescription" className="text-gray-300 mb-2 block">
                  Текущее Description (опционально)
                </Label>
                <Input
                  id="currentDescription"
                  placeholder="Текущее описание"
                  value={currentDescription}
                  onChange={(e) => setCurrentDescription(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pageContent" className="text-gray-300 flex items-center gap-2 mb-2">
                <Icon name="FileText" size={16} />
                Содержимое страницы
              </Label>
              <Textarea
                id="pageContent"
                placeholder="Вставьте текст страницы для анализа..."
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white min-h-[150px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Скопируйте основной текст страницы для анализа (до 3000 символов)
              </p>
            </div>

            <Button
              onClick={analyzePage}
              disabled={analyzing || !pageUrl || !pageContent}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {analyzing ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" size={16} className="mr-2" />
                  Анализировать страницу
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="AlertCircle" size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400 mb-1">Ошибка</p>
                  <p className="text-sm text-gray-300 mb-3">{error}</p>
                  {error.includes('OpenAI API') && (
                    <Button
                      onClick={() => window.open('https://editor.poehali.dev/secrets', '_blank')}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Icon name="Key" size={14} className="mr-2" />
                      Добавить OpenAI API ключ
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="CheckCircle" size={24} className="text-green-400" />
                <h3 className="text-lg font-semibold text-white">Результаты анализа</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-green-300 text-sm mb-1 block">Оптимизированный Title</Label>
                  <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                    <p className="text-white">{analysisResult.title}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-green-300 text-sm mb-1 block">Оптимизированное Description</Label>
                  <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                    <p className="text-white">{analysisResult.description}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-green-300 text-sm mb-2 block">Рекомендации по заголовкам H1</Label>
                  <ul className="space-y-2">
                    {analysisResult.h1_suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 bg-gray-900/50 rounded border border-gray-700">
                        <Icon name="Hash" size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="text-green-300 text-sm mb-2 block">Ключевые слова</Label>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-green-300 text-sm mb-2 block">Рекомендации по улучшению</Label>
                  <ul className="space-y-2">
                    {analysisResult.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-3 bg-gray-900/50 rounded border border-gray-700">
                        <Icon name="Lightbulb" size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white text-sm">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={applySeoToPage}
                  disabled={applying}
                  className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                >
                  {applying ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Применяю...
                    </>
                  ) : (
                    <>
                      <Icon name="Download" size={16} className="mr-2" />
                      Применить SEO и скачать index.html
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="CheckCircle" size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-400">Успешно!</p>
                  <p className="text-sm text-gray-300 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}