---
id: task-58
title: Reusable JSONEditor component with DynamoDB format support
status: To Do
assignee: []
created_date: '2026-01-09 21:12'
labels:
  - feature
  - component
  - foundation
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a reusable JSON editor component that supports both standard JSON and DynamoDB's native AttributeValue format. This is a foundation component for item create/edit features.

## Requirements

### Dual Format Support
- Standard JSON mode (default): `{"name": "John", "age": 30}`
- DynamoDB JSON mode: `{"name": {"S": "John"}, "age": {"N": "30"}}`
- Toggle button to switch between formats
- Auto-convert content when toggling

### Editor Features
- Syntax highlighting for JSON
- Line numbers
- Validation on edit (show parse errors)
- No undo/redo (simple implementation)
- Keyboard navigation within editor

### Mode Integration
- Full-screen takeover using existing inputMode pattern
- Add new mode: 'json-editor'
- Escape to cancel (with confirmation if changes made)
- Submit action to save

### Props Interface
```typescript
type JSONEditorProps = {
  initialValue: Record<string, unknown>
  readOnlyKeys?: string[]  // PK/SK for edit mode
  onSave: (value: Record<string, unknown>) => void
  onCancel: () => void
  title?: string
}
```

## Technical Notes
- Create `src/components/forms/json-editor.tsx`
- Use ink's TextInput or build custom multi-line input
- Consider using a JSON formatting library for pretty-print
- DynamoDB conversion: @aws-sdk/util-dynamodb has marshall/unmarshall

## Related Doc
See doc-8 for full feature planning context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Editor displays JSON with syntax highlighting
- [ ] #2 Toggle switches between standard JSON and DynamoDB format
- [ ] #3 Auto-conversion works correctly between formats
- [ ] #4 Validation shows JSON parse errors inline
- [ ] #5 Read-only keys cannot be edited when specified
- [ ] #6 Escape cancels with confirmation if changes exist
- [ ] #7 Full-screen mode using existing inputMode pattern
<!-- AC:END -->
