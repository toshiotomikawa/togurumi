import { EditActions, EditFeedback, EditField, Paragraphs } from '../components/EditableContent'
import { useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { TOGURUMI_EMAIL, TOGURUMI_INSTAGRAM, TOGURUMI_INSTAGRAM_DM, TOGURUMI_YOUTUBE } from '../lib/togurumi'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.25" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" />
      <path d="m10 8.5 6 3.5-6 3.5z" className="contact-card__youtube-play" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function CommissionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 13.4 7.6 18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z" />
      <path d="m18.5 14 .8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8.8-2.7Z" />
      <path d="m5 13 .7 2.3L8 16l-2.3.7L5 19l-.7-2.3L2 16l2.3-.7L5 13Z" />
    </svg>
  )
}

function ContactPage() {
  const { messages, locale } = useLocale()
  const about = useEditableContent('about', locale, messages.about, messages.contentEditor.draftRestored)
  const contact = useEditableContent('contact', locale, messages.contact, messages.contentEditor.draftRestored)

  const editing = about.editing || contact.editing
  const saving = about.saving || contact.saving
  const canEdit = about.canEdit
  const feedback = about.feedback ?? contact.feedback
  const contactMethods = [
    {
      id: 'instagram',
      label: contact.content.instagram,
      value: '@togurumi',
      href: TOGURUMI_INSTAGRAM,
      external: true,
      iconClassName: 'contact-card__icon--instagram',
      icon: <InstagramIcon />,
    },
    {
      id: 'youtube',
      label: contact.content.youtube,
      value: '@togurumi',
      href: TOGURUMI_YOUTUBE,
      external: true,
      iconClassName: 'contact-card__icon--youtube',
      icon: <YouTubeIcon />,
    },
    {
      id: 'email',
      label: contact.content.email,
      value: TOGURUMI_EMAIL,
      href: `mailto:${TOGURUMI_EMAIL}`,
      external: false,
      iconClassName: 'contact-card__icon--email',
      icon: <MailIcon />,
    },
  ]

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
    <div className="page page--contact">
      {editing && about.draft ? (
        <section className="contact-hero contact-hero--editing">
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
        <section className="contact-hero">
          <span className="contact-hero__eyebrow">{about.content.eyebrow}</span>
          <h1 className="contact-hero__title">{about.content.title}</h1>
          <div className="contact-hero__intro">
            <Paragraphs text={about.content.intro} />
          </div>
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

      <div className="contact-story-grid">
        {editing && about.draft ? (
          <section className="contact-story-card contact-story-card--editing">
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
          <section className="contact-story-card">
            <h2 className="contact-story-card__title">{about.content.storyHeading}</h2>
            <div className="contact-story-card__body">
              <Paragraphs text={about.content.storyBody} />
            </div>
          </section>
        )}

        {editing && about.draft ? (
          <section className="contact-story-card contact-story-card--editing">
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
          <section className="contact-story-card">
            <h2 className="contact-story-card__title">{about.content.whyHeading}</h2>
            <div className="contact-story-card__body">
              <Paragraphs text={about.content.whyBody} />
            </div>
          </section>
        )}

        {editing && about.draft ? (
          <section className="contact-story-card contact-story-card--editing contact-story-card--wide">
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
          <section className="contact-story-card contact-story-card--wide">
            <h2 className="contact-story-card__title">{about.content.nameHeading}</h2>
            <div className="contact-story-card__body">
              <Paragraphs text={about.content.nameBody} />
            </div>
          </section>
        )}
      </div>

      <section className="section contact-channels" aria-labelledby="contact-channels-heading">
        {editing && contact.draft ? (
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
            <EditField
              label={messages.contentEditor.fields.instagram}
              value={contact.draft.instagram}
              onChange={(value) => contact.updateField('instagram', value)}
            />
            <EditField
              label={messages.contentEditor.fields.youtube}
              value={contact.draft.youtube}
              onChange={(value) => contact.updateField('youtube', value)}
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
          <>
            <div className="contact-channels__intro">
              <h2 id="contact-channels-heading" className="contact-channels__title">
                {contact.content.title}
              </h2>
              <div className="contact-channels__body">
                <Paragraphs text={contact.content.intro} />
              </div>
            </div>

            <ul className="contact-list">
              {contactMethods.map((method) => (
                <li key={method.id}>
                  <a
                    className="card contact-card contact-card--link"
                    href={method.href}
                    target={method.external ? '_blank' : undefined}
                    rel={method.external ? 'noopener noreferrer' : undefined}
                  >
                    <span className={`contact-card__icon ${method.iconClassName}`} aria-hidden="true">
                      {method.icon}
                    </span>
                    <span className="contact-card__content">
                      <span className="contact-card__label">{method.label}</span>
                      <span className="contact-card__value">{method.value}</span>
                      {method.external ? (
                        <span className="contact-card__external">{messages.faq.opensExternally}</span>
                      ) : null}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <a
              className="card contact-commission contact-commission--link"
              href={TOGURUMI_INSTAGRAM_DM}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-card__icon contact-card__icon--commissions" aria-hidden="true">
                <CommissionIcon />
              </span>
              <span className="contact-card__content">
                <span className="contact-commission__title">{contact.content.commissions}</span>
                <span className="contact-commission__body contact-commission__body--text">
                  {contact.content.commissionsBody}
                </span>
                <span className="contact-card__external">{messages.faq.opensExternally}</span>
              </span>
            </a>
          </>
        )}
      </section>
    </div>
  )
}

export default ContactPage
