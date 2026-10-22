"""Lint reuses the single validator and adds advisory authoring diagnostics."""

from validate import finding, validate_package


def lint_package(package, root, context, *, grants=()):
    report, support = validate_package(package, root, context, grants=grants)
    if report["result"] != "INVALID":
        for member in package.items:
            for field in ("title", "reviewCadence", "nextReview"):
                if field not in member.value:
                    report["findings"].append(finding(member, "OPTIONAL_FIELD_ABSENT", "/" + field, disposition="WARNING"))
    return report, support
