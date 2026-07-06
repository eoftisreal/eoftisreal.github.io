import SignupForm from '@/components/SignupForm';
import SEO from '@/components/SEO';

export default function SignupPage() {
  return (
    <>
      <SEO
        title="Create an Account"
        description="Create a new KapdaKraft account to shop premium clothing, track your orders, and receive exclusive updates."
      />
      <SignupForm />
    </>
  );
}
