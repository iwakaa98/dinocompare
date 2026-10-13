import Link from "next/link";
import { PRICING } from "@/lib/pricing";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        ← Начало
      </Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        Планове
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        Free показва колко можете да спестите. Pro отключва живите оферти, линковете
        към магазините и количката Комбинирай.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <article className="rounded-3xl border border-[var(--line)] bg-white/80 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Free</h2>
          <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">0 €</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Teaser при всяко търсене</li>
            <li>Разлика до най-скъпата оферта</li>
            <li>Каталог с реални търсения</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-[var(--accent)] bg-[var(--accent-soft)]/40 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            {PRICING.pro.name}
          </h2>
          <p className="mt-2 text-3xl font-semibold text-[var(--accent-deep)]">
            {PRICING.pro.priceEur} €<span className="text-base font-normal">/мес.</span>
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">{PRICING.pro.description}</p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white"
          >
            Регистрация и Pro
          </Link>
        </article>

        <article className="rounded-3xl border border-[var(--line)] bg-white/80 p-6 sm:col-span-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            {PRICING.clinic.name}
          </h2>
          <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">
            {PRICING.clinic.priceEur} €<span className="text-base font-normal">/мес.</span>
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">{PRICING.clinic.description}</p>
        </article>
      </div>

      <section className="mt-12 rounded-3xl border border-dashed border-[var(--accent)]/50 bg-[var(--accent-soft)]/30 p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Beta за кабинети (5–10 места)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Търсим 5–10 кабинета за 2–4 седмици Pro без такса срещу кратък feedback
          и (по желание) снимка от реална поръчка. Помага ни да калибрираме
          съвпадението на продукти преди финална цена. Пишете на имейла от
          акаунта ви след регистрация или вижте{" "}
          <Link href="/terms" className="text-[var(--accent-deep)] underline">
            условията
          </Link>
          .
        </p>
        <p className="mt-3 text-xs text-[var(--muted)]">
          След beta: очаквана цена Pro {PRICING.pro.priceEur} €/мес. — може да се
          коригира по данни за конверсия.
        </p>
      </section>

      <p className="mt-10 text-xs text-[var(--muted)]">
        Цените са индикативни до потвърждение в магазина. Вижте{" "}
        <Link href="/terms" className="underline">условията</Link>.
      </p>
    </div>
  );
}
