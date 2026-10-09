import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, FileUp, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { addClasses, db } from '../../core/db.js'
import { aiParseTimetable, describeError, isAiReady } from '../../core/ai.js'
import { weekdayName } from '../../core/schedule.js'
import { normalizeCourse, parseTimetable, templateCSV } from '../../core/timetable.js'
import { useApp } from '../../core/store.jsx'
import { Field, Segmented, Sheet, Switch, useConfirm } from '../../core/ui.jsx'

const emptyCourse = { name: '', weekday: 1, start: '08:00', end: '09:40', location: '' }

async function readFileText(file) {
  const buf = await file.arrayBuffer()
  const utf8 = new TextDecoder('utf-8').decode(buf)
  // Excel 另存的中文 CSV 常是 GBK，UTF-8 解出乱码时回退
  return utf8.includes('\uFFFD') ? new TextDecoder('gbk').decode(buf) : utf8
}

export default function Timetable({ open, onClose }) {
  const { t, settings, toast } = useApp()
  const confirm = useConfirm()
  const classes = useLiveQuery(() => db.classes.toArray(), [], [])
  const [tab, setTab] = useState('list')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(emptyCourse)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [replace, setReplace] = useState(true)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const sorted = [...classes].sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start))
  const wdOpts = [1, 2, 3, 4, 5, 6, 7]

  const addOne = async () => {
    const c = normalizeCourse(draft)
    if (!c) return toast(t('tt.invalid'), 'error')
    await addClasses([c])
    setDraft(emptyCourse)
    setAdding(false)
    toast(t('form.saved'))
  }

  const removeOne = (id) => db.classes.delete(id)

  const clearAll = async () => {
    if (!(await confirm({ title: t('tt.clearTitle'), message: t('tt.clearMsg'), danger: true, confirmText: t('tt.clearBtn') }))) return
    await db.classes.clear()
  }

  const runParse = (src = text) => {
    const list = parseTimetable(src)
    setPreview(list)
    if (!list.length) toast(t('tt.parseEmpty'), 'error')
  }

  const pickFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const txt = await readFileText(f)
    setText(txt.slice(0, 200000))
    runParse(txt)
  }

  const runAi = async () => {
    if (!text.trim()) return toast(t('tt.pasteFirst'), 'error')
    if (!isAiReady(settings)) return toast(t('main.needAi'), 'error')
    setBusy(true)
    try {
      const raw = await aiParseTimetable(settings, text)
      const list = raw.map(normalizeCourse).filter(Boolean)
      setPreview(list)
      if (!list.length) toast(t('tt.parseEmpty'), 'error')
    } catch (e) {
      toast(describeError(e, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  const commit = async () => {
    if (!preview?.length) return
    await addClasses(preview, { replace })
    toast(t('tt.imported', { n: preview.length }))
    setPreview(null)
    setText('')
    setTab('list')
  }

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([templateCSV(settings.lang)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'komorebi-timetable-template.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('tt.title')} tall>
      <div className="flex flex-col gap-4 pb-3 pt-1">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[{ value: 'list', label: t('tt.tabList') }, { value: 'import', label: t('tt.tabImport') }]}
        />

        {tab === 'list' && (
          <>
            {sorted.length === 0 && !adding && <p className="py-6 text-center text-[13px] leading-relaxed text-faint">{t('tt.empty')}</p>}

            <ul className="divide-y divide-white/70">
              {sorted.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <span className="w-9 shrink-0 text-[13px] font-medium text-accent">{weekdayName(c.weekday, settings.lang)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-ink">{c.name}</div>
                    <div className="text-[12px] text-faint">{c.start}–{c.end}{c.location ? ` · ${c.location}` : ''}</div>
                  </div>
                  <button type="button" aria-label={t('common.delete')} onClick={() => removeOne(c.id)} className="flex h-9 w-9 items-center justify-center rounded-full text-faint active:scale-95">
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>

            {adding ? (
              <div className="glass-soft flex flex-col gap-3 rounded-2xl p-4">
                <Field label={t('tt.name')}>
                  <input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label={t('tt.weekday')}>
                    <select className="field !px-3" value={draft.weekday} onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}>
                      {wdOpts.map((d) => <option key={d} value={d}>{weekdayName(d, settings.lang)}</option>)}
                    </select>
                  </Field>
                  <Field label={t('tt.start')}>
                    <input type="time" className="field !px-3" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                  </Field>
                  <Field label={t('tt.end')}>
                    <input type="time" className="field !px-3" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                  </Field>
                </div>
                <Field label={t('tt.location')}>
                  <input className="field" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
                </Field>
                <div className="flex justify-end gap-2">
                  <button className="btn-soft" onClick={() => setAdding(false)}>{t('common.cancel')}</button>
                  <button className="btn-primary" onClick={addOne}>{t('common.save')}</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button className="btn-soft" onClick={() => setAdding(true)}>
                  <Plus size={15} strokeWidth={1.5} />
                  {t('tt.add')}
                </button>
                {sorted.length > 0 && (
                  <button className="btn-danger" onClick={clearAll}>
                    <Trash2 size={15} strokeWidth={1.5} />
                    {t('tt.clearBtn')}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'import' && (
          <>
            <p className="text-[13px] leading-relaxed text-muted">{t('tt.importHint')}</p>

            <textarea
              className="field min-h-[132px] resize-none text-[14px] leading-relaxed"
              value={text}
              onChange={(e) => { setText(e.target.value); setPreview(null) }}
              placeholder={t('tt.placeholder')}
            />

            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.json,.ics" className="hidden" onChange={pickFile} />
            <div className="flex flex-wrap gap-2">
              <button className="btn-soft" onClick={() => fileRef.current?.click()}>
                <FileUp size={15} strokeWidth={1.5} />
                {t('tt.pickFile')}
              </button>
              <button className="btn-soft" onClick={downloadTemplate}>
                <Download size={15} strokeWidth={1.5} />
                {t('tt.template')}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" disabled={!text.trim() || busy} onClick={() => runParse()}>
                <Wand2 size={15} strokeWidth={1.5} />
                {t('tt.parse')}
              </button>
              <button className="btn-soft" disabled={!text.trim() || busy} onClick={runAi}>
                <Sparkles size={15} strokeWidth={1.5} />
                {busy ? t('tt.aiBusy') : t('tt.parseAi')}
              </button>
            </div>

            {preview && preview.length > 0 && (
              <div className="glass-soft rounded-2xl p-4">
                <div className="mb-2 text-[13px] font-medium text-ink">{t('tt.previewTitle', { n: preview.length })}</div>
                <ul className="max-h-[200px] divide-y divide-white/70 overflow-y-auto">
                  {preview.map((c, i) => (
                    <li key={i} className="flex items-center gap-3 py-2 text-[13px]">
                      <span className="w-8 shrink-0 font-medium text-accent">{weekdayName(c.weekday, settings.lang)}</span>
                      <span className="min-w-0 flex-1 truncate text-ink">{c.name}</span>
                      <span className="shrink-0 text-faint">{c.start}–{c.end}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[13px] text-muted">{t('tt.replace')}</span>
                  <Switch checked={replace} onChange={setReplace} label={t('tt.replace')} />
                </div>
                <button className="btn-primary mt-4 w-full" onClick={commit}>{t('tt.confirmImport', { n: preview.length })}</button>
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}
