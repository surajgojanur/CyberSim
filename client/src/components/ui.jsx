import React from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clipboard,
  Crown,
  Loader2,
  Lock,
  LogOut,
  Radio,
  Shield,
  ShieldAlert,
  Signal,
  Sparkles,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  X
} from "lucide-react";
import { cn, participantStatusLabel, participantStatusTone } from "../app/utils";

const panelBase =
  "border border-white/10 bg-slate-950/55 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl";

const pageVariants = {
  initial: { opacity: 0, y: 14, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(6px)" }
};

const listVariants = {
  animate: {
    transition: {
      staggerChildren: 0.045
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

export function AppShell({ children, takeoverMessage }) {
  const reduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-screen overflow-hidden bg-[#050712] text-zinc-100">
        <CyberBackground />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <BrandHeader />
          {takeoverMessage && (
            <ErrorBanner className="mb-6" title="Session taken over">
              {takeoverMessage}. This tab is now read-only.
            </ErrorBanner>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.hash || "#/admin"}
              variants={reduceMotion ? undefined : pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="flex-1 pb-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </MotionConfig>
  );
}

export function CyberBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(99,102,241,0.14),transparent_28%),linear-gradient(180deg,#050712_0%,#09111f_48%,#050712_100%)]" />
      <div className="cyber-grid absolute inset-0" />
      <div className="cyber-noise absolute inset-0 opacity-[0.08]" />
      <div className="radar-sweep absolute right-[-12rem] top-[-14rem] h-[38rem] w-[38rem] rounded-full opacity-45 sm:right-[-6rem]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
    </div>
  );
}

export function BrandHeader() {
  return (
    <header className={cn("mb-6 rounded-[28px] px-4 py-3 sm:px-5", panelBase)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <a href="#/admin" className="group inline-flex min-w-0 items-center gap-3">
          <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.18)]">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-slate-950 bg-emerald-300" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/80">CyberSim</span>
            <span className="block truncate text-base font-semibold text-white sm:text-lg">Live Cyber Drill Interface</span>
          </span>
        </a>
        <nav className="flex flex-wrap gap-2 text-sm text-zinc-300" aria-label="Primary">
          <NavLink href="#/admin">Admin</NavLink>
          <NavLink href="#/join">Join</NavLink>
        </nav>
      </div>
    </header>
  );
}

export function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

export function PageShell({ eyebrow, title, description, children, aside, className = "" }) {
  return (
    <div className={cn("grid gap-6", className)}>
      <HeroPanel eyebrow={eyebrow} title={title} description={description}>
        {aside}
      </HeroPanel>
      {children}
    </div>
  );
}

export function GlassCard({ children, className = "", as = "section" }) {
  const Component = as;
  return (
    <Component
      className={cn(
        "relative overflow-hidden rounded-[28px] p-5 transition duration-200 hover:border-white/15 sm:p-6",
        panelBase,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
      {children}
    </Component>
  );
}

export function GlassPanel(props) {
  return <GlassCard {...props} />;
}

export function HeroPanel({ eyebrow, title, description, children, className = "" }) {
  return (
    <GlassCard className={cn("hero-panel", className)}>
      <div className="relative z-10">
        {eyebrow && (
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/80">
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-normal text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">{description}</p>}
        {children}
      </div>
    </GlassCard>
  );
}

export function Field({ label, value, onChange, type = "text", onBlur, placeholder, inputClassName = "", autoComplete }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-200">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onBlur={onBlur}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-zinc-100 outline-none transition duration-200 placeholder:text-zinc-500 focus:border-cyan-300/60 focus:bg-black/35 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.1)]",
          inputClassName
        )}
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-200">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-zinc-100 outline-none transition duration-200 placeholder:text-zinc-500 focus:border-cyan-300/60 focus:bg-black/35 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.1)]"
      />
    </label>
  );
}

export function Select({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-zinc-100 outline-none transition duration-200 focus:border-cyan-300/60 focus:bg-black/35 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.1)]"
      >
        {children}
      </select>
    </label>
  );
}

export function MessageBanner({ children, tone = "danger", className = "" }) {
  const toneClass = {
    danger: "border-rose-400/35 bg-rose-400/10 text-rose-100",
    info: "border-cyan-300/35 bg-cyan-400/10 text-cyan-100",
    success: "border-emerald-400/35 bg-emerald-400/10 text-emerald-100",
    warning: "border-amber-400/35 bg-amber-400/10 text-amber-100",
    muted: "border-white/10 bg-white/[0.05] text-zinc-200"
  }[tone];

  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm leading-6", toneClass, className)} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function ErrorBanner({ title = "Error", children, className = "" }) {
  return (
    <MessageBanner tone="danger" className={cn("flex items-start gap-3", className)}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-rose-100/85">{children}</span>
      </span>
    </MessageBanner>
  );
}

export function Button({ children, className = "", tone = "primary", icon: Icon, ...props }) {
  const toneClass = {
    primary:
      "border-cyan-200/50 bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 text-slate-950 shadow-[0_16px_34px_rgba(34,211,238,0.24)] hover:shadow-[0_18px_44px_rgba(125,211,252,0.28)]",
    secondary: "border-cyan-300/20 bg-cyan-300/10 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/15",
    danger: "border-rose-300/25 bg-rose-400/10 text-rose-100 hover:border-rose-300/40 hover:bg-rose-400/15",
    ghost: "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08]"
  }[tone];

  return (
    <motion.button
      whileHover={props.disabled ? undefined : { y: -2 }}
      whileTap={props.disabled ? undefined : { scale: 0.985 }}
      {...props}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-zinc-500 disabled:shadow-none",
        toneClass,
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </motion.button>
  );
}

export function MetricCard({ label, value, hint, accent = "cyan", className = "", icon: Icon }) {
  const accentClass = {
    cyan: "text-cyan-100 bg-cyan-300/10 border-cyan-300/20",
    emerald: "text-emerald-100 bg-emerald-300/10 border-emerald-300/20",
    violet: "text-violet-100 bg-violet-300/10 border-violet-300/20",
    amber: "text-amber-100 bg-amber-300/10 border-amber-300/20",
    rose: "text-rose-100 bg-rose-300/10 border-rose-300/20"
  }[accent];

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition duration-200 hover:-translate-y-1 hover:border-white/15",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500">{label}</p>
        {Icon && (
          <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl border", accentClass)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 break-words text-3xl font-semibold tracking-normal text-white">{value}</p>
      {hint && <p className="mt-2 text-sm leading-5 text-zinc-400">{hint}</p>}
    </motion.div>
  );
}

export const StatCard = MetricCard;

export function JoinCodeDisplay({ joinCode }) {
  async function copyCode() {
    if (!joinCode || !navigator.clipboard) return;
    await navigator.clipboard.writeText(joinCode);
  }

  return (
    <div className="rounded-[24px] border border-cyan-300/30 bg-cyan-300/10 px-6 py-5 text-center shadow-[0_0_44px_rgba(34,211,238,0.14)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Join code</p>
      <button
        type="button"
        onClick={copyCode}
        className="group mt-2 inline-flex items-center justify-center gap-3 rounded-2xl px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        aria-label="Copy join code"
      >
        <span className="font-mono text-3xl font-bold tracking-[0.35em] text-cyan-50 sm:text-5xl">{joinCode || "------"}</span>
        <Clipboard className="h-5 w-5 text-cyan-100/65 transition group-hover:text-cyan-50" aria-hidden="true" />
      </button>
    </div>
  );
}

export function StatusPill({ children, tone = "muted", icon: Icon }) {
  const toneClass = {
    success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
    warning: "border-amber-400/25 bg-amber-400/10 text-amber-100",
    danger: "border-rose-400/25 bg-rose-400/10 text-rose-100",
    info: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
    muted: "border-white/10 bg-white/[0.05] text-zinc-200"
  }[tone];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", toneClass)}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

export const StatusBadge = StatusPill;

export function PhaseHero({ phase, description, actionSlot, timerSlot }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Session phase</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold capitalize text-white">{phase}</h2>
            <StatusPill tone={phaseTone(phase)} icon={phaseIcon(phase)}>
              {phase}
            </StatusPill>
          </div>
          <p className="mt-3 max-w-2xl text-zinc-300">{description}</p>
        </div>
        <div className="flex flex-col gap-4 xl:items-end">
          {timerSlot}
          <div className="flex flex-wrap gap-3">{actionSlot}</div>
        </div>
      </div>
    </GlassCard>
  );
}

export function CountdownRing({ remainingSeconds, totalSeconds = 45 }) {
  return <TimerRing remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} />;
}

export function TimerRing({ remainingSeconds, totalSeconds = 45 }) {
  const safeTotal = Math.max(totalSeconds, remainingSeconds, 1);
  const ratio = Math.max(0, Math.min(1, remainingSeconds / safeTotal));
  const circumference = 2 * Math.PI * 38;
  const urgent = remainingSeconds <= 10;

  return (
    <div className={cn("timer-shell rounded-[24px] border bg-black/20 px-4 py-3 text-center", urgent ? "border-amber-300/35" : "border-white/10")}>
      <div className="relative mx-auto h-24 w-24">
        <svg viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="7" />
          <motion.circle
            cx="48"
            cy="48"
            r="38"
            fill="none"
            stroke={urgent ? "rgb(252 211 77)" : "rgb(103 232 249)"}
            strokeLinecap="round"
            strokeWidth="7"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - ratio) }}
            transition={{ duration: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div>
            <p className={cn("text-3xl font-semibold", urgent ? "text-amber-100" : "text-cyan-100")}>{remainingSeconds}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">sec</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OptionCard({ checked, disabled, label, value, isCorrect, isIncorrectReveal, onChange }) {
  return (
    <motion.label
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      className={cn(
        "option-card group block cursor-pointer rounded-[24px] border p-4 transition duration-200",
        checked && "border-cyan-300/55 bg-cyan-400/10 shadow-[0_16px_44px_rgba(34,211,238,0.14)]",
        isCorrect && "border-emerald-400/45 bg-emerald-400/10 text-emerald-50",
        isIncorrectReveal && "border-rose-400/30 bg-rose-400/10 text-zinc-300",
        disabled && "cursor-not-allowed opacity-80"
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25 text-xs font-semibold text-zinc-300 transition duration-200",
            checked && "border-cyan-300/50 bg-cyan-300/15 text-cyan-100",
            isCorrect && "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
          )}
        >
          {isCorrect ? <Check className="h-4 w-4" aria-hidden="true" /> : label}
        </span>
        <div className="min-w-0 flex-1">
          <input
            type="radio"
            name="answer"
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="sr-only"
          />
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-medium leading-7 text-current">{value}</p>
            {isCorrect && <StatusPill tone="success">Correct</StatusPill>}
          </div>
        </div>
      </div>
    </motion.label>
  );
}

export function AnimatedList({ children, className = "", as = "div" }) {
  const Component = motion[as] || motion.div;
  return (
    <Component variants={listVariants} initial="initial" animate="animate" className={className}>
      {children}
    </Component>
  );
}

export function Leaderboard({ leaderboard, currentParticipantId = null, compact = false }) {
  if (!leaderboard?.length) {
    return <EmptyState icon={Trophy} title="No leaderboard yet" description="Standings will appear after the server publishes a reveal." />;
  }

  const maxScore = Math.max(...leaderboard.map((entry) => entry.totalScore || 0), 1);

  return (
    <motion.ol variants={listVariants} initial="initial" animate="animate" className="grid gap-3">
      {leaderboard.map((entry, index) => (
        <LeaderboardCard
          key={entry.participantId}
          entry={entry}
          index={index}
          maxScore={maxScore}
          compact={compact}
          isCurrent={entry.participantId === currentParticipantId}
        />
      ))}
    </motion.ol>
  );
}

export function LeaderboardCard({ entry, index, maxScore, isCurrent = false, compact = false }) {
  const podiumTone =
    entry.rank === 1
      ? "border-amber-300/35 bg-amber-300/10"
      : entry.rank === 2
        ? "border-sky-200/25 bg-sky-200/10"
        : entry.rank === 3
          ? "border-violet-300/25 bg-violet-300/10"
          : "border-white/10 bg-black/15";
  const pct = Math.max(4, Math.round(((entry.totalScore || 0) / maxScore) * 100));

  return (
    <motion.li
      layout
      variants={itemVariants}
      transition={{ duration: 0.22, delay: index * 0.02 }}
      className={cn(
        "rounded-[22px] border px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25",
        podiumTone,
        isCurrent && "ring-1 ring-cyan-300/45"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] font-semibold text-zinc-100">
            {entry.rank === 1 ? <Crown className="h-5 w-5 text-amber-200" aria-hidden="true" /> : `#${entry.rank}`}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{entry.displayName}</p>
            <p className="text-sm text-zinc-500">{entry.correctCount ?? 0} correct answers</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-cyan-100">{entry.totalScore}</p>
          {isCurrent && <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">You</p>}
        </div>
      </div>
      {!compact && <ProgressBar className="mt-4" value={pct} tone={entry.rank === 1 ? "amber" : "cyan"} ariaLabel={`${entry.displayName} score bar`} />}
    </motion.li>
  );
}

export function ParticipantAvatar({ name = "?" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-50">
      {initials || "?"}
    </span>
  );
}

export function PresencePill({ status }) {
  const tone = participantStatusTone(status);
  const Icon = status === "connected" ? Wifi : status === "left" ? LogOut : WifiOff;
  return (
    <StatusPill tone={tone} icon={Icon}>
      {participantStatusLabel(status)}
    </StatusPill>
  );
}

export function ParticipantGrid({ participants }) {
  if (!participants.length) {
    return <EmptyState icon={Users} title="No participants yet" description="Share the join code to populate the live roster." />;
  }

  return (
    <motion.div layout variants={listVariants} initial="initial" animate="animate" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence initial={false}>
        {participants.map((participant) => (
          <motion.article
            layout
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            key={participant.id}
            className="tilt-card rounded-[22px] border border-white/10 bg-black/15 p-4 transition duration-200 hover:border-cyan-300/25"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <ParticipantAvatar name={participant.displayName} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{participant.displayName}</p>
                  <p className="mt-1 text-sm text-zinc-500">Participant #{participant.id}</p>
                </div>
              </div>
              <PresencePill status={participant.status} />
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export function SummaryList({ items }) {
  if (!items.length) {
    return <EmptyState title="No round outcomes yet" description="Participant outcomes publish during reveal." />;
  }

  return (
    <motion.ul variants={listVariants} initial="initial" animate="animate" className="grid gap-3">
      {items.map((item) => (
        <motion.li key={item.key} variants={itemVariants} className="rounded-[22px] border border-white/10 bg-black/15 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{item.label}</p>
              {item.meta && <p className="mt-1 text-sm text-zinc-500">{item.meta}</p>}
            </div>
            <p className={cn("text-sm font-semibold", item.toneClass)}>{item.value}</p>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export function ProgressBar({ value, max = 100, tone = "cyan", className = "", ariaLabel }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));
  const fillClass = {
    cyan: "from-cyan-300 to-sky-400",
    emerald: "from-emerald-300 to-cyan-300",
    amber: "from-amber-200 to-orange-300",
    violet: "from-violet-300 to-cyan-300",
    rose: "from-rose-300 to-orange-300"
  }[tone];

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/10", className)} role="progressbar" aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <motion.div
        className={cn("h-full rounded-full bg-gradient-to-r", fillClass)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

export function AnswerProgress({ answered = 0, total = 0, className = "" }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className={cn("rounded-[24px] border border-white/10 bg-black/15 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Answer progress</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {answered} / {total}
          </p>
        </div>
        <StatusPill tone={total > 0 && answered >= total ? "success" : "info"} icon={Signal}>
          {pct}%
        </StatusPill>
      </div>
      <ProgressBar className="mt-4" value={pct} tone={total > 0 && answered >= total ? "emerald" : "cyan"} ariaLabel="Answered participant progress" />
      <div className="mt-3 grid grid-cols-12 gap-1" aria-hidden="true">
        {Array.from({ length: Math.max(total, 1) }).map((_, index) => (
          <span
            key={index}
            className={cn("h-2 rounded-full", index < answered ? "bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.45)]" : "bg-white/10")}
          />
        ))}
      </div>
    </div>
  );
}

export function LoadingState({ title = "Loading", description = "Fetching the latest server state." }) {
  return (
    <GlassCard className="max-w-xl">
      <div className="flex items-center gap-4">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-200" aria-hidden="true" />
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
      </div>
    </GlassCard>
  );
}

export function EmptyState({ icon: Icon = ShieldAlert, title = "Nothing here yet", description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-100">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-white">{title}</p>
      {description && <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>}
    </div>
  );
}

export function RevealBurst({ correct }) {
  return (
    <div className={cn("reveal-panel rounded-[24px] border p-4", correct ? "border-emerald-300/25 bg-emerald-300/10" : "border-amber-300/25 bg-amber-300/10")}>
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl", correct ? "bg-emerald-300/15 text-emerald-100" : "bg-amber-300/15 text-amber-100")}>
          {correct ? <Sparkles className="h-5 w-5" aria-hidden="true" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
        </span>
        <div>
          <p className="font-semibold text-white">{correct ? "Correct response" : "Response reviewed"}</p>
          <p className="text-sm text-zinc-400">{correct ? "Score delta was awarded by the server." : "No score was awarded for this round."}</p>
        </div>
      </div>
    </div>
  );
}

function phaseTone(phase) {
  if (phase === "question") return "info";
  if (phase === "locked") return "warning";
  if (phase === "reveal" || phase === "ended") return "success";
  return "muted";
}

function phaseIcon(phase) {
  if (phase === "question") return Radio;
  if (phase === "locked") return Lock;
  if (phase === "reveal" || phase === "ended") return Trophy;
  if (phase === "error") return X;
  return Shield;
}
