def summarize_ratings(rating_rows: list[dict]) -> tuple[float, int]:
    ratings = [r["skor_rating"] for r in rating_rows if r.get("skor_rating")]
    total_reviews = len(ratings)
    rating_avg = round(sum(ratings) / total_reviews, 1) if total_reviews > 0 else 0.0
    return rating_avg, total_reviews
