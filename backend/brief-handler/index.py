import json
import os
import io
from typing import Dict, Any
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обработка заполненной анкеты - генерация PDF, отправка клиенту и уведомление в Telegram
    Args: event с httpMethod, body с данными анкеты
    Returns: HTTP response
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    headers = event.get('headers', {})
    origin = headers.get('origin', headers.get('Origin', ''))
    referer = headers.get('referer', headers.get('Referer', ''))
    
    allowed_domains = [
        'centerai.tech',
        'www.centerai.tech',
        'centerai-tech.web.app',
        'centerai-tech.firebaseapp.com',
        'localhost'
    ]
    
    is_allowed = False
    for domain in allowed_domains:
        if domain in origin or domain in referer:
            is_allowed = True
            break
    
    if not is_allowed:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Forbidden: Invalid origin'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        
        telegram_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        telegram_chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
        
        pdf_buffer = generate_pdf(body_data)
        
        delivery_success = False
        
        if body_data.get('deliveryMethod') == 'email' and body_data.get('clientEmail'):
            try:
                send_email_with_pdf(
                    to_email=body_data.get('clientEmail'),
                    pdf_buffer=pdf_buffer,
                    brief_data=body_data
                )
                delivery_success = True
            except Exception as email_error:
                print(f'Email sending error: {email_error}')
        
        elif body_data.get('deliveryMethod') == 'telegram' and body_data.get('clientTelegram'):
            try:
                send_telegram_pdf(
                    telegram_username=body_data.get('clientTelegram'),
                    pdf_buffer=pdf_buffer,
                    bot_token=telegram_token
                )
                delivery_success = True
            except Exception as tg_error:
                print(f'Telegram sending error: {tg_error}')
        
        if telegram_token and telegram_chat_id:
            try:
                send_telegram_notification(body_data, telegram_token, telegram_chat_id)
            except Exception as notif_error:
                print(f'Notification error: {notif_error}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True, 
                'message': 'Анкета успешно обработана',
                'delivered': delivery_success
            })
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f'Error: {error_details}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e), 'details': error_details})
        }


def generate_pdf(data: Dict[str, Any]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_LEFT
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=12,
        alignment=TA_LEFT
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        alignment=TA_LEFT
    )
    
    story.append(Paragraph('Анкета на создание сайта', title_style))
    story.append(Paragraph(f'Дата заполнения: {datetime.now().strftime("%d.%m.%Y %H:%M")}', normal_style))
    story.append(Spacer(1, 0.5*cm))
    
    fields = [
        ('Название компании', 'companyName'),
        ('Цель создания сайта', 'goal'),
        ('Желаемые результаты', 'results'),
        ('Область деятельности', 'businessArea'),
        ('Клиенты компании', 'clients'),
        ('Сайты, которые нравятся', 'likeSites'),
        ('Сайты, которые не нравятся', 'dislikeSites'),
        ('Цветовая гамма', 'colorScheme'),
        ('Разделы сайта', 'sections')
    ]
    
    for field_name, field_key in fields:
        value = data.get(field_key, '')
        if value:
            story.append(Paragraph(f'<b>{field_name}:</b>', heading_style))
            story.append(Paragraph(value.replace('\n', '<br/>'), normal_style))
            story.append(Spacer(1, 0.3*cm))
    
    if data.get('designType'):
        design_types = {
            'corporate': 'Строгий корпоративный сайт',
            'corporate-graphics': 'Корпоративный сайт с графическими элементами',
            'graphic': 'Графический сайт (большое количество иллюстраций)',
            'informational': 'Информационный сайт (портальный тип)'
        }
        types_text = ', '.join([design_types.get(t, t) for t in data['designType']])
        story.append(Paragraph('<b>Характер дизайна:</b>', heading_style))
        story.append(Paragraph(types_text, normal_style))
        story.append(Spacer(1, 0.3*cm))
    
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph('—', normal_style))
    story.append(Paragraph('Центр Автоматизации и внедрений', normal_style))
    story.append(Paragraph('Email: ivanickiy@centerai.tech', normal_style))
    story.append(Paragraph('Телефон: +7 (958) 240-00-10', normal_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer


def send_email_with_pdf(to_email: str, pdf_buffer: io.BytesIO, brief_data: Dict[str, Any]) -> None:
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not all([smtp_host, smtp_user, smtp_password]):
        raise ValueError('SMTP credentials not configured')
    
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = 'Ваша заполненная анкета на создание сайта'
    
    body = f'''Здравствуйте, {brief_data.get('companyName', '')}!

Спасибо за заполнение анкеты на создание сайта.

Во вложении вы найдете PDF-копию ваших ответов для вашего удобства.
Мы свяжемся с вами в ближайшее время для обсуждения деталей проекта.

С уважением,
Центр Автоматизации и внедрений
Email: ivanickiy@centerai.tech
Телефон: +7 (958) 240-00-10
'''
    
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    
    pdf_buffer.seek(0)
    pdf_attachment = MIMEApplication(pdf_buffer.read(), _subtype='pdf')
    pdf_attachment.add_header('Content-Disposition', 'attachment', filename='anketa.pdf')
    msg.attach(pdf_attachment)
    
    server = None
    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=30)
        server.set_debuglevel(0)
        server.ehlo()
        if server.has_extn('STARTTLS'):
            server.starttls()
            server.ehlo()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
    except Exception as e:
        print(f'SMTP error details: {str(e)}')
        raise
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass


def send_telegram_pdf(telegram_username: str, pdf_buffer: io.BytesIO, bot_token: str) -> None:
    url = f'https://api.telegram.org/bot{bot_token}/sendDocument'
    
    caption_text = f'''Здравствуйте!

Спасибо за заполнение анкеты на создание сайта.
Во вложении PDF-копия ваших ответов.

Мы свяжемся с вами в ближайшее время!

Центр Автоматизации и внедрений
📧 ivanickiy@centerai.tech
📞 +7 (958) 240-00-10'''
    
    files = {'document': ('anketa.pdf', pdf_buffer.getvalue(), 'application/pdf')}
    data = {
        'chat_id': telegram_username,
        'caption': caption_text
    }
    
    requests.post(url, files=files, data=data)


def send_telegram_notification(brief_data: Dict[str, Any], bot_token: str, chat_id: str) -> None:
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    design_types = {
        'corporate': 'Строгий корпоративный',
        'corporate-graphics': 'Корпоративный с графикой',
        'graphic': 'Графический',
        'informational': 'Информационный'
    }
    
    design_text = ', '.join([design_types.get(t, t) for t in brief_data.get('designType', [])])
    
    delivery_method = 'Email' if brief_data.get('deliveryMethod') == 'email' else 'Telegram'
    contact_info = brief_data.get('clientEmail') if brief_data.get('deliveryMethod') == 'email' else brief_data.get('clientTelegram')
    
    message = f'''🆕 НОВАЯ ЗАЯВКА НА СОЗДАНИЕ САЙТА

📋 Компания: {brief_data.get('companyName', 'Не указано')}

🎯 Цель: {brief_data.get('goal', 'Не указано')[:200]}

💼 Область: {brief_data.get('businessArea', 'Не указано')[:200]}

🎨 Дизайн: {design_text or 'Не выбрано'}

📧 Способ получения: {delivery_method}
📞 Контакт клиента: {contact_info}

⏰ Дата: {datetime.now().strftime("%d.%m.%Y %H:%M")}
'''
    
    data = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    requests.post(url, json=data)