"""Rebuild true transparent PNGs for homepage hero blister-pack cutouts.

The source files already have a partial alpha channel, but transparent pixels
still carry leftover RGB (often near-black). That composites as a black box
in many viewers and under mix-blend-mode. This rebuilds the matte from the
connected studio backdrop, keeps printed black type, defringes the edge,
and zeros RGB on fully transparent pixels.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "hero"
PREVIEW_DIR = ROOT / "scripts" / ".hero-cutout-preview"

SRC_DIR = Path(__file__).resolve().parent / "hero-cutout-sources"
SOURCES = {
    "vilafinil-200.png": SRC_DIR / "vilafinil-200.png",
    "modalert-200.png": SRC_DIR / "modalert-200.png",
    "artvigil-150.png": SRC_DIR / "artvigil-150.png",
}

NEIGHBORS = ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1))


def flood_background(is_dark: np.ndarray) -> np.ndarray:
    h, w = is_dark.shape
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def seed(y: int, x: int) -> None:
        if is_dark[y, x] and not visited[y, x]:
            visited[y, x] = True
            q.append((y, x))

    for x in range(w):
        seed(0, x)
        seed(h - 1, x)
    for y in range(h):
        seed(y, 0)
        seed(y, w - 1)

    while q:
        y, x = q.popleft()
        for dy, dx in NEIGHBORS:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_dark[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    return visited


def dilate(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    out = mask
    for _ in range(radius):
        nxt = out.copy()
        nxt[1:] |= out[:-1]
        nxt[:-1] |= out[1:]
        nxt[:, 1:] |= out[:, :-1]
        nxt[:, :-1] |= out[:, 1:]
        out = nxt
    return out


def erode(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    return ~dilate(~mask, radius)


def largest_component(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    ys, xs = np.where(mask)
    if ys.size == 0:
        return mask
    seed = (int(ys[ys.size // 2]), int(xs[xs.size // 2]))
    visited = np.zeros_like(mask)
    q: deque[tuple[int, int]] = deque([seed])
    visited[seed] = True
    while q:
        y, x = q.popleft()
        for dy, dx in NEIGHBORS:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    return visited


def fill_holes(mask: np.ndarray) -> np.ndarray:
    exterior = flood_background(~mask)
    return ~exterior


def knockout(src: Path) -> Image.Image:
    rgba = np.array(Image.open(src).convert("RGBA"), dtype=np.uint8)
    rgb = rgba[:, :, :3].astype(np.float32)
    src_alpha = rgba[:, :, 3].astype(np.float32) / 255.0
    mx = rgb.max(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)

    # Studio backdrop: near-black, or already fully transparent in the source.
    is_dark = (mx < 22) | (src_alpha < 0.04)
    background = flood_background(is_dark)

    core = (~background) & ((mx > 40) | (sat > 18) | (src_alpha > 0.6))
    core = largest_component(core)
    # Close small gaps so printed black type stays inside the pack matte.
    product = fill_holes(erode(dilate(core, 9), 9))
    product = dilate(product, 1)

    alpha = np.zeros(mx.shape, dtype=np.float32)
    alpha[product] = 1.0

    near_bg = dilate(background, 2)
    near_product = dilate(product, 2)

    # Soften the pack edge: anti-aliased black fringe becomes partial alpha,
    # without punching holes in printed black type (those are not near_bg).
    edge = product & near_bg
    edge_cover = np.clip(mx / 42.0, 0.0, 1.0)
    alpha[edge] = np.minimum(alpha[edge], edge_cover[edge])

    fringe = background & near_product & (mx > 18) & (sat > 6)
    alpha[fringe] = np.maximum(alpha[fringe], np.clip((mx[fringe] - 12.0) / 50.0, 0.0, 1.0))

    a = np.clip(alpha, 0.0, 1.0)[..., None]
    out_rgb = np.where(a > 0.02, rgb, 0.0)

    out = np.empty(rgba.shape, dtype=np.uint8)
    out[:, :, :3] = np.clip(out_rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)

    ys, xs = np.where(out[:, :, 3] > 10)
    pad = 12
    y0 = max(0, int(ys.min()) - pad)
    y1 = min(out.shape[0], int(ys.max()) + 1 + pad)
    x0 = max(0, int(xs.min()) - pad)
    x1 = min(out.shape[1], int(xs.max()) + 1 + pad)
    return Image.fromarray(out[y0:y1, x0:x1], "RGBA")


def checkerboard(size: tuple[int, int], cell: int = 24) -> Image.Image:
    w, h = size
    board = np.zeros((h, w, 3), dtype=np.uint8)
    board[:, :] = (248, 250, 252)
    yy, xx = np.indices((h, w))
    dark = ((xx // cell) + (yy // cell)) % 2 == 1
    board[dark] = (226, 232, 240)
    return Image.fromarray(board, "RGB")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for name, src in SOURCES.items():
        cut = knockout(src)
        dest = OUT_DIR / name
        cut.save(dest, "PNG", optimize=True)
        preview = checkerboard(cut.size)
        preview.paste(cut, (0, 0), cut)
        preview.save(PREVIEW_DIR / name, "PNG", optimize=True)
        a = np.array(cut)
        print(
            f"{name}: {cut.size} opaque={(a[:,:,3] > 200).mean()*100:.1f}% "
            f"transparent={(a[:,:,3] == 0).mean()*100:.1f}% "
            f"rgb@alpha0={a[:,:,:3][a[:,:,3]==0].mean() if (a[:,:,3]==0).any() else 0:.1f}"
        )


if __name__ == "__main__":
    main()
