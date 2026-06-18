import type { EditableFeedback } from '../hooks/useEditableContent'

export function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

export function Paragraphs({ text }: { text: string }) {
  if (!text) return null
  if (!text.includes('\n')) return <p>{text}</p>

  return (
    <>
      {text.split('\n').map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </>
  )
}

export function EditField({
  label,
  value,
  multiline,
  onChange,
}: {
  label: string
  value: string
  multiline?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.stopPropagation()
          }}
        />
      ) : (
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}

export function EditFeedback({ feedback }: { feedback: EditableFeedback | null }) {
  if (!feedback) return null

  return (
    <p className={`editor-feedback editor-feedback--${feedback.kind}`} role="status">
      {feedback.text}
    </p>
  )
}

export function EditActions({
  editLabel,
  saveLabel,
  cancelLabel,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
}: {
  editLabel: string
  saveLabel: string
  cancelLabel: string
  editing: boolean
  saving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}) {
  if (!editing) {
    return (
      <div className="content-editor__actions">
        <button type="button" className="button icon-button" onClick={onEdit} aria-label={editLabel} title={editLabel}>
          <EditIcon />
        </button>
      </div>
    )
  }

  return (
    <div className="content-editor__actions">
      <button type="button" className="button button--primary" onClick={onSave} disabled={saving}>
        {saveLabel}
      </button>
      <button type="button" className="button" onClick={onCancel} disabled={saving}>
        {cancelLabel}
      </button>
    </div>
  )
}
