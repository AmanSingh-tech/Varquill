import '../styles/globals.css'

export const metadata = {
  title: 'Varquill — AI Judge',
}

export default function RootLayout({ children }){
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
