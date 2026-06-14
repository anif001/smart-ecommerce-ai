import re

NEGATION_WORDS = {"not", "no", "never", "neither", "nor", "none", "nobody", "nothing", "nowhere",
                   "hardly", "scarcely", "barely", "doesn't", "don't", "didn't", "won't", "wouldn't",
                   "shouldn't", "couldn't", "isn't", "aren't", "wasn't", "weren't", "haven't",
                   "hasn't", "hadn't", "can't", "cannot", "mustn't", "mightn't"}

POSITIVE_WORDS = {
    'love', 'great', 'excellent', 'good', 'best', 'wonderful', 'amazing', 'fantastic', 
    'awesome', 'perfect', 'satisfied', 'happy', 'nice', 'beautiful', 'cool', 'recommend',
    'easy', 'fast', 'high-quality', 'quality', 'superb', 'outstanding', 'glad',
    'helpful', 'efficient', 'reliable', 'sturdy', 'durable', 'value', 'cheap', 'worth'
}

NEGATIVE_WORDS = {
    'hate', 'terrible', 'bad', 'worst', 'horrible', 'awful', 'waste', 'disappointed', 
    'broken', 'useless', 'poor', 'defective', 'slow', 'difficult', 'annoying',
    'returned', 'refund', 'failed', 'issue', 'problem', 'garbage',
    'scam', 'junk', 'wrong', 'missing', 'sucks', 'heavy', 'expensive', 'fail', 'damage'
}

def clean_text(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def analyze_sentiment(text: str) -> dict:
    cleaned = clean_text(text)
    words = cleaned.split()
    if not words:
        return {"sentiment": "NEUTRAL", "confidenceScore": 0.5}

    pos_count = 0
    neg_count = 0
    negate_next = False

    for w in words:
        if w in NEGATION_WORDS:
            negate_next = True
            continue
        if w in POSITIVE_WORDS:
            if negate_next:
                neg_count += 1
            else:
                pos_count += 1
            negate_next = False
        elif w in NEGATIVE_WORDS:
            if negate_next:
                pos_count += 1
            else:
                neg_count += 1
            negate_next = False
        else:
            negate_next = False

    diff = pos_count - neg_count
    total = pos_count + neg_count

    if total == 0:
        return {"sentiment": "NEUTRAL", "confidenceScore": 0.5}

    score = diff / total

    if score > 0.15:
        label = "POSITIVE"
        confidence = 0.5 + (score * 0.5)
    elif score < -0.15:
        label = "NEGATIVE"
        confidence = 0.5 + (abs(score) * 0.5)
    else:
        label = "NEUTRAL"
        confidence = 0.5 + (abs(score) * 0.5)

    return {
        "sentiment": label,
        "confidenceScore": round(min(max(confidence, 0.0), 1.0), 2)
    }
