import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="absolute top-6 right-6">
        <Show when="signed-out">
          <div className="flex gap-3">
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-pink-500 text-white rounded-lg">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 bg-gray-800 text-white rounded-lg">Sign Up</button>
            </SignUpButton>
          </div>
        </Show>

        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>

      <h1 className="text-3xl font-bold">Welcome to shaadikrlo.com</h1>
    </main>
  )
}