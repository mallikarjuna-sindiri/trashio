from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse
from urllib.request import urlopen

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from PIL import Image, ImageChops, ImageFilter, ImageStat


app = FastAPI(title="Trashio AI Service", version="0.1.0")


Decision = Literal["approve", "reject"]
VerificationDecision = Literal["accept", "reclean", "reject"]
Priority = Literal["Low", "Medium", "High"]


class BeforeAnalyzeRequest(BaseModel):
    report_id: str
    image_path: str | None = None
    image_url: str | None = None
    lat: float | None = None
    lng: float | None = None


class BeforeAnalyzeResponse(BaseModel):
    decision: Decision
    trash_present: bool
    severity: float
    priority: Priority
    confidence: float
    reason: str | None = None
    image_hash: str | None = None
    flags: list[str] = Field(default_factory=list)
    model_version: str = "heuristic-v1"


class AfterAnalyzeRequest(BaseModel):
    report_id: str
    before_image_path: str | None = None
    after_image_path: str | None = None
    before_image_url: str | None = None
    after_image_url: str | None = None


class AfterAnalyzeResponse(BaseModel):
    decision: VerificationDecision
    cleaned: bool
    confidence: float
    before_image_hash: str | None = None
    after_image_hash: str | None = None
    diff_score: float
    after_trash_score: float
    flags: list[str] = Field(default_factory=list)
    model_version: str = "heuristic-v1"


@dataclass
class ImageScores:
    trash_score: float
    edge_mean: float
    grayscale_std: float


def _load_image(image_path: str | None, image_url: str | None) -> Image.Image:
    if image_path:
        path = Path(image_path)
        if not path.exists():
            raise HTTPException(status_code=404, detail="Image path not found")
        return Image.open(path)
    if image_url:
        parsed = urlparse(image_url)
        if parsed.scheme not in {"http", "https"}:
            raise HTTPException(status_code=400, detail="Only http/https image URLs are supported")
        with urlopen(image_url) as response:  # nosec - controlled by service deployment
            return Image.open(response)
    raise HTTPException(status_code=400, detail="Missing image_path or image_url")


def _ahash(image: Image.Image, size: int = 8) -> str:
    image = image.convert("L").resize((size, size))
    pixels = list(image.getdata())
    avg = sum(pixels) / len(pixels)
    bits = "".join("1" if pixel >= avg else "0" for pixel in pixels)
    return f"{int(bits, 2):0{size * size // 4}x}"


def _trash_scores(image: Image.Image) -> ImageScores:
    grayscale = image.convert("L")
    edge = grayscale.filter(ImageFilter.FIND_EDGES)
    edge_mean = ImageStat.Stat(edge).mean[0]
    grayscale_std = ImageStat.Stat(grayscale).stddev[0]
    trash_score = min(1.0, (edge_mean / 255) * 0.7 + (grayscale_std / 128) * 0.3)
    return ImageScores(trash_score=trash_score, edge_mean=edge_mean, grayscale_std=grayscale_std)


def _priority_from_severity(severity: float) -> Priority:
    if severity >= 0.7:
        return "High"
    if severity >= 0.45:
        return "Medium"
    return "Low"


def _normalized_diff(before: Image.Image, after: Image.Image) -> float:
    before_small = before.convert("RGB").resize((256, 256))
    after_small = after.convert("RGB").resize((256, 256))
    diff = ImageChops.difference(before_small, after_small)
    diff_mean = ImageStat.Stat(diff).mean
    return min(1.0, sum(diff_mean) / (255 * 3))


@app.post("/analyze/before", response_model=BeforeAnalyzeResponse)
async def analyze_before(payload: BeforeAnalyzeRequest) -> BeforeAnalyzeResponse:
    image = _load_image(payload.image_path, payload.image_url)
    image = image.convert("RGB")
    scores = _trash_scores(image)
    trash_present = scores.trash_score >= 0.35
    severity = scores.trash_score
    priority = _priority_from_severity(severity)
    decision: Decision = "approve" if trash_present else "reject"
    confidence = min(0.99, 0.55 + abs(scores.trash_score - 0.35))
    reason = None if trash_present else "No trash detected"

    return BeforeAnalyzeResponse(
        decision=decision,
        trash_present=trash_present,
        severity=round(severity, 4),
        priority=priority,
        confidence=round(confidence, 4),
        reason=reason,
        image_hash=_ahash(image),
        flags=[],
    )


@app.post("/analyze/after", response_model=AfterAnalyzeResponse)
async def analyze_after(payload: AfterAnalyzeRequest) -> AfterAnalyzeResponse:
    before = _load_image(payload.before_image_path, payload.before_image_url)
    after = _load_image(payload.after_image_path, payload.after_image_url)

    before = before.convert("RGB")
    after = after.convert("RGB")

    diff_score = _normalized_diff(before, after)
    after_scores = _trash_scores(after)

    flags: list[str] = []
    if diff_score < 0.08:
        flags.append("low_change_detected")

    if after_scores.trash_score < 0.25 and diff_score >= 0.12:
        decision: VerificationDecision = "accept"
        cleaned = True
        confidence = min(0.99, 0.6 + diff_score)
    elif after_scores.trash_score < 0.45:
        decision = "reclean"
        cleaned = False
        confidence = 0.55
    else:
        decision = "reject"
        cleaned = False
        confidence = 0.7

    return AfterAnalyzeResponse(
        decision=decision,
        cleaned=cleaned,
        confidence=round(confidence, 4),
        before_image_hash=_ahash(before),
        after_image_hash=_ahash(after),
        diff_score=round(diff_score, 4),
        after_trash_score=round(after_scores.trash_score, 4),
        flags=flags,
    )
