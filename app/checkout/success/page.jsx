import { Suspense } from "react";
import SiteHeader from "../../SiteHeader";
import PageTitleRow from "../../PageTitleRow";
import SuccessContent from "./SuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <div>
      <SiteHeader />
      <div className="wrap">
        <PageTitleRow title="결제 완료" />
        <Suspense fallback={null}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
