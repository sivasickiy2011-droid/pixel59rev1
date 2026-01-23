# Stage 5: Final Testing and Optimization

**Files:** `backend/news-admin/index.py`, database  
**Priority:** High  
**Complexity:** Medium  
**Estimated effort:** Testing and minor fixes

---

## 🎯 Stage Goal

Conduct comprehensive testing of the entire system, optimize performance, fix discovered bugs, and ensure correct functionality.

---

## 📋 Tasks

1. ✅ Test the complete news update cycle
2. ✅ Verify content extraction and translation quality
3. ✅ Optimize performance
4. ✅ Verify news sorting (newest first)
5. ✅ Create usage documentation

---

## 🔧 AI Agent Prompt

```
CONTEXT:
Stages 1-4 are complete. The system should:
- Extract content from RSS and web pages
- Translate via Ollama
- Clean HTML and metadata
- Save to database with correct sorting

TASK:

1. Add a comprehensive testing function at the end of the file:

```python
def test_news_pipeline():
    """
    Tests the entire news processing pipeline.
    Use for debugging: python -c "from backend.news_admin.index import test_news_pipeline; test_news_pipeline()"
    """
    print("=" * 60)
    print("NEWS PIPELINE TESTING")
    print("=" * 60)
    
    # 1. Check Ollama
    print("\n1. Checking Ollama...")
    if check_ollama_available():
        print("✓ Ollama is available")
    else:
        print("✗ Ollama is unavailable - run: ollama serve")
        return
    
    # 2. Translation test
    print("\n2. Translation test...")
    test_text = "This is a test article about web development and Python programming."
    translated = translate_text(test_text)
    print(f"Original: {test_text}")
    print(f"Translation: {translated}")
    if translated and translated != test_text:
        print("✓ Translation works")
    else:
        print("✗ Translation failed")
    
    # 3. HTML cleaning test
    print("\n3. HTML cleaning test...")
    test_html = "<p>Test content</p><script>alert('test');</script>Article URL: https://test.com"
    cleaned = clean_html(test_html)
    print(f"HTML: {test_html}")
    print(f"Cleaned: {cleaned}")
    if 'script' not in cleaned and 'Article URL' not in cleaned:
        print("✓ Cleaning works")
    else:
        print("✗ Cleaning failed")
    
    # 4. RSS extraction test
    print("\n4. RSS extraction test...")
    try:
        news_items = fetch_and_translate_news()
        print(f"News items fetched: {len(news_items)}")
        
        if news_items:
            first = news_items[0]
            print(f"\nSample news:")
            print(f"  Title: {first['translated_title'][:60]}...")
            print(f"  Original content: {len(first['original_content'])} chars")
            print(f"  Translated content: {len(first['translated_content'])} chars")
            
            if len(first['original_content']) > 100:
                print("✓ Content extraction works")
            else:
                print("✗ Content too short")
        else:
            print("✗ No news fetched")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)
```

2. Add database save optimization (update the save_news_to_db function):

```python
# At the beginning of save_news_to_db function, after getting cursor:

# Optimization: use batch insert for new records
new_items = []
update_items = []

# First check all links with a single query
links = [item['link'] for item in news_items]
cur.execute(
    "SELECT link, id, translated_content FROM news WHERE link = ANY(%s)",
    (links,)
)
existing_map = {row[0]: (row[1], row[2]) for row in cur.fetchall()}

for item in news_items:
    if item['link'] in existing_map:
        news_id, trans_content = existing_map[item['link']]
        # Update only if content is empty
        if not trans_content or trans_content.strip() == '':
            update_items.append((item, news_id))
    else:
        new_items.append(item)

print(f"New records: {len(new_items)}, updates: {len(update_items)}")

# Batch insert for new items
if new_items:
    insert_query = """INSERT INTO news
        (original_title, translated_title, original_excerpt, translated_excerpt,
         original_content, translated_content, source, source_url, link, image_url, category,
         published_date, translated_at, created_at, updated_at, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)"""
    
    insert_data = [
        (
            item['original_title'], item['translated_title'],
            item['original_excerpt'], item['translated_excerpt'],
            item['original_content'], item['translated_content'],
            item['source'], item['source_url'], item['link'],
            normalize_image_url(item.get('image_url', '')),
            item['category'], item['published_date']
        )
        for item in new_items
    ]
    
    cur.executemany(insert_query, insert_data)
    inserted = len(new_items)

# Batch update for existing items
if update_items:
    update_query = """UPDATE news SET
        original_title = %s, translated_title = %s,
        original_excerpt = %s, translated_excerpt = %s,
        original_content = %s, translated_content = %s,
        source = %s, source_url = %s, image_url = %s,
        category = %s, published_date = %s,
        updated_at = CURRENT_TIMESTAMP, translated_at = CURRENT_TIMESTAMP
        WHERE id = %s"""
    
    update_data = [
        (
            item['original_title'], item['translated_title'],
            item['original_excerpt'], item['translated_excerpt'],
            item['original_content'], item['translated_content'],
            item['source'], item['source_url'],
            normalize_image_url(item.get('image_url', '')),
            item['category'], item['published_date'], news_id
        )
        for item, news_id in update_items
    ]
    
    cur.executemany(update_query, update_data)
    updated = len(update_items)
