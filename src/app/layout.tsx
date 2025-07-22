import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { Montserrat } from "next/font/google";
import { ToastContainer } from "react-toastify";

const font = Montserrat({
  subsets: ["latin"],
  weight: ["200", "400", "500", "600", "700"],
});

export const metadata = {
  title: "OMNHSYNC",
  description: "Occidental Mindoro National High School Sync",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${font.className} tracking-wide flex flex-col w-screen font-[500] h-screen overflow-x-hidden`}>
          <ToastContainer />
          {children}
      </body>
    </html>
  );
}