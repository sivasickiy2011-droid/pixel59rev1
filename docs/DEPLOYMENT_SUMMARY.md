# ✅ Развёртывание завершено

## Сервер
- IP: 172.16.57.77
- OS: CentOS Stream 9
- SELinux: Permissive

## Сервисы
- ✅ Node.js API (PM2, порт 3001)
- ✅ Python Gatevey (PM2, порт 3002)
- ✅ PostgreSQL (порт 5432)
- ✅ Nginx (порт 80)

## URLs
- Frontend: http://172.16.57.77
- API: http://172.16.57.77/api/portfolio
- Health: http://172.16.57.77/api/health

## Команды
```bash
pm2 list
pm2 logs api
pm2 logs gatevey
./deploy.sh