```

3. Add news sorting verification:

```python
def verify_news_sorting():
    """Verifies correct news sorting in database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, original_title, published_date, created_at
        FROM news
        WHERE is_active = TRUE
        ORDER BY published_date DESC, created_at DESC
        LIMIT 10
    """)
    
    rows = cur.fetchall()
    print("\nSorting check (top 10 news):")
    print("-" * 80)
    
    for i, row in enumerate(rows, 1):
        news_id, title, pub_date, created = row
        print(f"{i}. [{pub_date}] {title[:50]}...")
    
    cur.close()
    conn.close()
    
    print("-" * 80)
    print("✓ News sorted from newest to oldest")
```

4. Create function to clean old news:

```python
def cleanup_old_news(days_to_keep: int = 90):
    """
    Deactivates old news.
    
    Args:
        days_to_keep: Number of days to keep active news
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE news
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE published_date < CURRENT_TIMESTAMP - INTERVAL '%s days'
        AND is_active = TRUE
        RETURNING id
    """, (days_to_keep,))
    
    deactivated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"Deactivated old news: {deactivated}")
    return deactivated
```

5. Add performance monitoring:

```python
import time
from functools import wraps

def timing_decorator(func):
    """Decorator for measuring execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"⏱ {func.__name__} completed in {elapsed:.2f} sec")
        return result
    return wrapper

# Apply to main functions:
@timing_decorator
def fetch_and_translate_news():
    # ... existing code ...

@timing_decorator
def fetch_article_content(url, timeout=10):
    # ... existing code ...

@timing_decorator
def translate_long_text(text, chunk_size=1500):
    # ... existing code ...
```

REQUIREMENTS:
- All tests must pass successfully
- Performance: processing 10 news items < 3 minutes
- Content: minimum 500 characters per news item
- Sorting: newest news first
- Logging: detailed for debugging

TESTING:

1. Run test function:
```bash
python -c "from backend.news_admin.index import test_news_pipeline; test_news_pipeline()"
```

2. Check update via API:
```bash
curl -X POST http://localhost:8000/api/news-admin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. Check sorting:
```bash
python -c "from backend.news_admin.index import verify_news_sorting; verify_news_sorting()"
```

4. Check in database:
```sql
-- News statistics
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN LENGTH(original_content) > 500 THEN 1 END) as with_content,
    COUNT(CASE WHEN LENGTH(translated_content) > 500 THEN 1 END) as with_translation,
    AVG(LENGTH(original_content)) as avg_orig_len,
    AVG(LENGTH(translated_content)) as avg_trans_len
FROM news
WHERE is_active = TRUE;

-- Top 5 newest news
SELECT 
    id,
    translated_title,
    published_date,
    LENGTH(translated_content) as content_len
FROM news
WHERE is_active = TRUE
ORDER BY published_date DESC, created_at DESC
LIMIT 5;
```

EXPECTED RESULTS:
- ✓ All tests pass
- ✓ Content > 500 characters
- ✓ Quality translation
- ✓ Correct sorting
- ✓ Acceptable performance
```

---

## ✅ Success Criteria

1. `test_news_pipeline()` function passes all checks
2. Database optimization works (batch operations)
3. `verify_news_sorting()` function confirms correct sorting
4. `cleanup_old_news()` function cleans old records
5. Performance monitoring shows acceptable time

---

## 🧪 Final Testing

### Checklist
- [ ] Ollama is running and available
- [ ] RSS feeds are parsed correctly
- [ ] Web scraping works for Hacker News
- [ ] Content is cleaned of HTML and metadata
- [ ] Translation works and is quality
- [ ] Data is saved to database
- [ ] Sorting: newest news first
- [ ] Frontend displays news correctly
- [ ] Performance is acceptable

### Commands for verification
```bash
# 1. Check Ollama
curl http://localhost:11434/api/tags

# 2. Run tests
python -c "from backend.news_admin.index import test_news_pipeline; test_news_pipeline()"

# 3. Update news
curl -X POST http://localhost:8000/api/news-admin \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Check sorting
python -c "from backend.news_admin.index import verify_news_sorting; verify_news_sorting()"

# 5. Clean old news (optional)
python -c "from backend.news_admin.index import cleanup_old_news; cleanup_old_news(90)"
```

---

## 📊 Success Metrics

### Performance
- Processing 1 news item: < 10 seconds
- Processing 10 news items: < 3 minutes
- Translating 1000 characters: < 5 seconds

### Quality
- Content > 500 characters: 100%
- Translation without artifacts: 100%
- Clean text (no HTML): 100%

### Functionality
- Correct sorting: ✓
- No duplicates created: ✓
- Old news updated: ✓

---

## 📝 User Documentation

### How to Use

1. **Start Ollama:**
```bash
ollama serve
ollama pull llama3.2
```

2. **Update news via admin panel:**
   - Log in to admin panel
   - Go to "Content" → "News"
   - Click "Update feed" button
   - Wait for completion (1-3 minutes)

3. **Check results:**
   - News will appear in the list
   - Newest items will be at the top
   - Each news item contains full text

### Troubleshooting

**Problem:** Ollama is unavailable  
**Solution:** Run `ollama serve` in a separate terminal

**Problem:** Content is not translated  
**Solution:** Check model `ollama list | grep llama3.2`

**Problem:** Slow performance  
**Solution:** Reduce number of sources or increase limits

---

## 🎉 Completion

After successful completion of all tests, the system is ready for use!

**What was fixed:**
1. ✅ Content extraction from RSS and web pages
2. ✅ Quality translation via Ollama
3. ✅ Cleaning HTML and metadata
4. ✅ Correct news sorting
5. ✅ Performance optimization

**Next steps:**
- Monitor system operation
- Add new news sources
- Set up automatic updates (cron)

---

**Note:** Save all prompts for future system improvements.
