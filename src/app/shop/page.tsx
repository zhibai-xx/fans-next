import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupportModuleEnabled } from "@/lib/features";

const CONTACT_INFO = [
  {
    label: "邮箱",
    value: "team@joyfans.org",
    helper: "欢迎发送合作、反馈或支持事宜，通常在 24 小时内回复。",
  },
  {
    label: "微信号",
    value: "JOYFansHub",
    helper: "添加后请备注“粉丝站支持”，方便快速识别。",
  },
];

const COLLAB_SERVICES = [
  "网站/小程序规划与开发",
  "AI 相关内容处理、自动化脚本",
  "多端部署、性能优化与日常技术支持",
];

const DONATE_IMAGES = [
  {
    label: "通过支付宝支持",
    src: "/support/alipay-placeholder.svg",
    tip: "",
  },
  {
    label: "通过微信支持",
    src: "/support/wechat-placeholder.svg",
    tip: "",
  },
];

const DONATE_TIPS = [
  "本网站为个人维护的非商业粉丝社区，所有支持行为均出于自愿。",
  "相关支持主要用于网站基础运行与维护支出，不构成任何商品或服务交易。",
  "无论是否支持，您都可以正常浏览和使用本站内容。",
];

export default function SupportPage() {
  if (!isSupportModuleEnabled) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-gray-400">Support & Contact</p>
        <h1 className="text-4xl font-semibold">支持我们 / 联系我们</h1>
        <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
          这个粉丝站由志愿者维护，所有工具与内容均免费开放。你可以在这里直接取得联系，
          或以自愿、无回报的方式帮助我们维持服务器与日常运营成本。
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">联系我们</CardTitle>
            <CardDescription>合作、反馈、紧急支持都可以通过以下方式找到我们。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {CONTACT_INFO.map((item) => (
                <div key={item.label} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-1">{item.label}</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{item.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.helper}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-gray-400 mb-2">承接商务合作</p>
              <div className="space-y-2">
                {COLLAB_SERVICES.map((service) => (
                  <p key={service} className="text-sm text-gray-700 dark:text-gray-200">
                    • {service}
                  </p>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                以上方向均可根据项目灵活定制，欢迎交流更具体的需求。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">支持我们</CardTitle>
            <CardDescription>这是一个由个人维护的非商业粉丝社区，以下内容仅用于说明支持方式。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              {DONATE_TIPS.map((tip) => (
                <p key={tip} className="text-sm text-gray-600 dark:text-gray-300">
                  • {tip}
                </p>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {DONATE_IMAGES.map((image) => (
                <div key={image.label} className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-center space-y-3">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900">
                    <Image
                      src={image.src}
                      alt={image.label}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, 45vw"
                      priority
                    />
                  </div>
                  <p className="font-medium">{image.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{image.tip}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              如不方便使用二维码，可先通过上方联系方式与我们沟通，确认合适的支持方式。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
