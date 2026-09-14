import { Suspense } from "react";
import SiteHeader from "../../SiteHeader";
import PageTitleRow from "../../PageTitleRow";
import FailContent from "./FailContent";

export default function CheckoutFailPage() {
  return (
    <div>
      <SiteHeader />
      <div className="wrap">
        <PageTitleRow title="결제 실패" />
        <Suspense fallback={null}>
          <FailContent />
        </Suspense>
      </div>
    </div>
  );
}
