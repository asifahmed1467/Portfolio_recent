// Mail: the contact form as a composer. Validates, then posts to Formspree if data.formspree is set; otherwise falls back to mailto:.
import { data } from '../data';
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, _win: Win, os: OS) {
  const f = (label: string, el: HTMLElement) => h('label', { class: 'ml-f' }, h('span', {}, label), el);
  const name = h('input', { placeholder: 'Your name', autocomplete: 'name' }) as HTMLInputElement, from = h('input', { type: 'email', placeholder: 'you@example.com', autocomplete: 'email' }) as HTMLInputElement, subj = h('input', { placeholder: 'Subject' }) as HTMLInputElement, msg = h('textarea', { placeholder: 'Write your message...', rows: '8' }) as HTMLTextAreaElement;
  const status = h('div', { class: 'ml-s', role: 'status' }); const errs: Record<string, string> = {};
  const to = h('input', { value: `${data.name} <${data.email}>`, readonly: true, 'aria-label': 'To' }) as HTMLInputElement;
  const mark = (el: HTMLElement, bad: boolean) => el.classList.toggle('bad', bad);
  const copyBtn = h('button', { class: 'abtn alt', onclick: async () => { try { await navigator.clipboard.writeText(`To: ${data.email}\nSubject: ${subj.value}\n\n${msg.value}`); status.textContent = 'Copied the message to your clipboard.'; } catch { status.textContent = 'Could not copy automatically. Select the text and copy it.'; } } }, 'Copy message');
  async function send() {
    const bad = { n: !name.value.trim(), e: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from.value), s: !subj.value.trim(), m: msg.value.trim().length < 10 }; mark(name, bad.n); mark(from, bad.e); mark(subj, bad.s); mark(msg, bad.m);
    if (Object.values(bad).some(Boolean)) { status.className = 'ml-s err'; status.textContent = bad.e ? 'Please enter a valid email address.' : bad.m ? 'Message must be at least 10 characters.' : 'Please fill in every field.'; return; }
    status.className = 'ml-s'; status.textContent = 'Sending...';
    if (data.formspree) { try { const r = await fetch(data.formspree, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: name.value, email: from.value, subject: subj.value, message: msg.value }) }); if (r.ok) { status.className = 'ml-s ok'; status.textContent = 'Message sent. Thank you!'; os.notify('Mail', 'Your message was sent.', '✉️'); msg.value = ''; return; } } catch { /* fall through to mailto */ } }
    const url = `mailto:${data.email}?subject=${encodeURIComponent(subj.value)}&body=${encodeURIComponent(msg.value + '\n\n' + name.value + ' (' + from.value + ')')}`;
    try { window.open(url, '_blank'); } catch { /* may be blocked */ } status.className = 'ml-s'; status.textContent = `Your mail app should open with the draft. If it does not, use "Copy message" and email ${data.email}. (Set data.formspree to send directly from this form.)`;
  }
  body.append(h('div', { class: 'ml' }, h('div', { class: 'ml-bar' }, h('button', { class: 'abtn', onclick: send }, '✈ Send'), copyBtn, h('span', {}, 'New message')), f('To', to), f('Name', name), f('From', from), f('Subject', subj), h('div', { class: 'ml-b' }, msg), status));
  [name, from, subj, msg].forEach(e => e.addEventListener('keydown', ev => ev.stopPropagation())); return { onFocus: () => name.focus() };
}
