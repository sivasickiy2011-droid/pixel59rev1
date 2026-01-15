import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

const HostingComparison = () => {
  const [isOpen, setIsOpen] = useState(false);

  const comparisonData = [
    {
      feature: 'Управление',
      virtual: 'Панель управления хостингом',
      vps: 'ISPmanager 6 + Root доступ'
    },
    {
      feature: 'Ресурсы',
      virtual: 'Общие с другими сайтами',
      vps: 'Выделенные (CPU, RAM, диск)'
    },
    {
      feature: 'Производительность',
      virtual: 'Ограничена тарифом',
      vps: 'Высокая, настраиваемая'
    },
    {
      feature: 'Количество сайтов',
      virtual: 'От 1 до безлимита',
      vps: 'Безлимит (зависит от ресурсов)'
    },
    {
      feature: 'Установка ПО',
      virtual: 'Только предустановленное',
      vps: 'Любое ПО с Root правами'
    },
    {
      feature: 'Масштабирование',
      virtual: 'Смена тарифа',
      vps: 'Гибкая настройка ресурсов'
    },
    {
      feature: 'Уровень сложности',
      virtual: 'Простой, для новичков',
      vps: 'Требует технических знаний'
    },
    {
      feature: 'Стоимость',
      virtual: 'От 150 ₽/мес',
      vps: 'От 350 ₽/мес'
    },
    {
      feature: 'Подходит для',
      virtual: 'Малый и средний бизнес',
      vps: 'Средний и крупный бизнес'
    }
  ];

  if (!isOpen) {
    return (
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <Icon name="GitCompare" size={20} />
          Сравнить виртуальный хостинг и VPS
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-8 p-6 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon name="GitCompare" size={24} className="text-primary" />
          <h4 className="text-xl font-bold">Сравнение хостинга</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          <Icon name="X" size={20} />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2">
              <th className="text-left py-3 px-4 font-bold">Параметр</th>
              <th className="text-left py-3 px-4 font-bold text-blue-600">
                <div className="flex items-center gap-2">
                  <Icon name="Layers" size={18} />
                  Виртуальный хостинг
                </div>
              </th>
              <th className="text-left py-3 px-4 font-bold text-purple-600">
                <div className="flex items-center gap-2">
                  <Icon name="Server" size={18} />
                  VPS сервер
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-medium">{row.feature}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.virtual}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.vps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle2" size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-bold text-blue-900 mb-1">Виртуальный хостинг подойдет если:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• У вас небольшой сайт или блог</li>
                <li>• Нет технических знаний</li>
                <li>• Ограниченный бюджет</li>
                <li>• Не требуется особая настройка</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle2" size={20} className="text-purple-600 mt-0.5" />
            <div>
              <h5 className="font-bold text-purple-900 mb-1">VPS подойдет если:</h5>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Высоконагруженный проект</li>
                <li>• Нужен полный контроль</li>
                <li>• Требуется установка своего ПО</li>
                <li>• Планируется рост проекта</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default HostingComparison;
