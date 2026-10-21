# Examples are synthetic, not project facts

The JSON templates intentionally contain unknowns. Do not rename placeholders and claim adoption/evidence is complete. For an actual executable example use `runtime/cli.py demo`; it creates a new private workspace and exercises real bounded file effects without calling any model.

## LITE example
A developer is authorized to fix a parser in an isolated test repository with synthetic data. Record the goal and acceptance, declare PUBLIC or INTERNAL_NON_SENSITIVE only after checking, and select LITE. Use the existing native tracker or local state, not both as competing authorities. Run the relevant reproduction/regression. A four-file change does not automatically need another approval. A subsequent production-data operation is a separate CONTROLLED boundary.

## STANDARD example
An existing service needs a new endpoint. Discover actual stack/API types, commands and instructions. Define the flow and contract, test affected integration and negative cases, preserve user changes and capture exact evidence. Deploy authorization is separate. Use `prompts/ADOPT.md` and `prompts/EDIT.md`.

## CONTROLLED example
A production migration touches sensitive records. Identify operator authority, exact environment, current data scope, supported migration/restore mechanisms and independent review requirement. Test on safe fixtures, qualify the actual boundary, obtain a bound approval and verify results. A project profile alone cannot authorize the live operation.
