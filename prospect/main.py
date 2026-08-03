#!/usr/bin/env python3
import os, re, ctypes, sys

sys.stdout.reconfigure(encoding="utf-8")

try:
    ctypes.windll.kernel32.SetConsoleMode(
        ctypes.windll.kernel32.GetStdHandle(-11), 7
    )
except Exception:
    pass

RESET = "\033[0m"
BOLD  = "\033[1m"
W     = "\033[97m"   # bright white
LG    = "\033[37m"   # light grey
DG    = "\033[90m"   # dark grey

# top-to-bottom gradient for CYPHER (7 rows)
GRAD = [W + BOLD, W + BOLD, W, W, LG, LG, DG]

# ── 7-row × 6-col font for CYPHER ────────────────────────
FONT = {
    'C': [" ████ ", "█    █", "█     ", "█     ", "█     ", "█    █", " ████ "],
    'Y': ["█    █", "█    █", " █  █ ", "  ██  ", "  █   ", "  █   ", "  █   "],
    'P': ["█████ ", "█    █", "█    █", "█████ ", "█     ", "█     ", "█     "],
    'H': ["█    █", "█    █", "█    █", "██████", "█    █", "█    █", "█    █"],
    'E': ["██████", "█     ", "█     ", "█████ ", "█     ", "█     ", "██████"],
    'R': ["█████ ", "█    █", "█    █", "█████ ", "█  █  ", "█   █ ", "█    █"],
}

# ── 5-row pixel font for names (most 4-col, W is 5-col) ──
SMALL = {
    'A': [" ██ ", "█  █", "████", "█  █", "█  █"],
    'D': ["███ ", "█  █", "█  █", "█  █", "███ "],
    'E': ["████", "█   ", "███ ", "█   ", "████"],
    'G': [" ██ ", "█   ", "█ ██", "█  █", " ███"],
    'H': ["█  █", "█  █", "████", "█  █", "█  █"],
    'I': ["████", " █  ", " █  ", " █  ", "████"],
    'K': ["█  █", "█ █ ", "██  ", "█ █ ", "█  █"],
    'L': ["█   ", "█   ", "█   ", "█   ", "████"],
    'N': ["█  █", "██ █", "█ ██", "█  █", "█  █"],
    'O': [" ██ ", "█  █", "█  █", "█  █", " ██ "],
    'R': ["███ ", "█  █", "███ ", "█ █ ", "█  █"],
    'S': [" ███", "█   ", " ██ ", "   █", "███ "],
    'T': ["████", " █  ", " █  ", " █  ", " █  "],
    'U': ["█  █", "█  █", "█  █", "█  █", " ██ "],
    'V': ["█  █", "█  █", "█  █", " ██ ", " █  "],
    'W': ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
    'Y': ["█  █", "█  █", " ██ ", " █  ", " █  "],
    '0': ["████", "█  █", "█  █", "█  █", "████"],
    ' ': ["    ", "    ", "    ", "    ", "    "],
}

_esc = re.compile(r'\x1B\[[0-?]*[ -/]*[@-~]')

def cols():
    try:    return os.get_terminal_size().columns
    except: return 80

def vlen(s):      return len(_esc.sub('', s))
def center(s, w): return " " * max(0, (w - vlen(s)) // 2) + s

def render(word):
    rows = [""] * 7
    for i, ch in enumerate(word.upper()):
        g = FONT.get(ch, ["      "] * 7)
        for r in range(7):
            if i: rows[r] += "  "
            for px in g[r]:
                rows[r] += (GRAD[r] + "█" + RESET) if px == "█" else " "
    return rows

def render_small(word, clr):
    rows = [""] * 5
    for i, ch in enumerate(word.upper()):
        g = SMALL.get(ch, ["    "] * 5)
        for r in range(5):
            if i: rows[r] += " "
            for px in g[r]:
                rows[r] += (clr + "█" + RESET) if px == "█" else " "
    return rows

def main():
    w = cols()
    print()
    print()

    for line in render("CYPHER"):
        print(center(line, w))

    print()
    print(center(DG + "━" * 46 + RESET, w))
    print()

    names = [
        (W + BOLD, "SolarGuardian"),
        (LG,       "hedi0ne"),
        (LG,       "vvite swanky"),
        (W + BOLD, "IIDONE"),
    ]
    for clr, name in names:
        for line in render_small(name, clr):
            print(center(line, w))
        print()

    print(center(DG + "━" * 46 + RESET, w))
    print()

if __name__ == "__main__":
    main()
