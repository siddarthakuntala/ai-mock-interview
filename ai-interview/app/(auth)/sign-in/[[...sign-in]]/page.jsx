import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100">

      {/* soft background glow */}
      <div className="absolute w-[600px] h-[600px] bg-purple-300/30 rounded-full blur-[120px] top-[-200px] left-[-150px]" />
      <div className="absolute w-[600px] h-[600px] bg-blue-300/30 rounded-full blur-[120px] bottom-[-200px] right-[-150px]" />

      {/* gradient frame */}
      <div className="relative p-[2px] rounded-3xl bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 shadow-[0_25px_60px_rgba(0,0,0,0.15)]">

        {/* glass card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl px-5 py-10 w-[440px]">

          <h1 className="text-4xl font-semibold text-gray-800 text-center mb-6 tracking-tight">
            Welcome
          </h1>

          <SignIn
            appearance={{
              elements: {
                card: "shadow-none bg-transparent",
                formButtonPrimary:
                  "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg",
                footerActionLink:
                  "text-indigo-600 hover:text-indigo-800",
              },
            }}
          />

        </div>
      </div>

    </div>
  );
}