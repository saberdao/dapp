import React from "react";

export default function Terms() {
  const [termsChecked, setTermsChecked] = React.useState(false);
  const [privacyChecked, setPrivacyChecked] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);

  React.useEffect(() => {
    const agreedValue = localStorage.getItem("termsAndPrivacyAgreed11Mar2025");
    if (agreedValue === "true") {
      setAgreed(true);
      return;
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem("termsAndPrivacyAgreed11Mar2025", "true");
    setAgreed(true);
  };

  if (agreed) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 text-gray-100">
        <h2 className="text-2xl font-bold mb-4">Terms & Privacy</h2>
        <p className="mb-6">
          To use this site, you must agree to the following:
        </p>

        <div className="space-y-4 mb-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              className="mt-1 mr-3"
            />
            <span>
              I agree to the{" "}
              <a
                href="https://saberdao.so/terms"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                Terms of Service
              </a>
            </span>
          </label>

          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              className="mt-1 mr-3"
            />
            <span>
              I agree to the{" "}
              <a
                href="https://saberdao.so/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        <button
          disabled={!termsChecked || !privacyChecked}
          onClick={handleAgree}
          className={`w-full py-2 px-4 rounded ${
            termsChecked && privacyChecked
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-700 cursor-not-allowed text-gray-400"
          }`}
        >
          I Agree
        </button>
      </div>
    </div>
  );
}
