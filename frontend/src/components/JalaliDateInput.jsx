import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LuCalendarDays, LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import {
  PERSIAN_MONTHS,
  isoToJalaliInput,
  jalaliInputToISO,
  jalaliMonthLength,
  jalaliToISO,
  parseISODate,
  todayISO,
  toJalaliParts,
} from '../utils/date'
import { faDigits } from '../utils/format'

const WEEKDAY_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
const POPOVER_WIDTH = 322
const POPOVER_HEIGHT = 372

function viewOf(iso) {
  const parts = toJalaliParts(iso) || toJalaliParts(todayISO())
  return { jy: parts.jy, jm: parts.jm }
}

export default function JalaliDateInput({
  id,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
  placeholder,
  readOnly = false,
}) {
  const [text, setText] = useState(value ? isoToJalaliInput(value) : '')
  const [internalError, setInternalError] = useState('')
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => viewOf(value))
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const rootRef = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    setText(value ? isoToJalaliInput(value) : '')
    setInternalError('')
  }, [value])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event) => {
      if (
        rootRef.current?.contains(event.target) ||
        popoverRef.current?.contains(event.target)
      ) {
        return
      }
      setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeOnScroll = () => setOpen(false)

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', closeOnScroll)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', closeOnScroll)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [open])

  const selected = useMemo(() => toJalaliParts(value), [value])
  const today = useMemo(() => toJalaliParts(todayISO()), [])

  const years = useMemo(() => {
    const base = today?.jy ?? view.jy
    const list = []
    for (let year = base - 20; year <= base + 3; year += 1) list.push(year)
    if (!list.includes(view.jy)) list.push(view.jy)
    return [...new Set(list)].sort((a, b) => a - b)
  }, [today?.jy, view.jy])

  const monthLength = jalaliMonthLength(view.jy, view.jm)
  const firstDayISO = jalaliToISO(view.jy, view.jm, 1)
  const firstWeekday = firstDayISO ? parseISODate(firstDayISO)?.getDay() ?? 0 : 0
  const leadingBlanks = (firstWeekday + 1) % 7

  const cells = useMemo(() => {
    const days = Array.from({ length: monthLength }, (_, index) => index + 1)
    return [...Array.from({ length: leadingBlanks }, () => null), ...days]
  }, [monthLength, leadingBlanks])

  const openPicker = () => {
    if (disabled) return
    const rect = rootRef.current?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(
        Math.max(12, rect.left),
        Math.max(12, window.innerWidth - POPOVER_WIDTH - 12),
      )
      let top = rect.bottom + 8
      if (top + POPOVER_HEIGHT > window.innerHeight) {
        top = Math.max(12, window.innerHeight - POPOVER_HEIGHT - 12)
      }
      setPosition({ top, left })
    }
    setView(viewOf(value))
    setOpen(true)
    setInternalError('')
  }

  const commit = (iso) => {
    setText(isoToJalaliInput(iso))
    setInternalError('')
    onChange?.(iso)
  }

  const chooseDay = (day) => {
    const iso = jalaliToISO(view.jy, view.jm, day)
    if (!iso) return
    commit(iso)
    setOpen(false)
  }

  const chooseToday = () => {
    const iso = todayISO()
    commit(iso)
    setView(viewOf(iso))
    setOpen(false)
  }

  const shiftMonth = (delta) => {
    setView((current) => {
      let month = current.jm + delta
      let year = current.jy
      if (month < 1) {
        month = 12
        year -= 1
      } else if (month > 12) {
        month = 1
        year += 1
      }
      return { jy: year, jm: month }
    })
  }

  const handleChange = (event) => {
    const next = event.target.value
    setText(next)
    setInternalError('')
    const iso = jalaliInputToISO(next)
    onChange?.(iso)
  }

  const handleBlur = () => {
    if (readOnly) return
    if (!text.trim()) {
      setInternalError('تاریخ را وارد کنید.')
      return
    }
    const iso = jalaliInputToISO(text)
    if (!iso) {
      setInternalError('تاریخ شمسی معتبر نیست؛ نمونه: ۱۴۰۵/۰۸/۱۱')
      return
    }
    setInternalError('')
    setText(isoToJalaliInput(iso))
    onChange?.(iso)
  }

  const message = internalError || error
  const isCurrentMonth =
    selected && selected.jy === view.jy && selected.jm === view.jm

  const popover = open
    ? createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="انتخاب تاریخ شمسی"
          className="fixed z-[120] rounded-2xl border border-white/[0.09] bg-[#141414] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
          style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
        >
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/55 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="ماه قبل"
            >
              <LuChevronRight className="size-4" />
            </button>

            <div className="flex flex-1 items-center justify-center gap-1.5">
              <select
                value={view.jm}
                onChange={(event) =>
                  setView((current) => ({ ...current, jm: Number(event.target.value) }))
                }
                className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-2 py-1.5 text-[11px] text-white/80 outline-none transition hover:border-white/20 focus:border-meat-red/50"
                style={{ colorScheme: 'dark' }}
                aria-label="انتخاب ماه"
              >
                {PERSIAN_MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={view.jy}
                onChange={(event) =>
                  setView((current) => ({ ...current, jy: Number(event.target.value) }))
                }
                className="w-[92px] rounded-lg border border-white/[0.08] bg-[#0f0f0f] px-2 py-1.5 text-[11px] text-white/80 outline-none transition hover:border-white/20 focus:border-meat-red/50"
                style={{ colorScheme: 'dark' }}
                aria-label="انتخاب سال"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {faDigits(year)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex size-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/55 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="ماه بعد"
            >
              <LuChevronLeft className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1 text-[9px] text-white/30">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <span key={`blank-${index}`} />
              const isToday =
                today && today.jy === view.jy && today.jm === view.jm && today.jd === day
              const isSelected = isCurrentMonth && selected?.jd === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => chooseDay(day)}
                  className={`flex h-9 items-center justify-center rounded-lg text-[11px] font-medium transition ${
                    isSelected
                      ? 'bg-red-sheen text-white shadow-red-glow'
                      : isToday
                        ? 'border border-meat-red/40 bg-meat-red/10 text-white'
                        : 'text-white/65 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  {faDigits(day)}
                </button>
              )
            })}
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
            <button
              type="button"
              onClick={chooseToday}
              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-red-200/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              امروز
            </button>
            <span className="text-[9px] text-white/30">
              {PERSIAN_MONTHS[view.jm - 1]} {faDigits(view.jy)}
            </span>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className={className} ref={rootRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onClick={readOnly ? openPicker : undefined}
          readOnly={readOnly}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder || isoToJalaliInput(todayISO())}
          className={`input pl-11 text-right tracking-wide ${
            readOnly ? 'cursor-pointer' : ''
          } ${message ? 'input-error' : ''}`}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          disabled={disabled}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/35 transition hover:bg-white/[0.06] hover:text-white/75 disabled:opacity-40"
          aria-label="باز کردن تقویم شمسی"
          aria-expanded={open}
          title="انتخاب از تقویم"
        >
          <LuCalendarDays className="size-[17px]" />
        </button>
      </div>
      {message && (
        <p id={`${id}-error`} className="mt-1.5 text-[10px] text-red-300">
          {message}
        </p>
      )}
      {popover}
    </div>
  )
}
