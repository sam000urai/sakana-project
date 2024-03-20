import { Inter } from 'next/font/google'
import Layout from '@/components/Layout';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <Layout>
      <section className="text-gray-600 body-font">
        <div className="max-w-7xl mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
          <div className="lg:flex-grow md:w-1/2 md:ml-24 pt-6 flex flex-col md:items-start md:text-left mb-40 items-center text-center">
            <h1 className="mb-5 sm:text-6xl text-5xl items-center xl:w-2/2 text-gray-900">
              あなただけの本棚をつくろう
            </h1>
            <p className="mb-4 xl:w-3/4 text-gray-600 text-lg">
              読書管理サービス「Sakudoku」は、SNS機能、積読管理、メモ機能などのシンプルな機能で、あなたの読書管理を手助けします。さぁ、あなただけの本棚をつくりましょう。
            </p>

            <div className="flex justify-center overflow-hidden">
              <a
                className="inline-flex items-center px-10 py-3 mt-0 font-medium text-white transition duration-300 ease-in-out transform bg-blue-500 border rounded-full hover:bg-blue-800 hover:scale-100"
                href="/login"
                style={{
                  flexShrink: 0,
                  textDecoration: 'none',
                  display: 'inline-block',
                  width: 'fit-content',
                  borderRadius: '999px', // 999px は大きな値で、ほぼ丸く見える効果を持ちます
                }}
              >
                <span className="justify-center">登録する</span>
              </a>
            </div>
          </div>
          <div className="xl:mr-44 sm:mr-0 sm:mb-28 mb-0 lg:mb-0 mr-48 md:pl-10">
            <img
              className="w-80 md:ml-1 ml-24"
              alt="iPhoneアプリ"
              src="/images/toppage.png"
            ></img>
          </div>
        </div>

        {/* <section className="mx-auto">
          <div className="container px-5 mx-auto lg:px-24 ">
            <div className="flex flex-col w-full mb-4 text-left lg:text-center">
              <h1 className="mb-8 text-2xl Avenir font-semibold text-black">
                パートナー企業
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-16 mb-16 text-center lg:grid-cols-4">
              <div className="flex items-center justify-center">
                <img
                  src="/images/Google-Logo.webp"
                  alt="Google Logo"
                  className="block object-contain h-16 greyC"
                ></img>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/images/Shopify-Logo.svg"
                  alt="Shopify Logo"
                  className="block object-contain h-16 greyC"
                ></img>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/images/Cloudflare-Logo.svg"
                  alt="Cloudflare Logo"
                  className="block object-contain h-16 greyC"
                ></img>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/images/PayPal-Logo.png"
                  alt="Paypal Logo"
                  className="block object-contain h-16 greyC"
                ></img>
              </div>
            </div>
          </div>
        </section> */}
        <div className="grr max-w-7xl pt-20 mx-auto text-center">
          <h1 className="mb-8 text-6xl font-semibold text-gray-900">
            No Reading, No Life
          </h1>
          <h1 className="mb-8 text-2xl font-semibold text-gray-600 text-center">
            読書管理ならSakudoku
          </h1>
          <div className="container flex flex-col items-center justify-center mx-auto rounded-lg ">
            <img
              className="object-cover object-center w-4/4 mb-10 g327 border rounded-lg shadow-md"
              alt="Placeholder Image"
              src="./images/toppage-2.png"
            ></img>
          </div>
        </div>
        <section className="relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <div className="py-24 md:py-36">
              <h1 className="mb-5 text-6xl font-semibold text-gray-900">
                Subscribe to our newsletter
              </h1>
              <h1 className="mb-9 text-2xl font-semibold text-gray-600">
                メールアドレスを入力
              </h1>
              <input
                placeholder="sakudoku@example.com"
                name="email"
                type="email"
                autoComplete="email"
                className="border border-gray-600 w-1/4 pr-2 pl-2 py-3 mt-2 rounded-md text-gray-800 font-semibold hover:border-gray-900"
              ></input>{" "}
              <a
                className="inline-flex items-center px-14 py-3 mt-2 ml-2 font-medium text-white transition duration-500 ease-in-out transform bg-blue-500 border rounded-full hover:bg-blue-800 hover:scale-100"
                href="/"
              >
                <span className="justify-center">Subscribe</span>
              </a>
            </div>
          </div>
        </section>
      </section>
    </Layout>
  )
}