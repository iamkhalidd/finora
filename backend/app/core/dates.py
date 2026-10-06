from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status


def month_range(month: Optional[str]) -> tuple[str, datetime, datetime]:
    """Parse "YYYY-MM" into (key, start, end) naive datetimes; end is exclusive.

    Dates are stored as the user's local wall-clock time, so the client should
    always send its own current month. Defaults to the current UTC month.
    """
    if month:
        try:
            start = datetime.strptime(month, "%Y-%m")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="month must be in YYYY-MM format",
            )
    else:
        now = datetime.utcnow()
        start = datetime(now.year, now.month, 1)
    end = datetime(start.year + (start.month == 12), start.month % 12 + 1, 1)
    return start.strftime("%Y-%m"), start, end


def to_naive(dt: Optional[datetime]) -> datetime:
    dt = dt or datetime.utcnow()
    return dt.replace(tzinfo=None) if dt.tzinfo is not None else dt
