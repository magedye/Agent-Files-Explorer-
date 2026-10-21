# Offline guide build

`GUIDE_AR.md` remains the editable academic source. `GUIDE_AR.html` is its derived offline reading edition, with selected companion documents and recursively linked local text references embedded as appendices. External publisher links are not fetched during rendering. `DIAGRAMS.json` preserves the ten SVG illustrations from the supplied 1.0 guide; their Mermaid source is still in Markdown. No remote JavaScript, fonts or CSS are loaded.

Rebuild only during authorized reference authoring:

```sh
python tools/render_guide.py
```

Rendering uses optional authoring libraries Mistune3.2.1 and BeautifulSoup4 as recorded in the build evidence. They are not dependencies of the governance runtime, validators or tests. The tool does not install them. Qualify alternative versions before relying on identical rendered bytes. Host policies and canonical JSON remain authoritative; the HTML reader does not activate tools.
