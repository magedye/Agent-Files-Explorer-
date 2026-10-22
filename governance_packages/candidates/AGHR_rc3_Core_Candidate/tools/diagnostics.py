"""Reader failures retain captured source; they never return a successful index."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Diagnostic:
    code: str
    message: str
    path: str
    line: int | None = None
    column: int | None = None
    byte_offset: int | None = None


class ReadFailure(Exception):
    def __init__(self, diagnostic, sources=()):
        self.diagnostic = diagnostic
        self.sources = tuple(sources)
        super().__init__(f"{diagnostic.code}: {diagnostic.message}")


def fail(code, message, path, *, mark=None, text=None, sources=()):
    line = mark.line + 1 if mark is not None else None
    column = mark.column + 1 if mark is not None else None
    offset = len(text[:mark.index].encode("utf-8")) if mark is not None and text is not None else None
    raise ReadFailure(Diagnostic(code, message, path, line, column, offset), sources)
