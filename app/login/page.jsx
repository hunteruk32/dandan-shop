import { Suspense } from "react";
import SiteHeader from "../SiteHeader";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div>
      <SiteHeader />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
