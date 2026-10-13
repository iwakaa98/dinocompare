import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 prose prose-sm max-w-none">
      <Link href="/" className="text-sm text-[var(--muted)] no-underline hover:text-[var(--ink)]">
        ← Начало
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Условия и отговорност
      </h1>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          DentSravni сравнява публично показани цени и заглавия от онлайн магазини.
          Не сме дистрибутор и не продаваме стока. Преди поръчка винаги проверете
          продуктовата страница в магазина — особено дали става дума за основен
          продукт, комплект или консуматив (напр. накрайници).
        </p>
        <p>
          Показаните суми включват наша калкулация за доставка и такси към България,
          когато е възможно. Реалната каса в магазина може да се различава (промоции,
          ДДС, минимални поръчки, наличност).
        </p>
        <p>
          Абонаментът Pro/Clinic дава достъп до инструмента за сравнение, не до
          отстъпка от търговците. Можете да отмените през Stripe Customer Portal
          след вход.
        </p>
        <p>
          За beta кабинети: пишете ни с feedback и снимки от реални поръчки —
          помага да подобрим съвпадението на продуктите.
        </p>
        <p>
          Лични данни: имейл и акаунт за вход; плащанията обработва Stripe. Не
          продаваме данни на трети лица.
        </p>
      </section>
    </div>
  );
}
