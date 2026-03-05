import io
import os
import base64
import logging
import threading

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
from django.conf import settings

logger = logging.getLogger(__name__)

_chart_font_loaded = False
_font_lock = threading.Lock()
_font_props = {}


def _load_chart_font():
    global _chart_font_loaded
    if _chart_font_loaded:
        return

    with _font_lock:
        if _chart_font_loaded:
            return

        fonts_dir = os.path.join(settings.BASE_DIR, 'static', 'fonts')
        regular = os.path.join(fonts_dir, 'Inter-Regular.ttf')
        bold = os.path.join(fonts_dir, 'Inter-Bold.ttf')

        if os.path.exists(regular):
            font_manager.fontManager.addfont(regular)
            _font_props['regular'] = font_manager.FontProperties(fname=regular)
        if os.path.exists(bold):
            font_manager.fontManager.addfont(bold)
            _font_props['bold'] = font_manager.FontProperties(fname=bold)

        _chart_font_loaded = True


def _get_font_family():
    if 'regular' in _font_props:
        return _font_props['regular'].get_name()
    return 'sans-serif'


def generate_status_chart(completed: int, in_progress: int, cancelled: int) -> str | None:
    _load_chart_font()

    labels = ['Tamamland\u0131', 'Devam Ediyor', '\u0130ptal']
    sizes = [completed, in_progress, cancelled]
    colors = ['#22c55e', '#3b82f6', '#94a3b8']

    filtered = [(l, s, c) for l, s, c in zip(labels, sizes, colors) if s > 0]
    if not filtered:
        return None

    labels, sizes, colors = zip(*filtered)

    total = sum(sizes)

    fig, ax = plt.subplots(figsize=(3.8, 3.8))
    font_family = _get_font_family()

    wedges, texts, autotexts = ax.pie(
        sizes,
        colors=colors,
        autopct=lambda pct: f'{int(round(pct * total / 100))}',
        startangle=90,
        pctdistance=0.78,
        wedgeprops={'width': 0.45, 'edgecolor': 'white', 'linewidth': 2},
        textprops={'fontsize': 11, 'fontfamily': font_family},
    )
    for t in autotexts:
        t.set_fontweight('bold')
        t.set_color('#ffffff')
        t.set_fontsize(10)

    completion_rate = round(completed / total * 100) if total > 0 else 0
    rate_color = '#16a34a' if completion_rate >= 80 else '#d97706' if completion_rate >= 50 else '#dc2626'
    ax.text(0, 0.06, f'%{completion_rate}', ha='center', va='center',
            fontsize=26, fontweight='bold', color=rate_color, fontfamily=font_family)

    legend = ax.legend(
        wedges, [f'{l} ({s})' for l, s in zip(labels, sizes)],
        loc='lower center',
        bbox_to_anchor=(0.5, -0.12),
        ncol=len(labels),
        fontsize=8,
        frameon=False,
        handlelength=1,
        handleheight=1,
    )
    for text in legend.get_texts():
        text.set_fontfamily(font_family)
        text.set_color('#475569')

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def generate_compliance_chart(compliant: int, non_compliant: int, skipped: int) -> str | None:
    _load_chart_font()

    labels = ['Uyumlu', 'Uyumsuz', 'Atlanan']
    sizes = [compliant, non_compliant, skipped]
    colors = ['#22c55e', '#ef4444', '#94a3b8']

    filtered = [(l, s, c) for l, s, c in zip(labels, sizes, colors) if s > 0]
    if not filtered:
        return None

    labels, sizes, colors = zip(*filtered)
    total = sum(sizes)

    fig, ax = plt.subplots(figsize=(3.8, 3.8))
    font_family = _get_font_family()

    wedges, texts, autotexts = ax.pie(
        sizes,
        colors=colors,
        autopct=lambda pct: f'{int(round(pct * total / 100))}',
        startangle=90,
        pctdistance=0.78,
        wedgeprops={'width': 0.45, 'edgecolor': 'white', 'linewidth': 2},
        textprops={'fontsize': 11, 'fontfamily': font_family},
    )
    for t in autotexts:
        t.set_fontweight('bold')
        t.set_color('#ffffff')
        t.set_fontsize(10)

    compliance_rate = round(compliant / total * 100) if total > 0 else 0
    rate_color = '#16a34a' if compliance_rate >= 80 else '#d97706' if compliance_rate >= 50 else '#dc2626'
    ax.text(0, 0.06, f'%{compliance_rate}', ha='center', va='center',
            fontsize=26, fontweight='bold', color=rate_color, fontfamily=font_family)
    legend = ax.legend(
        wedges, [f'{l} ({s})' for l, s in zip(labels, sizes)],
        loc='lower center',
        bbox_to_anchor=(0.5, -0.12),
        ncol=len(labels),
        fontsize=8,
        frameon=False,
        handlelength=1,
        handleheight=1,
    )
    for text in legend.get_texts():
        text.set_fontfamily(font_family)
        text.set_color('#475569')

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def generate_compliance_summary_chart(compliant: int, non_compliant: int, skipped: int) -> str | None:
    _load_chart_font()

    labels = ['Uygun', 'Uygunsuz', 'Kontrol D\u0131\u015f\u0131']
    sizes = [compliant, non_compliant, skipped]
    colors = ['#22c55e', '#ef4444', '#94a3b8']

    filtered = [(l, s, c) for l, s, c in zip(labels, sizes, colors) if s > 0]
    if not filtered:
        return None

    labels, sizes, colors = zip(*filtered)
    total = sum(sizes)

    fig, ax = plt.subplots(figsize=(3.8, 3.8))
    font_family = _get_font_family()

    wedges, texts, autotexts = ax.pie(
        sizes,
        colors=colors,
        autopct=lambda pct: f'{int(round(pct * total / 100))}',
        startangle=90,
        pctdistance=0.78,
        wedgeprops={'width': 0.45, 'edgecolor': 'white', 'linewidth': 2},
        textprops={'fontsize': 11, 'fontfamily': font_family},
    )
    for t in autotexts:
        t.set_fontweight('bold')
        t.set_color('#ffffff')
        t.set_fontsize(10)

    compliance_rate = round(compliant / total * 100) if total > 0 else 0
    rate_color = '#16a34a' if compliance_rate >= 80 else '#d97706' if compliance_rate >= 50 else '#dc2626'
    ax.text(0, 0.06, f'%{compliance_rate}', ha='center', va='center',
            fontsize=26, fontweight='bold', color=rate_color, fontfamily=font_family)
    legend = ax.legend(
        wedges, [f'{l} ({s})' for l, s in zip(labels, sizes)],
        loc='lower center',
        bbox_to_anchor=(0.5, -0.12),
        ncol=len(labels),
        fontsize=8,
        frameon=False,
        handlelength=1,
        handleheight=1,
    )
    for text in legend.get_texts():
        text.set_fontfamily(font_family)
        text.set_color('#475569')

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def generate_resolution_chart(opened: int, resolved: int, in_progress_count: int) -> str | None:
    _load_chart_font()

    labels = ['Tespit Edilen', 'D\u00d6F Tamamlanan', 'Devam Eden']
    values = [opened, resolved, in_progress_count]
    colors = ['#ef4444', '#22c55e', '#3b82f6']

    filtered = [(l, v, c) for l, v, c in zip(labels, values, colors) if v > 0]
    if not filtered:
        return None

    labels, values, colors = zip(*filtered)

    fig, ax = plt.subplots(figsize=(5.5, 2.5))
    font_family = _get_font_family()

    bars = ax.barh(labels, values, color=colors, height=0.5, edgecolor='none')

    ax.set_xlim(0, max(values) * 1.25 if max(values) > 0 else 10)
    ax.set_title('D\u00fczeltici \u00d6nleyici Faaliyet', fontsize=12, fontweight='bold',
                 color='#1e293b', pad=12, fontfamily=font_family)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_color('#e2e8f0')
    ax.spines['left'].set_color('#e2e8f0')
    ax.tick_params(colors='#64748b', labelsize=9)

    for tick in ax.get_yticklabels():
        tick.set_fontfamily(font_family)

    for i, v in enumerate(values):
        ax.text(v + max(values) * 0.02, i, str(v), va='center', fontsize=10,
                fontweight='bold', color='#334155', fontfamily=font_family)

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=180, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')
