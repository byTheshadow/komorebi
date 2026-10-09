import { useEffect, useRef, useState } from 'react'
import {
  Bell, Check, Cloud, Database, Download, Eye, EyeOff, Globe, Loader2, RefreshCw, Sparkles, Upload, UserRound, XCircle, Zap,
} from 'lucide-react'
import { exportAll, importAll, wipeAll } from '../../core/db.js'
import { describeError, fetchModels, isAiReady, testConnection } from '../../core/ai.js'
import { getPersonaText, PERSONA_IDS } from '../../core/i18n.js'
import { getSupport, notify, requestPermission, subscribePush, syncNow, unsubscribePush } from '../../core/pushManager.js'
import { useApp } from '../../core/store.jsx'
import { TopBar } from '../../core/Shell.jsx'
import { Field, Segmented, Switch, useConfirm } from '../../core/ui.jsx'

function Section({ icon: Icon, title, badge, children }) {
  return (
    <section className="glass rounded-[26px] p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <Icon size={16} strokeWidth={1.5} className="text-accent" />
        <h2 className="text-[15px] font-medium text-ink">{title}</h2>
        {badge && <span className="pill-tag">{badge}</span>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[14px] text-ink">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] leading-relaxed text-faint">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

/* 本地编辑、失焦时才写库，避免每个按键都落盘；外部值变化（导入/清空）时同步 */
function TextSetting({ k, secret = false, multiline = false, ...rest }) {
  const { settings, update } = useApp()
  const [v, setV] = useState(settings[k] ?? '')
  const [show, setShow] = useState(false)
  useEffect(() => setV(settings[k] ?? ''), [settings[k]]) // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => v !== (settings[k] ?? '') && update({ [k]: v.trim() })
  const common = { value: v, onChange: (e) => setV(e.target.value), onBlur: commit, className: 'field', autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false, ...rest }
  if (secret) {
    return (
      <div className="relative">
        <input {...common} type={show ? 'text' : 'password'} className="field pr-12" autoComplete="off" />
        <button type="button" aria-label="toggle" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-faint">
          {show ? <EyeOff size={17} strokeWidth={1.5} /> : <Eye size={17} strokeWidth={1.5} />}
        </button>
      </div>
    )
  }
  return multiline ? <textarea {...common} rows={4} className="field resize-none text-[14px] leading-relaxed" /> : <input {...common} />
}

function Status({ state }) {
  if (!state) return null
  const ok = state.ok
  return (
    <div className={`flex items-start gap-2 rounded-2xl px-3.5 py-3 text-[13px] leading-relaxed ${ok ? 'bg-emerald-50/80 text-emerald-700' : 'bg-rose-50/80 text-rose-700'}`}>
      {ok ? <Check size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" /> : <XCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />}
      <span className="selectable min-w-0 break-words">{state.text}</span>
    </div>
  )
}

export default function Settings({ openNav }) {
  const { settings, update, t, toast } = useApp()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(null)
  const [aiStatus, setAiStatus] = useState(null)
  const [cloudStatus, setCloudStatus] = useState(null)
  const [perm, setPerm] = useState(() => getSupport().permission)
  const importRef = useRef(null)
  const sup = getSupport()

  /* ───── AI ───── */
  const needBase = () => {
    if (!settings.aiBaseUrl || !settings.aiKey) {
      toast(t('ai.needBase'), 'error')
      return true
    }
    return false
  }

  const loadModels = async () => {
    if (needBase()) return
    setBusy('models')
    try {
      const { models, ms } = await fetchModels(settings)
      const model = models.includes(settings.aiModel) ? settings.aiModel : models[0] || ''
      await update({ aiModels: models, aiModel: model })
      setAiStatus({ ok: true, text: t('ai.modelsOk', { n: models.length, ms }) })
    } catch (e) {
      setAiStatus({ ok: false, text: describeError(e, t) })
    } finally {
      setBusy(null)
    }
  }

  const runTest = async () => {
    if (needBase()) return
    setBusy('test')
    try {
      const r = await testConnection(settings)
      if (r.models.length) await update({ aiModels: r.models, aiModel: r.models.includes(settings.aiModel) ? settings.aiModel : r.models[0] })
      setAiStatus({
        ok: true,
        text: r.chatMs != null ? t('ai.testOk', { n: r.models.length, ms: r.ms, chat: r.chatMs }) : t('ai.modelsOk', { n: r.models.length, ms: r.ms }),
      })
    } catch (e) {
      setAiStatus({ ok: false, text: describeError(e, t) })
    } finally {
      setBusy(null)
    }
  }

  const modelOptions = [...new Set([settings.aiModel, ...settings.aiModels].filter(Boolean))]

  /* ───── 人设 ───── */
  const personaText = getPersonaText(settings, settings.lang)
  const pickPreset = (id) => update(id === 'custom' ? { aiPresetId: 'custom', aiPersona: settings.aiPersona || personaText } : { aiPresetId: id })

  /* ───── 通知 ───── */
  const toggleNotify = async (on) => {
    if (!on) return update({ notifyEnabled: false })
    if (!sup.notification) return toast(sup.needsInstall ? t('notif.needInstall') : t('notif.unsupported'), 'error')
    const p = await requestPermission()
    setPerm(p)
    if (p !== 'granted') {
      await update({ notifyEnabled: false })
      return toast(t('notif.denied'), 'error')
    }
    await update({ notifyEnabled: true })
    return toast(t('notif.enabled'))
  }

  const sendTest = async () => {
    const ok = await notify({ title: 'Komorebi', body: t('notif.testBody'), tag: 'komorebi-test' })
    toast(ok ? t('notif.testSent') : t('notif.testFail'), ok ? 'info' : 'error')
  }

  /* ───── 云端推送（备用） ───── */
  const cloudSubscribe = async () => {
    if (!settings.cloudUrl || !settings.cloudVapid) return toast(t('cloud.needFields'), 'error')
    if (!sup.push) return toast(sup.needsInstall ? t('notif.needInstall') : t('cloud.noPush'), 'error')
    setBusy('cloud')
    try {
      const p = await requestPermission()
      setPerm(p)
      if (p !== 'granted') throw new Error(t('notif.denied'))
      await subscribePush(settings.cloudVapid)
      const next = { ...settings, cloudEnabled: true, cloudSubscribed: true }
      await update({ cloudEnabled: true, cloudSubscribed: true })
      const r = await syncNow(next, t, { force: true })
      setCloudStatus({ ok: true, text: t('cloud.synced', { n: r.count ?? 0 }) })
    } catch (e) {
      setCloudStatus({ ok: false, text: e?.message || String(e) })
    } finally {
      setBusy(null)
    }
  }

  const cloudUnsubscribe = async () => {
    try { await unsubscribePush() } catch { /* ignore */ }
    await update({ cloudSubscribed: false })
    setCloudStatus(null)
    toast(t('cloud.unsubscribed'))
  }

  /* ───── 数据 ───── */
  const doExport = async () => {
    const blob = new Blob([JSON.stringify(await exportAll(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `komorebi-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const doImport = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      if (!(await confirm({ title: t('data.importTitle'), message: t('data.importMsg'), danger: true, confirmText: t('data.importBtn') }))) return
      await importAll(data)
      toast(t('data.imported'))
      setTimeout(() => window.location.reload(), 600)
    } catch {
      toast(t('data.importFail'), 'error')
    }
  }

  const doWipe = async () => {
    if (!(await confirm({ title: t('data.wipeTitle'), message: t('data.wipeMsg'), danger: true, confirmText: t('data.wipeBtn') }))) return
    await wipeAll()
    await update({ activeChatId: null })
    toast(t('data.wiped'))
  }

  const permText = { granted: t('notif.permGranted'), denied: t('notif.permDenied'), default: t('notif.permDefault'), unsupported: t('notif.permUnsupported') }[perm]

  return (
    <div className="flex h-full flex-col">
      <TopBar title={t('nav.settings')} onMenu={openNav} />

      <div className="scroll-y no-scrollbar min-h-0 flex-1 px-5 pb-12">
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 pt-2">
          {/* 通用 */}
          <Section icon={Globe} title={t('set.general')}>
            <Row label={t('set.language')}>
              <Segmented value={settings.lang} onChange={(lang) => update({ lang })} options={[{ value: 'zh', label: '中文' }, { value: 'en', label: 'English' }]} />
            </Row>
            <Row label={t('set.theme')}>
              <div className="flex gap-3">
                {[['ice', '#38bdf8', t('set.themeIce')], ['peach', '#fb7185', t('set.themePeach')]].map(([id, c, name]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={settings.theme === id}
                    onClick={() => update({ theme: id })}
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[13px] transition active:scale-95 ${settings.theme === id ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
                  >
                    <span className="h-6 w-6 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, #fff, ${c})` }} />
                    {name}
                  </button>
                ))}
              </div>
            </Row>
            <Field label={t('set.nickname')} hint={t('set.nicknameHint')}>
              <TextSetting k="profileName" maxLength={16} placeholder={t('set.nicknamePh')} />
            </Field>
          </Section>

          {/* AI 接入 */}
          <Section icon={Zap} title={t('ai.title')} badge={isAiReady(settings) ? t('ai.ready') : undefined}>
            <Field label={t('ai.baseUrl')} hint={t('ai.baseUrlHint')}>
              <TextSetting k="aiBaseUrl" inputMode="url" placeholder="https://api.openai.com/v1" />
            </Field>
            <Field label={t('ai.apiKey')} hint={t('ai.apiKeyHint')}>
              <TextSetting k="aiKey" secret placeholder="sk-…" />
            </Field>
            <Field label={t('ai.model')} hint={t('ai.modelHint')}>
              <div className="flex gap-2">
                <select
                  className="field min-w-0 flex-1"
                  value={settings.aiModel}
                  disabled={!modelOptions.length}
                  onChange={(e) => update({ aiModel: e.target.value })}
                >
                  {!modelOptions.length && <option value="">{t('ai.modelEmpty')}</option>}
                  {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <button className="btn-soft shrink-0" onClick={loadModels} disabled={busy === 'models'}>
                  {busy === 'models' ? <Loader2 size={15} className="animate-spin" strokeWidth={1.5} /> : <RefreshCw size={15} strokeWidth={1.5} />}
                  {t('ai.fetchModels')}
                </button>
              </div>
            </Field>
            <button className="btn-primary w-full" onClick={runTest} disabled={busy === 'test'}>
              {busy === 'test' ? <Loader2 size={15} className="animate-spin" strokeWidth={1.5} /> : <Zap size={15} strokeWidth={1.5} />}
              {t('ai.test')}
            </button>
            <Status state={aiStatus} />
          </Section>

          {/* AI 性格 */}
          <Section icon={Sparkles} title={t('persona.title')}>
            <div className="flex flex-wrap gap-2">
              {PERSONA_IDS.map((id) => (
                <button key={id} type="button" className="chip" data-on={settings.aiPresetId === id} onClick={() => pickPreset(id)}>
                  {t(`persona.${id}`)}
                </button>
              ))}
            </div>
            <Field hint={t('persona.hint')}>
              <textarea
                className="field resize-none text-[14px] leading-relaxed"
                rows={4}
                value={personaText}
                onChange={(e) => update({ aiPresetId: 'custom', aiPersona: e.target.value })}
                placeholder={t('persona.placeholder')}
              />
            </Field>
          </Section>

          {/* 通知 */}
          <Section icon={Bell} title={t('notif.title')}>
            {sup.needsInstall && (
              <div className="rounded-2xl bg-amber-50/80 px-3.5 py-3 text-[13px] leading-relaxed text-amber-800">{t('notif.iosInstall')}</div>
            )}
            <Row label={t('notif.enable')} hint={`${t('notif.status')}: ${permText}`}>
              <Switch checked={settings.notifyEnabled && perm === 'granted'} onChange={toggleNotify} label={t('notif.enable')} />
            </Row>
            <Row label={t('notif.classRemind')}>
              <select className="field !min-h-[40px] !w-auto !py-1.5" value={settings.classRemindMin} onChange={(e) => update({ classRemindMin: Number(e.target.value) })}>
                {[0, 5, 10, 15, 30].map((n) => <option key={n} value={n}>{n === 0 ? t('notif.off') : t('form.beforeMin', { n })}</option>)}
              </select>
            </Row>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] leading-relaxed text-faint">{t('notif.limit')}</p>
              <button className="btn-soft shrink-0" onClick={sendTest} disabled={perm !== 'granted'}>{t('notif.test')}</button>
            </div>
          </Section>

          {/* 云端（备用） */}
          <Section icon={Cloud} title={t('cloud.title')} badge={settings.cloudSubscribed ? t('cloud.subscribed') : t('cloud.standby')}>
            <p className="text-[13px] leading-relaxed text-muted">{t('cloud.desc')}</p>
            <Field label={t('cloud.url')}>
              <TextSetting k="cloudUrl" inputMode="url" placeholder="https://push.example.com" />
            </Field>
            <Field label={t('cloud.vapid')} hint={t('cloud.vapidHint')}>
              <TextSetting k="cloudVapid" placeholder="BEl62i…" />
            </Field>
            <Field label={t('cloud.token')}>
              <TextSetting k="cloudToken" secret placeholder={t('cloud.tokenPh')} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={cloudSubscribe} disabled={busy === 'cloud'}>
                {busy === 'cloud' && <Loader2 size={15} className="animate-spin" strokeWidth={1.5} />}
                {settings.cloudSubscribed ? t('cloud.resync') : t('cloud.subscribe')}
              </button>
              {settings.cloudSubscribed && <button className="btn-soft" onClick={cloudUnsubscribe}>{t('cloud.unsubscribe')}</button>}
            </div>
            <Status state={cloudStatus} />
          </Section>

          {/* 数据 */}
          <Section icon={Database} title={t('data.title')}>
            <p className="text-[13px] leading-relaxed text-muted">{t('data.desc')}</p>
            <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={doImport} />
            <div className="flex flex-wrap gap-2">
              <button className="btn-soft" onClick={doExport}><Download size={15} strokeWidth={1.5} />{t('data.export')}</button>
              <button className="btn-soft" onClick={() => importRef.current?.click()}><Upload size={15} strokeWidth={1.5} />{t('data.import')}</button>
              <button className="btn-danger" onClick={doWipe}>{t('data.wipe')}</button>
            </div>
          </Section>

          {/* 水印 */}
          <footer className="flex flex-col items-center gap-1 pb-2 pt-4 text-center">
            <UserRound size={14} strokeWidth={1.5} className="text-faint" />
            <span className="text-[13px] tracking-[0.12em] text-faint">by shadow</span>
            <span className="text-[11px] text-faint/80">Komorebi · 木漏 v0.1.0</span>
          </footer>
        </div>
      </div>
    </div>
  )
}
