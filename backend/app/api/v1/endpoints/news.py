from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from backend.app.db.session import get_db
from backend.app.api.v1.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.news import NewsBookmark
from backend.app.schemas.news import NewsBookmarkCreate, NewsBookmarkSchema, NewsArticle

router = APIRouter()

MOCK_NEWS_ARTICLES = [
    {
        "id": "1",
        "title": "Fed Signals Interest Rate Pause Amid Cooling Inflation Data",
        "description": "Federal Reserve officials indicate willingness to wait and watch incoming economic indicators as rate pressures soften.",
        "source": "Bloomberg",
        "author": "Sarah Jenkins",
        "url": "https://bloomberg.com/news/fed-signals-pause",
        "image_url": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80",
        "published_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "category": "Economy",
        "body": "The Federal Reserve indicated on Wednesday that it may keep its benchmark interest rate steady at its next meeting, citing cumulative tightening and cooling global markets. Policymakers noted that Treasury yields are dampening economic speed without direct intervention. Analysts believe this signals the completion of the rate-hike campaign, providing significant support to indices and global assets."
    },
    {
        "id": "2",
        "title": "Gold Rebounds to $1,980 on Safe-Haven Demand and Yield Drop",
        "description": "XAUUSD climbs as US bond yields retreat, attracting gold bugs looking for hedge positions.",
        "source": "Reuters",
        "author": "David Vance",
        "url": "https://reuters.com/news/gold-rebounds",
        "image_url": "https://images.unsplash.com/photo-1610375228911-c4abb02f0293?auto=format&fit=crop&w=600&q=80",
        "published_at": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
        "category": "Forex",
        "body": "Gold spot prices regained momentum above $1,980/oz as safe-haven purchasing intensified amidst geopolitical headwinds. Additionally, the drop in US 10-year Treasury yields below 4.5% provided an ideal environment for zero-yield bullion. Technical charts show XAU/USD targeting the major psychological resistance mark of $2,000, as volume remains elevated across institutional desks."
    },
    {
        "id": "3",
        "title": "Crypto Markets Regain Cap After Bitcoin Breaks Above $37,000",
        "description": "Bitcoin leads crypto resurgence with institutional ETF optimism fueling positive sentiment.",
        "source": "CoinDesk",
        "author": "Elena Rostova",
        "url": "https://coindesk.com/bitcoin-breaks-37k",
        "image_url": "https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=600&q=80",
        "published_at": (datetime.utcnow() - timedelta(hours=8)).isoformat(),
        "category": "Crypto",
        "body": "The crypto market cap surged 4% within 24 hours as Bitcoin breached $37,000 for the first time in 18 months. Spot ETF approvals are driving retail and institutional capital expectations. Ethereum also paced the rally, reclaiming $2,000, while several Layer-1 tokens recorded double-digit percentage gains."
    },
    {
        "id": "4",
        "title": "Oil Prices Stabilize After Brief Dip Below $80 per Barrel",
        "description": "Crude bounces back slightly as OPEC members discuss prospective quota reductions.",
        "source": "MarketWatch",
        "author": "Marcus Aurelius",
        "url": "https://marketwatch.com/oil-stabilizes",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
        "published_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "category": "Stocks",
        "body": "Crude oil benchmarks (WTI and Brent) stabilised slightly above critical support levels. The rebound was propelled by market speculation regarding supplementary OPEC+ production trims during the upcoming ministerial convention. Despite increased inventory tallies in North America, supply-side anxieties in eastern corridors continue to backstop crude valuations."
    }
]

@router.get("/", response_model=List[NewsArticle])
async def get_news(
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    if category and category.lower() != "all":
        return [art for art in MOCK_NEWS_ARTICLES if art["category"].lower() == category.lower()]
    return MOCK_NEWS_ARTICLES

@router.get("/bookmarks", response_model=List[NewsBookmarkSchema])
async def get_news_bookmarks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(NewsBookmark).where(NewsBookmark.user_id == current_user.id)
    )
    return result.scalars().all()

@router.post("/bookmarks", response_model=NewsBookmarkSchema)
async def create_news_bookmark(
    bookmark_in: NewsBookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    existing_res = await db.execute(
        select(NewsBookmark).where(
            and_(
                NewsBookmark.user_id == current_user.id,
                NewsBookmark.url == bookmark_in.url
            )
        )
    )
    existing = existing_res.scalar_one_or_none()
    if existing:
        return existing

    dt = bookmark_in.published_at or datetime.utcnow()
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)

    bookmark = NewsBookmark(
        title=bookmark_in.title,
        description=bookmark_in.description,
        source=bookmark_in.source,
        url=bookmark_in.url,
        image_url=bookmark_in.image_url,
        published_at=dt,
        category=bookmark_in.category,
        user_id=current_user.id
    )
    db.add(bookmark)
    await db.flush()
    await db.refresh(bookmark)
    return bookmark

@router.delete("/bookmarks/{id}")
async def delete_news_bookmark(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(NewsBookmark).where(
            and_(NewsBookmark.id == id, NewsBookmark.user_id == current_user.id)
        )
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    await db.execute(delete(NewsBookmark).where(NewsBookmark.id == id))
    return {"detail": "Bookmark deleted successfully"}
