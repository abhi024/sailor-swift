import { GoogleLogin } from "@react-oauth/google";

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
}

export function GoogleLoginButton({
  onSuccess,
  onError,
}: GoogleLoginButtonProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSuccess = (credentialResponse: any) => {
    if (credentialResponse?.credential) {
      onSuccess(credentialResponse.credential);
    } else {
      onError();
    }
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={onError}
        useOneTap={false}
        theme="outline"
        text="continue_with"
        shape="pill"
        size="large"
        width="100%"
      />
    </div>
  );
}
