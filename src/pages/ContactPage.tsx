import { EditActions, EditFeedback, EditField, Paragraphs } from '../components/EditableContent'
import { useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { TOGURUMI_EMAIL, TOGURUMI_INSTAGRAM } from '../lib/togurumi'

function ContactPage() {
  const { messages, locale } = useLocale()
  const about = useEditableContent('about', locale, messages.about, messages.contentEditor.draftRestored)
  const contact = useEditableContent('contact', locale, messages.contact, messages.contentEditor.draftRestored)

  const editing = about.editing || contact.editing
  const saving = about.saving || contact.saving
  const canEdit = about.canEdit
  const feedback = about.feedback ?? contact.feedback

  function startEditing() {
    about.startEditing()
    contact.startEditing()
  }

  function cancelEditing() {
    about.cancelEditing()
    contact.cancelEditing()
  }

  async function save() {
    await about.save(messages.contentEditor)
    await contact.save(messages.contentEditor)
  }

  return (
    <div className="page page--narrow">
      {editing && about.draft ? (
        <section className="hero">
          <div className="content-editor__fields">
            <EditField
              label={messages.contentEditor.fields.eyebrow}
              value={about.draft.eyebrow}
              onChange={(value) => about.updateField('eyebrow', value)}
            />
            <EditField
              label={messages.contentEditor.fields.title}
              value={about.draft.title}
              onChange={(value) => about.updateField('title', value)}
            />
            <EditField
              label={messages.contentEditor.fields.intro}
              value={about.draft.intro}
              multiline
              onChange={(value) => about.updateField('intro', value)}
            />
          </div>
        </section>
      ) : (
        <section className="hero">
          <span className="hero__eyebrow">{about.content.eyebrow}</span>
          <h1>{about.content.title}</h1>
          <Paragraphs text={about.content.intro} />
        </section>
      )}

      {canEdit && (
        <EditActions
          editLabel={messages.contentEditor.editButton}
          saveLabel={messages.contentEditor.save}
          cancelLabel={messages.contentEditor.cancel}
          editing={editing}
          saving={saving}
          onEdit={startEditing}
          onSave={() => void save()}
          onCancel={cancelEditing}
        />
      )}

      <EditFeedback feedback={feedback} />

      {editing && about.draft ? (
        <section className="section">
          <div className="content-editor__fields">
            <EditField
              label={messages.contentEditor.fields.storyHeading}
              value={about.draft.storyHeading}
              onChange={(value) => about.updateField('storyHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.storyBody}
              value={about.draft.storyBody}
              multiline
              onChange={(value) => about.updateField('storyBody', value)}
            />
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>{about.content.storyHeading}</h2>
          <Paragraphs text={about.content.storyBody} />
        </section>
      )}

      {editing && about.draft ? (
        <section className="section">
          <div className="content-editor__fields">
            <EditField
              label={messages.contentEditor.fields.whyHeading}
              value={about.draft.whyHeading}
              onChange={(value) => about.updateField('whyHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.whyBody}
              value={about.draft.whyBody}
              multiline
              onChange={(value) => about.updateField('whyBody', value)}
            />
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>{about.content.whyHeading}</h2>
          <Paragraphs text={about.content.whyBody} />
        </section>
      )}

      {editing && about.draft ? (
        <section className="section">
          <div className="content-editor__fields">
            <EditField
              label={messages.contentEditor.fields.nameHeading}
              value={about.draft.nameHeading}
              onChange={(value) => about.updateField('nameHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.nameBody}
              value={about.draft.nameBody}
              multiline
              onChange={(value) => about.updateField('nameBody', value)}
            />
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>{about.content.nameHeading}</h2>
          <Paragraphs text={about.content.nameBody} />
        </section>
      )}

      {editing && contact.draft ? (
        <section className="section">
          <div className="content-editor__fields">
            <EditField
              label={messages.contentEditor.fields.title}
              value={contact.draft.title}
              onChange={(value) => contact.updateField('title', value)}
            />
            <EditField
              label={messages.contentEditor.fields.intro}
              value={contact.draft.intro}
              multiline
              onChange={(value) => contact.updateField('intro', value)}
            />
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>{contact.content.title}</h2>
          <Paragraphs text={contact.content.intro} />
        </section>
      )}

      {editing && contact.draft ? (
        <div className="content-editor__fields">
          <EditField
            label={messages.contentEditor.fields.instagram}
            value={contact.draft.instagram}
            onChange={(value) => contact.updateField('instagram', value)}
          />
          <EditField
            label={messages.contentEditor.fields.email}
            value={contact.draft.email}
            onChange={(value) => contact.updateField('email', value)}
          />
          <EditField
            label={messages.contentEditor.fields.commissions}
            value={contact.draft.commissions}
            onChange={(value) => contact.updateField('commissions', value)}
          />
          <EditField
            label={messages.contentEditor.fields.commissionsBody}
            value={contact.draft.commissionsBody}
            multiline
            onChange={(value) => contact.updateField('commissionsBody', value)}
          />
        </div>
      ) : (
        <div className="contact-list">
          <div className="card">
            <h3>{contact.content.instagram}</h3>
            <p>
              <a href={TOGURUMI_INSTAGRAM} target="_blank" rel="noopener noreferrer">
                @togurumi
              </a>
            </p>
          </div>
          <div className="card">
            <h3>{contact.content.email}</h3>
            <p>
              <a href={`mailto:${TOGURUMI_EMAIL}`}>{TOGURUMI_EMAIL}</a>
            </p>
          </div>
          <div className="card">
            <h3>{contact.content.commissions}</h3>
            <Paragraphs text={contact.content.commissionsBody} />
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactPage
