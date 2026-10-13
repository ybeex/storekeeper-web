import { MarketingFooter, MarketingNav } from "@/components/marketing";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main id="top">{children}</main>
      <MarketingFooter />
    </>
  );
}
