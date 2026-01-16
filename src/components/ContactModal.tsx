import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { usePartner } from '@/contexts/PartnerContext';
import { toast } from 'sonner';
import { checkCookieConsent, showConsentMessage } from '@/utils/cookieConsent';
import InputMask from 'react-input-mask';

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const { isPartner, discountPercent } = usePartner();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkCookieConsent()) {
      toast.error('Требуется согласие', {
        description: 'Для отправки заявки необходимо принять согласие на использование cookies'
      });
      showConsentMessage();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/pyapi/003b9991-d7d8-4f5d-8257-dee42fad0f91', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isPartner,
          discount: isPartner ? discountPercent : 0,
          services: ['Обсуждение проекта'],
          total: 0
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        toast.success('Заявка отправлена!', {
          description: 'Мы свяжемся с вами в ближайшее время'
        });
        setTimeout(() => {
          onOpenChange(false);
          setSubmitted(false);
          setFormData({ name: '', phone: '', email: '', message: '' });
        }, 2000);
      } else {
        toast.error('Ошибка отправки', {
          description: 'Попробуйте еще раз'
        });
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      toast.error('Ошибка отправки', {
        description: 'Проверьте интернет-соединение'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Icon name="MessageSquare" size={24} className="text-primary" />
            Обсудить проект
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <Icon name="Check" size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 dark:text-gray-100">Заявка отправлена!</h3>
              <p className="text-muted-foreground dark:text-gray-400">Мы свяжемся с вами в ближайшее время</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isPartner && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
                <Icon name="BadgeCheck" size={20} className="text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-300">
                  Партнерская скидка {discountPercent}% применена
                </span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block dark:text-gray-300">
                Имя <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <Input
                required
                placeholder="Ваше имя"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block dark:text-gray-300">
                Телефон <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <InputMask
                mask="+7 (999) 999-99-99"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              >
                {((inputProps: any) => (
                  <Input
                    {...inputProps}
                    required
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                  />
                )) as any}
              </InputMask>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block dark:text-gray-300">
                Email
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block dark:text-gray-300">
                Сообщение
              </label>
              <Textarea
                placeholder="Расскажите о вашем проекте..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} className="mr-2" />
                  Отправить заявку
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}