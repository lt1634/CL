#!/usr/bin/env python3
"""
Jina Reader - 免費網頁讀取（無需 API Key）
用法：https://r.jina.ai/{你的URL}
"""

from typing import Optional
import requests


def jina_read(url: str) -> Optional[str]:
    """
    使用 Jina Reader 讀取網頁，回傳 Markdown 格式內容。

    Args:
        url: 要讀取的網址，例如 https://example.com/article

    Returns:
        成功：Markdown 字串
        失敗：None
    """
    # 1. 在 URL 前面加上 https://r.jina.ai/
    jina_url = f"https://r.jina.ai/{url}"

    # 2 & 3. 設定 headers
    headers = {
        "Accept": "text/markdown",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    try:
        resp = requests.get(jina_url, headers=headers, timeout=30)
        resp.raise_for_status()
        content = resp.text

        # 4. 檢查返回內容是否有效
        if not content or not content.strip():
            return None
        if len(content) < 50 and ("error" in content.lower() or "not found" in content.lower()):
            return None

        return content.strip()
    except requests.RequestException:
        return None


def main():
    import sys
    if len(sys.argv) < 2:
        print("用法: python jina_reader.py <URL>")
        sys.exit(1)

    url = sys.argv[1]
    result = jina_read(url)
    if result:
        print(result)
    else:
        print("讀取失敗", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
