import { Suspense } from "react";
import SiteHeader from "../SiteHeader";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <div>
      <SiteHeader />
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
