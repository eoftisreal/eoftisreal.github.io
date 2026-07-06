import LoginForm from '@/components/LoginForm';
import SEO from '@/components/SEO';

export default function LoginPage() {
  return (
    <>
      <SEO
        title="Log In"
        description="Log in to your KapdaKraft account to view orders, manage your profile, and shop premium clothing."
      />
      <LoginForm />
    </>
  );
}
