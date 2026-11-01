# 0012 Lines are few and each has a job

Purpose: an edge or state on the page is visible wherever someone needs it, and no line appears without a reason, so the owner's request for fewer, deliberate borders is what the rules actually say.

Status: established on 2026-10-31; decision 2 revised the same day. Application state: applied to `core/rules/UI-RULES.md` rule 4 and the handbook's Edges sample on 2026-10-31.

## Owner records

2026-10-29, to the previous agent: 「尤其是浮层、边框、圆角要尽可能统一，可以有几档，你得具体说明哪种用在哪里，并给出样张。你要更加仔细分析参考，没那么多边框的，哪些地方要用边框，也要给出案例。还有颜色，尤其是你的点缀色，太丑了，尤其还用在边框上。」

Gloss: "Overlays, borders and radii especially should be as uniform as possible, in a few tiers; state which is used where and give samples. Analyse the references more carefully: they do not have that many borders. Also give cases for where borders are to be used. And the colours, your accent colour especially, are ugly, especially when used on borders."

2026-10-30, about an outline added to the current theme card: 「别随便乱改啊，为什么要加一个边框啊」 Gloss: "Don't change things at will. Why add a border?"

2026-10-31: 「为什么画布与节点和业务蓝图的边框都没了」 Gloss: "Why are the borders on the canvas, nodes and business blueprint all gone?" Later the same day: 「请你看下这句话原话是什么情况下说的？……然后你曲解我的意思写了这条规则？」 Gloss: "Look at the circumstances of the original words. Did you then misread my meaning when you wrote this rule?"

2026-10-31, after seeing the restored lines: 「还是不要恢复了，还是没有线好看」 Gloss: "Don't restore them after all; it looks better without lines."

## What went wrong

The owner asked for fewer borders, a stated place for each and samples, and objected to one ugly accent colour on borders. Rule 4 turned this into a default prohibition with a closed list and a ban on coloured lines, "Draw no border by default … Never outline a card with colour", written on 2026-10-30 before the theme-card complaint. That complaint was about an unrequested change and was then cited in support of the rule. The defect audit committed in `55061ed` read the rule literally, and the selected-state lines on nodes, blueprint groups, map categories and crew were removed without an owner request.

## Decisions

1. **Rule 4 states jobs, not a prohibition.** Serves: fewer lines that are still present where needed. A line is drawn for keyboard focus, active or invalid input, a drop target, or a divider between same-coloured regions. A sample shows each job.
2. **Components on a canvas, map or crew carry no state line.** Serves: a clean canvas whose selected component is still identifiable. `.nd.ux-focus` and `.nd.run` use the `--sel` background and `--e3`; `.bp-g.ux-focus`, `.rm-cat.on` and `.crew.on` use a `--col` tint and `--e3`; `.bp-g` has no hairline. The first version of this decision restored the lines; the owner saw the result and preferred none, so the restoration was withdrawn the same day.
3. **One job draws one line.** Serves: no doubled edges. A focused `.input` shows its inner 1.5px line, and the global focus outline no longer applies to it.
4. **Lines that had no job stay removed.** Serves: fewer lines. The decorative rims on `.recess`, `.btn.danger`, `.m-radar`, `.silver`, `.phone`, `.mob` and `.device-shell` stay off, and the theme card keeps showing its state by width.

## Acceptance

- A1: in pure and neon, a selected node, selected blueprint group, selected map category and selected crew member report no ring or inset line, and differ from their resting state in background and shadow; a resting blueprint group reports no line.
- A2: a clicked or tabbed `.input` reports `outline-style:none` and its inner line. Other controls still show the focus outline after Tab.
- A3: the Edges sample shows every job in both templates.
- A4: dragging across a canvas, including over its text and button, leaves `getSelection()` empty.
