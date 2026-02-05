import "./globals.css";
import PresenceSocket from "../components/PresenceSocket";

export const metadata = {
  title: "Mister Logo API Console",
  description: "Frontend harness for testing the Mister Logo backend.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PresenceSocket />
        {children}
      </body>
    </html>
  );
}
