// Komponen dasar ringan Teman Belajarku (pengganti pustaka UI berat).

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ---------- Kartu ---------- */
export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn("rounded-3xl border bg-card text-card-foreground shadow-[var(--shadow-soft)]", onClick && "cursor-pointer active:scale-[0.99] transition-transform", className)}
    >
      {children}
    </div>
  );
}

/* ---------- Tombol ---------- */
const gayaTombol = cva(
  "inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:brightness-110",
        soft: "bg-secondary text-secondary-foreground hover:brightness-95 dark:hover:brightness-110",
        outline: "border-2 border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        danger: "bg-destructive text-destructive-foreground hover:brightness-110",
        warning: "bg-accent text-accent-foreground hover:brightness-105",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface PropsTombol extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof gayaTombol> {}
export function Button({ className, variant, size, ...props }: PropsTombol) {
  return <button className={cn(gayaTombol({ variant, size }), className)} {...props} />;
}

/* ---------- Formulir ---------- */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <label className={cn("mb-1.5 block text-sm font-bold text-foreground/80", className)}>{children}</label>;
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const gayaInput =
  "w-full rounded-2xl border-2 border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(gayaInput, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(gayaInput, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(gayaInput, "appearance-none bg-[image:var(--caret)] bg-no-repeat pr-9", className)} {...props}>
      {children}
    </select>
  );
}

/* ---------- Modal (gaya bottom sheet) ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full max-h-[88vh] overflow-y-auto rounded-t-[2rem] bg-card p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom-6 fade-in duration-300 sm:max-w-lg sm:rounded-4xl sm:pb-5",
          wide && "sm:max-w-2xl",
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold leading-tight">{title}</h2>
          <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Tutup" className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Dialog konfirmasi ---------- */
export function ConfirmDialog({ open, title, description, confirmLabel = "Hapus", danger, onConfirm, onClose }: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description && <p className="mb-5 text-sm text-muted-foreground">{description}</p>}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Batal
        </Button>
        <Button variant={danger ? "danger" : "primary"} className="flex-1" onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------- Kondisi kosong ---------- */
export function EmptyState({ icon, judul, deskripsi, aksi }: { icon: ReactNode; judul: string; deskripsi?: string; aksi?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-soft text-primary">{icon}</div>
      <p className="font-display text-base font-bold">{judul}</p>
      {deskripsi && <p className="mt-1 max-w-60 text-sm text-muted-foreground">{deskripsi}</p>}
      {aksi && <div className="mt-4">{aksi}</div>}
    </div>
  );
}

/* ---------- Bilah kemajuan ---------- */
export function Progress({ value, className, tone = "primary" }: { value: number; className?: string; tone?: "primary" | "success" | "warning" }) {
  const warna = tone === "success" ? "bg-success" : tone === "warning" ? "bg-accent" : "bg-primary";
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", warna)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ---------- Lencana ---------- */
export function Pill({ children, className, tone = "secondary" }: { children: ReactNode; className?: string; tone?: "secondary" | "warning" | "success" | "danger" | "primary" }) {
  const map = {
    secondary: "bg-secondary text-secondary-foreground",
    warning: "bg-accent text-accent-foreground",
    success: "bg-success text-success-foreground",
    danger: "bg-destructive/15 text-destructive",
    primary: "bg-primary/10 text-primary dark:bg-primary/20",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", map[tone], className)}>{children}</span>;
}

/* ---------- Judul bagian ---------- */
export function SectionTitle({ children, aksi }: { children: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="font-display text-lg font-bold">{children}</h2>
      {aksi}
    </div>
  );
}

/* ---------- Pemilih tersegmentasi ---------- */
export function Segmented<T extends string>({ options, value, onChange, className }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition-all",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
