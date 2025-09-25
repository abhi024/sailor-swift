import { GoogleLogin } from "@react-oauth/google";

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
  size?: "large" | "medium" | "small";
  width?: string;
}

export function GoogleLoginButton({
  onSuccess,
  onError,
  size = "large",
  width = "100%",
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
        size={size}
        width={width}
      />
    </div>
  );
}
