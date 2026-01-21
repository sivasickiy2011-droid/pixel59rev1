import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { usePartner } from '@/contexts/PartnerContext';
import { checkCookieConsent, showConsentMessage } from '@/utils/cookieConsent';
import { toast } from 'sonner';
import InputMask from 'react-input-mask';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  services: string[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU').format(price);
};

export default function OrderModal({ isOpen, onClose, total, services }: OrderModalProps) {
  const { isPartner, discountPercent } = usePartner();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkCookieConsent()) {
      toast.error('Требуется согласие', {
        description: 'Для отправки заявки необходимо принять согласие на использование cookies'
      });
      showConsentMessage();
      return;
    }

    if (honeypot) {
      setError('Подозрительное поведение обнаружено, заявка не отправлена');
      return;
    }

    if (captchaValue.trim() !== '7') {
      setError('Неверный ответ на капчу');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/4dbcd084-f89e-4737-be41-9371059c6e4d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total,
          services,
          isPartner,
          discount: isPartner ? discountPercent : 0,
          name,
          phone,
          email,
          captcha: captchaValue,
          botField: honeypot,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setName('');
          setPhone('');
          setEmail('');
        }, 3000);
      } else {
        setError('Ошибка при отправке заявки. Попробуйте позже.');
      }
    } catch (err) {
      setError('Ошибка соединения. Проверьте интернет и попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError('');
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="CheckCircle2" size={32} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Заявка отправлена!</h3>
            <p className="text-muted-foreground">
              Мы свяжемся с вами в ближайшее время
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Send" size={24} />
            Отправить заявку
          </DialogTitle>
          <DialogDescription>
            Заполните форму, и мы свяжемся с вами для уточнения деталей
          </DialogDescription>
        </DialogHeader>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Предварительная стоимость:</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(total)} ₽</span>
          </div>
          {isPartner && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Icon name="Percent" size={14} />
              <span>С учётом партнёрской скидки {discountPercent}%</span>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Выбранные услуги:</p>
            <div className="space-y-1">
              {services.map((service, idx) => (
                <div key={idx} className="text-sm flex items-start gap-2">
                  <Icon name="Check" size={14} className="text-primary mt-0.5" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ваше имя *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Иван Иванов"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон *</Label>
            <InputMask
              mask="+7 (999) 999-99-99"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            >
              {((inputProps: any) => (
                <Input
                  {...inputProps}
                  id="phone"
                  type="tel"
                  placeholder="+7 900 123-45-67"
                  required
                />
              )) as any}
            </InputMask>
          </div>

          <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@mail.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="captcha">Сколько будет 3 + 4? *</Label>
          <Input
            id="captcha"
            value={captchaValue}
            onChange={(e) => setCaptchaValue(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Введите ответ"
          />
        </div>

        <div className="hidden">
          <Input
            name="botField"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            aria-hidden="true"
            tabIndex={-1}
          />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <Icon name="AlertCircle" size={16} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
