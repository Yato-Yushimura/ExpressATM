"""
ExpressBank ATM POV Simulator — Native Windows Desktop Application Launcher (Pure Python)
Packages the HTML + CSS + JS application into a standalone Windows .exe executable
via PyInstaller.
"""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
import shutil
import socket
import subprocess
import sys
import threading
import webbrowser


APP_TITLE = "ExpressBank ATM POV Simulator"
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 820


class QuietHandler(SimpleHTTPRequestHandler):
    """Silent static file handler for the bundled HTML/CSS/JS application."""

    def log_message(self, format, *args):
        pass


def get_bundle_dir():
    """Locate the bundled static web assets inside PyInstaller _MEIPASS or repo root."""
    base_dir = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    candidate = os.path.join(base_dir, "dist-ghpages")
    if os.path.isdir(candidate) and os.path.isfile(os.path.join(candidate, "index.html")):
        return candidate
    dist_candidate = os.path.join(base_dir, "dist")
    if os.path.isdir(dist_candidate) and os.path.isfile(os.path.join(dist_candidate, "index.html")):
        return dist_candidate
    return base_dir


def find_free_port():
    """Find an available localhost TCP port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_local_server(directory, port):
    """Run a background ThreadingHTTPServer serving the bundled app directory."""
    handler = partial(QuietHandler, directory=directory)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def find_chromium_browser():
    """Locate Microsoft Edge or Google Chrome on Windows for native --app window fallback."""
    candidates = [
        shutil.which("msedge"),
        shutil.which("chrome"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            return path
    return None


def main():
    web_dir = get_bundle_dir()
    port = find_free_port()
    server = start_local_server(web_dir, port)
    app_url = f"http://127.0.0.1:{port}/index.html"

    # 1. Try native desktop window via pywebview (Windows Edge WebView2 / WinForms)
    try:
        import webview  # type: ignore

        webview.create_window(
            APP_TITLE,
            app_url,
            width=WINDOW_WIDTH,
            height=WINDOW_HEIGHT,
            min_size=(900, 640),
            background_color="#020617",
        )
        webview.start()
        server.shutdown()
        return
    except Exception:
        pass

    # 2. Fallback: Launch Edge or Chrome in native chromeless --app mode
    browser_exe = find_chromium_browser()
    if browser_exe:
        try:
            proc = subprocess.Popen(
                [
                    browser_exe,
                    f"--app={app_url}",
                    f"--window-size={WINDOW_WIDTH},{WINDOW_HEIGHT}",
                    "--new-window",
                ]
            )
            proc.wait()
            server.shutdown()
            return
        except Exception:
            pass

    # 3. Final Fallback: Open default browser and keep server alive with a small Tkinter window
    webbrowser.open(app_url)
    try:
        import tkinter as tk

        root = tk.Tk()
        root.title(APP_TITLE)
        root.geometry("380x160")
        root.configure(bg="#020617")
        label = tk.Label(
            root,
            text="ExpressBank ATM POV Simulator is running.\nClose this window to exit the application.",
            fg="#f8fafc",
            bg="#020617",
            font=("Segoe UI", 10, "bold"),
            pady=20,
        )
        label.pack()
        btn = tk.Button(
            root,
            text="Quit Application",
            command=root.destroy,
            bg="#e11d48",
            fg="#ffffff",
            font=("Segoe UI", 9, "bold"),
            padx=16,
            pady=6,
        )
        btn.pack()
        root.mainloop()
    except Exception:
        pass
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
