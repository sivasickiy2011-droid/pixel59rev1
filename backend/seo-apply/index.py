import json
import os
from typing import Dict, Any
from pydantic import BaseModel, Field

class SeoApplyRequest(BaseModel):
    page_path: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1, max_length=60)
    description: str = Field(..., min_length=1, max_length=160)
    keywords: list[str] = Field(default_factory=list)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generates updated index.html with applied SEO meta tags
    Args: event with httpMethod, body containing page_path, title, description, keywords
          context with request_id
    Returns: Updated HTML content with new meta tags
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    request_data = SeoApplyRequest(**body_data)
    
    keywords_str = ', '.join(request_data.keywords) if request_data.keywords else ''
    
    html_template = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>{request_data.title}</title>
    <meta name="description" content="{request_data.description}"/>
    <meta name="author" content="Pixel"/>
    <meta name="keywords" content="{keywords_str}"/>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <meta property="og:title" content="{request_data.title}">
    <meta property="og:description" content="{request_data.description}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="{request_data.title}">
    <meta property="og:image" content="https://cdn.poehali.dev/files/5e53ea79-1c81-4c3f-847b-e8a82a5743c2.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{request_data.title}">
    <meta name="twitter:description" content="{request_data.description}">
    <meta name="twitter:image" content="https://cdn.poehali.dev/files/5e53ea79-1c81-4c3f-847b-e8a82a5743c2.png">

    <!-- IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS COMMENT! -->

    <!-- IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS COMMENT! -->
    <script src="https://cdn.poehali.dev/intertnal/js/pp-min-2.js"></script>
    <script src="https://cdn.poehali.dev/intertnal/js/route-min.js"></script>
    <script src="https://cdn.poehali.dev/intertnal/js/telemetry-min.js"></script>
    <!-- IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS COMMENT! -->

    <meta name="pp-name" value="cav-bitrix-portfolio">
      <script src="https://cdn.poehali.dev/intertnal/js/inspector-min.js"></script>
  </head>

<body>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>

<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function (m, e, t, r, i, k, a) {{
        m[i] = m[i] || function () {{
            (m[i].a = m[i].a || []).push(arguments)
        }};
        m[i].l = 1 * new Date();
        for (var j = 0; j < document.scripts.length; j++) {{
            if (document.scripts[j].src === r) {{
                return;
            }}
        }}
        k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
    }})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    ym(101026698, "init", {{
        trustedDomains: ["poehali.dev"],
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
        trackHash: true
    }});
</script>
<noscript>
    <div><img src="https://mc.yandex.ru/watch/101026698" style="position:absolute; left:-9999px;" alt=""/></div>
</noscript>
<!-- /Yandex.Metrika counter -->
</body>
</html>'''
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'html_content': html_template,
            'applied_title': request_data.title,
            'applied_description': request_data.description,
            'applied_keywords': request_data.keywords,
            'request_id': context.request_id
        }),
        'isBase64Encoded': False
    }
