import "./globals.css";

export const metadata = {
  title: "أمد | Amad",
  description: "أمد: منصة العمر الصحي. نسخة تجريبية للعرض.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@200;300;400;500&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&family=Outfit:wght@200;300;400;500&display=swap"
        />
      </head>
      <body>
        <div className="demo-bar">نسخة تجريبية للعرض. كل البيانات الصحية هنا لأشخاص غير حقيقيين، فلا تُدخل أي بيانات حقيقية.</div>
        {children}
      </body>
    </html>
  );
}
