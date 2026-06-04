export const SiteFooter = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 h-14">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <img src="/hirelens-icon.png" alt="HireLens Icon" className="w-4 h-4 object-contain opacity-70 grayscale" />
          <p>HireLens<span className="text-accent">.</span></p>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-3 h-px bg-border" />
          Built by{" "}
          <span className="font-medium text-foreground tracking-wide">
            Saurav Kumar
          </span>
          <span className="inline-block w-3 h-px bg-border" />
          &copy; {year}
        </p>
      </div>
    </footer>
  );
};
