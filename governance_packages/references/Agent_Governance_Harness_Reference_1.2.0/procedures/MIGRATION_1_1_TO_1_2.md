# Migration from 1.1.0 or the original 1.2.0 candidate

Review the actual prior version, project grant, instruction loading and canonical tracker before changing an existing adoption. Do not run init over an existing `.aghr` directory. Preserve previous reference bytes and decisions, inspect the file diff and manifest, and apply only authorized changes.

The 47 existing rule IDs and four contracts are preserved. Version 1.2.0 integrates governed `_INBOX/`, optional skill discovery and governed learning. The learning record/schema and local `lesson` CLI are additive. Existing PROJECT/STATE/REQUEST/EVIDENCE/RULE records retain their schemas. Lessons reuse the intake store; external native trackers retain their declared mapping.

Inbox dispositions now create separate immutable decision records and leave the captured REQUEST unchanged. Existing registry entries remain readable. Historical candidate requests that already contain disposition extension fields should be preserved as historical inputs; reconcile them into the current decision record before relying on them. Do not strip fields or reconstruct the missing original silently. Registry recovery validates an orphan request before rebuilding its missing index entry; corrupt registry JSON stops registration instead of resetting history.

Adopting the learning closeout procedure requires the project owner and actual host loading route. A reference designation does not install a skill, enable a hook, write user memory, activate a consumer project or prove production qualification. Qualify affected behavior and loading routes under the selected profile; keep unchanged valid evidence where its assumptions hold.
