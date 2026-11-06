import ctypes
import os
import re
import threading
import customtkinter as ctk
from pynput import keyboard

# Ensure a dedicated taskbar icon on Windows
if os.name == "nt":
    try:
        app_id = "mycompany.passwordstrength.checker.1.0"
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(app_id)
    except Exception:
        pass

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")


def evaluate_password(pswd: str):
    checks = {
        "length": 6 <= len(pswd) <= 20,
        "lower": bool(re.search(r"[a-z]", pswd)),
        "upper": bool(re.search(r"[A-Z]", pswd)),
        "digit": bool(re.search(r"\d", pswd)),
        "special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', pswd)),
    }
    return sum(checks.values()), checks


class PasswordOverlayApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Password Shield 🔐")
        self.geometry("420x500")
        self.resizable(False, False)

        # Header
        self.title_label = ctk.CTkLabel(
            self,
            text="Password Strength Checker",
            font=ctk.CTkFont(size=18, weight="bold"),
        )
        self.title_label.pack(padx=20, pady=(15, 5))

        self.sub_label = ctk.CTkLabel(
            self,
            text="Press ESC to minimize to taskbar | Ctrl+Alt+P to summon",
            font=ctk.CTkFont(size=11),
            text_color="gray",
        )
        self.sub_label.pack(pady=(0, 10))

        # Input Frame
        self.input_frame = ctk.CTkFrame(self)
        self.input_frame.pack(padx=20, pady=5, fill="x")

        self.entry = ctk.CTkEntry(
            self.input_frame,
            placeholder_text="Type password...",
            show="•",
            height=38,
            font=("Arial", 14),
        )
        self.entry.pack(side="left", fill="x", expand=True, padx=(10, 5), pady=8)
        self.entry.bind("<KeyRelease>", self.on_text_change)

        self.toggle_btn = ctk.CTkButton(
            self.input_frame,
            text="👁",
            width=36,
            height=38,
            command=self.toggle_visibility,
        )
        self.toggle_btn.pack(side="right", padx=(0, 10), pady=8)

        # Strength Bar
        self.progress_bar = ctk.CTkProgressBar(self, height=8)
        self.progress_bar.set(0)
        self.progress_bar.pack(padx=20, pady=(12, 5), fill="x")

        self.status_label = ctk.CTkLabel(
            self,
            text="Awaiting input...",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="gray",
        )
        self.status_label.pack(pady=(0, 10))

        # Criteria Checklist
        self.criteria_frame = ctk.CTkFrame(self)
        self.criteria_frame.pack(padx=20, pady=5, fill="both", expand=True)

        self.labels = {}
        criteria = [
            ("length", "6 to 20 characters"),
            ("lower", "At least one lowercase letter"),
            ("upper", "At least one uppercase letter"),
            ("digit", "At least one number"),
            ("special", "At least one special symbol"),
        ]

        for key, text in criteria:
            lbl = ctk.CTkLabel(
                self.criteria_frame,
                text=f"○  {text}",
                anchor="w",
                font=("Arial", 12),
            )
            lbl.pack(fill="x", padx=15, pady=5)
            self.labels[key] = lbl

        self.is_hidden = True

        # ESC minimizes to the taskbar without closing or hiding from view
        self.bind("<Escape>", lambda e: self.minimize_to_taskbar())

    def toggle_visibility(self):
        if self.is_hidden:
            self.entry.configure(show="")
            self.toggle_btn.configure(text="🔒")
        else:
            self.entry.configure(show="•")
            self.toggle_btn.configure(text="👁")
        self.is_hidden = not self.is_hidden

    def on_text_change(self, event=None):
        password = self.entry.get()
        if not password:
            self.progress_bar.set(0)
            self.status_label.configure(text="Awaiting input...", text_color="gray")
            for lbl in self.labels.values():
                lbl.configure(text="○ " + lbl.cget("text")[2:], text_color="gray")
            return

        score, checks = evaluate_password(password)

        for key, passed in checks.items():
            txt = self.labels[key].cget("text")[2:]
            if passed:
                self.labels[key].configure(text=f"✔  {txt}", text_color="#2ecc71")
            else:
                self.labels[key].configure(text=f"✕  {txt}", text_color="#e74c3c")

        self.progress_bar.set(score / 5.0)

        if score == 5:
            self.progress_bar.configure(progress_color="#2ecc71")
            self.status_label.configure(
                text="Strong Password (Accepted) 🚀", text_color="#2ecc71"
            )
        elif score >= 3:
            self.progress_bar.configure(progress_color="#f39c12")
            self.status_label.configure(
                text="Medium Strength ⚠️", text_color="#f39c12"
            )
        else:
            self.progress_bar.configure(progress_color="#e74c3c")
            self.status_label.configure(
                text="Weak Password ❌", text_color="#e74c3c"
            )

    def show_window(self):
        # Restore window state if minimized
        self.deiconify()
        self.state("normal")
        self.lift()
        self.attributes("-topmost", True)
        self.after(50, lambda: self.attributes("-topmost", False))
        self.entry.focus_set()

    def minimize_to_taskbar(self):
        # Standard minimize keeps it active in the taskbar
        self.iconify()


def start_hotkey_listener(app):
    hotkey = keyboard.GlobalHotKeys({
        "<ctrl>+<alt>+p": lambda: app.after(0, app.show_window)
    })
    hotkey.start()


if __name__ == "__main__":
    app = PasswordOverlayApp()

    listener_thread = threading.Thread(
        target=start_hotkey_listener, args=(app,), daemon=True
    )
    listener_thread.start()

    print("Password Shield is running.")
    print("Press Ctrl+Alt+P to bring it forward. Press ESC to minimize to taskbar.")
    app.mainloop()