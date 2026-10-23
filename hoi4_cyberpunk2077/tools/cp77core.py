"""Общие помощники генератора: локализация, запись файлов, фокусы, идеи."""
import os
from collections import OrderedDict

MOD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cyberpunk2077")

LOC = OrderedDict()          # файл-группа -> OrderedDict(key -> text)
GFX = OrderedDict()          # имя спрайта -> путь к текстуре
ICONS = OrderedDict()        # (kind, name) -> (glyph, color)


def loc(group, key, text):
    LOC.setdefault(group, OrderedDict())
    if key in LOC[group] and LOC[group][key] != text:
        raise ValueError(f"duplicate loc key {key}")
    LOC[group][key] = text
    return key


def write(rel, text, bom=False):
    path = os.path.join(MOD_DIR, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8-sig" if bom else "utf-8", newline="\n") as fh:
        fh.write(text)


def _esc(text):
    return text.replace('"', "'").replace("\n", "\\n")


def write_localisation():
    """Русский — основной язык. Те же строки кладутся в english, чтобы
    при английском интерфейсе вместо ключей был виден текст."""
    for group, entries in LOC.items():
        for lang in ("russian", "english"):
            sub = "replace/" if group.endswith("_replace") else ""
            name = group.replace("_replace", "")
            lines = [f"l_{lang}:"]
            for k, v in entries.items():
                lines.append(f' {k}:0 "{_esc(v)}"')
            write(f"localisation/{lang}/{sub}{name}_l_{lang}.yml", "\n".join(lines) + "\n", bom=True)


def indent(block, n):
    pad = "\t" * n
    return "\n".join(pad + line if line.strip() else line for line in block.strip("\n").splitlines())


# ------------------------------------------------------------------ фокусы
class Focus:
    def __init__(self, fid, x, y, icon, name, desc, reward="", prereq=(), mutex=(), cost=10,
                 available="", bypass="", ai=1, filters=(), allow_branch="", glyph=None, color=None,
                 will_lead_to_war_with=()):
        self.__dict__.update(locals())
        del self.__dict__["self"]
        self.mutex = list(mutex)


class Tree:
    def __init__(self, tree_id, group, country_block, default="no", shared_prefix=None):
        self.tree_id = tree_id
        self.group = group
        self.country_block = country_block
        self.default = default
        self.focuses = OrderedDict()

    def add(self, *a, **kw):
        f = Focus(*a, **kw)
        if f.fid in self.focuses:
            raise ValueError(f"duplicate focus {f.fid}")
        self.focuses[f.fid] = f
        return f.fid

    def mutex_group(self, ids):
        for a in ids:
            for b in ids:
                if a != b and b not in self.focuses[a].mutex:
                    self.focuses[a].mutex.append(b)

    def validate(self):
        pos = {}
        for f in self.focuses.values():
            key = (f.x, f.y)
            if key in pos:
                raise ValueError(f"focus overlap {f.fid} and {pos[key]} at {key}")
            pos[key] = f.fid
            for p in f.prereq:
                for q in (p if isinstance(p, (tuple, list)) else (p,)):
                    if q not in self.focuses:
                        raise ValueError(f"{f.fid}: unknown prereq {q}")
                    if self.focuses[q].y >= f.y:
                        raise ValueError(f"{f.fid}: prereq {q} not above")
            for m in f.mutex:
                if m not in self.focuses:
                    raise ValueError(f"{f.fid}: unknown mutex {m}")

    def render(self):
        self.validate()
        out = ["focus_tree = {", f"\tid = {self.tree_id}", "", indent(self.country_block, 1),
               f"\tdefault = {self.default}", "\tcontinuous_focus_position = { x = 50 y = 1400 }", ""]
        for f in self.focuses.values():
            loc(self.group, f.fid, f.name)
            loc(self.group, f.fid + "_desc", f.desc)
            ICONS[("goal", f.icon)] = ICONS.get(("goal", f.icon), None)
            b = ["focus = {", f"\tid = {f.fid}", f"\ticon = GFX_goal_cp77_{f.icon}",
                 f"\tx = {f.x}", f"\ty = {f.y}", f"\tcost = {f.cost}"]
            for p in f.prereq:
                group = p if isinstance(p, (tuple, list)) else (p,)
                b.append("\tprerequisite = { " + " ".join(f"focus = {q}" for q in group) + " }")
            if f.mutex:
                b.append("\tmutually_exclusive = { " + " ".join(f"focus = {m}" for m in f.mutex) + " }")
            if f.allow_branch:
                b.append("\tallow_branch = {\n" + indent(f.allow_branch, 2) + "\n\t}")
            if f.available:
                b.append("\tavailable = {\n" + indent(f.available, 2) + "\n\t}")
            if f.bypass:
                b.append("\tbypass = {\n" + indent(f.bypass, 2) + "\n\t}")
            for w in f.will_lead_to_war_with:
                b.append(f"\twill_lead_to_war_with = {w}")
            if f.filters:
                b.append("\tsearch_filters = { " + " ".join(f.filters) + " }")
            ai = f.ai if isinstance(f.ai, str) else f"factor = {f.ai}"
            b.append("\tai_will_do = {\n" + indent(ai, 2) + "\n\t}")
            b.append("\tcompletion_reward = {\n" + (indent(f.reward, 2) if f.reward.strip() else "") + "\n\t}")
            b.append("}")
            out.append(indent("\n".join(b), 1))
            out.append("")
        out.append("}")
        return "\n".join(out) + "\n"
