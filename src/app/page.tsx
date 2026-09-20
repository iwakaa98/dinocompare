import { Calculator, Layers3, ShieldCheck, TimerReset } from "lucide-react";
import { CompareWorkspace } from "@/components/compare-workspace";
import { PopularCatalog } from "@/components/popular-catalog";
import { SearchForm } from "@/components/search-form";
import { getPopularCatalog } from "@/lib/search";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const catalog = await getPopularCatalog();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[radial-gradient(circle_at_70%_40%,rgba(42,163,154,0.35),transparent_55%),linear-gradient(160deg,rgba(11,79,74,0.92),rgba(18,122,114,0.75))] md:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-8 right-10 hidden w-[38%] rounded-[2.5rem] border border-white/20 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22%3E%3Crect fill=%22%230b4f4a%22 width=%22400%22 height=%22480%22/%3E%3Cpath fill=%22%232aa39a%22 opacity=%220.35%22 d=%22M0 320c80-40 140-20 200 10s140 40 200-10v160H0z%22/%3E%3Ccircle cx=%22210%22 cy=%22180%22 r=%2270%22 fill=%22%23d8efea%22 opacity=%220.25%22/%3E%3Cpath stroke=%22%23ffffff%22 stroke-width=%223%22 fill=%22none%22 opacity=%220.5%22 d=%22M120 210c40-60 120-60 160 0%22/%3E%3C/svg%3E')] bg-cover bg-center opacity-90 shadow-[0_40px_100px_rgba(11,79,74,0.35)] md:block animate-float"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
          <div className="max-w-2xl text-left md:pr-8">
            <p className="animate-rise font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--accent-deep)] sm:text-4xl">
              DentSravni
            </p>
            <h1 className="animate-rise-delay mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.08] text-[var(--ink)] sm:text-5xl lg:text-6xl">
              Къде е най-изгодно за кабинета
            </h1>
            <p className="animate-rise mt-5 max-w-lg text-base text-[var(--muted)] sm:text-lg">
              Търсим на живо в десетки български, европейски и международни
              магазини — включително Temu и AliExpress. Отваряме реалната
              продуктова страница и смятаме доставка + митница. Комбинирайте
              само от един сайт.
            </p>
            <div className="animate-rise mt-8">
              <SearchForm initialQuery={query} autofocus={!query} />
            </div>
          </div>
        </div>
      </section>

      <CompareWorkspace query={query} />

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <PopularCatalog
          items={catalog.items}
          refreshedAt={catalog.refreshedAt}
          nextRefreshAt={catalog.nextRefreshAt}
          ttlMinutes={catalog.ttlMinutes}
          cached={catalog.cached}
        />
      </section>

      <section id="how" className="border-t border-[var(--line)]/70 bg-white/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Calculator className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              Реална стойност
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Цената е от страницата на продукта. Доставката и митницата се
              смятат към България, за да видите колко ще платите реално.
            </p>
          </div>
          <div>
            <Layers3 className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              Комбинирай пратка
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Няколко артикула от един магазин = една доставка и една
              куриерска митническа такса. За BG често се покрива и прагът за
              безплатна доставка.
            </p>
          </div>
          <div>
            <TimerReset className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              Кеширан каталог
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Най-търсените продукти се обновяват на ~10 минути, за да е бързо
              зареждането в натоварен кабинет.
            </p>
          </div>
          <div>
            <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              Акаунт и история
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Регистрирайте се, за да пазите скорошните търсения и да се
              връщате към тях с едно кликване.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
