import "./globals.css";

export const metadata = {
  title: "Mister Logo API Console",
  description: "Frontend harness for testing the Mister Logo backend.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
