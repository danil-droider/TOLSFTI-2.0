type OnboardingScreenProps = {
  onSetSalary: () => void;
};

export default function OnboardingScreen({ onSetSalary }: OnboardingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text p-4">
      <h1 className="font-sans text-3xl font-bold tracking-tight text-[#FFFFFF]">
        Goal Ticker
      </h1>

      <div className="mt-16 w-full max-w-sm">
        <section
          className="bg-surface-2 rounded-2xl border border-white/6 p-8 w-full"
        >
          <p className="text-sm font-semibold text-muted tracking-wide">
            Get started
          </p>
          <p className="mt-2 text-text leading-relaxed">
            Set your monthly income to start tracking real-time savings toward
            your goals.
          </p>
        </section>

        <button
          type="button"
          className="mt-8 w-full bg-emerald rounded-xl min-h-[48px] py-3 px-4 text-emerald-text font-bold text-base"
          onClick={onSetSalary}
        >
          Set Monthly Salary
        </button>
      </div>
    </div>
  );
}
