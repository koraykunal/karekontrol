import os
import logging
import threading

from django.conf import settings
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

logger = logging.getLogger(__name__)

_font_css = None
_font_lock = threading.Lock()


def _get_font_css():
    global _font_css
    if _font_css is not None:
        return _font_css

    with _font_lock:
        if _font_css is not None:
            return _font_css

        fonts_dir = os.path.join(settings.BASE_DIR, 'static', 'fonts')
        rules = []

        font_map = [
            ('Inter-Regular.ttf', 'Inter', 'normal', 'normal'),
            ('Inter-Bold.ttf', 'Inter', 'normal', 'bold'),
            ('Inter-SemiBold.ttf', 'Inter', 'normal', '600'),
        ]

        for filename, family, style, weight in font_map:
            path = os.path.join(fonts_dir, filename)
            if os.path.exists(path):
                url = 'file://' + path.replace('\\', '/')
                rules.append(
                    f"@font-face {{"
                    f"  font-family: '{family}';"
                    f"  src: url('{url}');"
                    f"  font-style: {style};"
                    f"  font-weight: {weight};"
                    f"}}"
                )

        _font_css = '\n'.join(rules)
        return _font_css


class PDFGenerator:
    @staticmethod
    def render_to_pdf(template_name: str, context: dict) -> bytes | None:
        html_string = render_to_string(template_name, context)
        font_config = FontConfiguration()
        font_css_str = _get_font_css()

        try:
            html = HTML(string=html_string)
            stylesheets = []
            if font_css_str:
                stylesheets.append(CSS(string=font_css_str, font_config=font_config))

            pdf_bytes = html.write_pdf(
                stylesheets=stylesheets,
                font_config=font_config,
            )
            return pdf_bytes
        except Exception:
            logger.error("PDF generation failed for template %s", template_name, exc_info=True)
            return None
