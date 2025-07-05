import "./globals.css";
import { Poppins } from "next/font/google";
import { ToastContainer } from "react-toastify";

const font = Poppins({
  subsets: ["latin"],
  weight: ["200", "400", "500", "600", "700"],
});

export const metadata = {
  title: "OMNHS SYNC",
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