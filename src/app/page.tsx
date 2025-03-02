import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">张婧仪粉丝社区</h1>
      
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-4">热门工具</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            title="精选照片" 
            description="浏览张婧仪高清精选照片，按时间或项目分类整理" 
            image="/assets/zjy.jpeg"
            link="/images"
            bgColor="bg-amber-50"
            isPriority={true}
          />
          <FeatureCard 
            title="视频合集" 
            description="收录影视作品、综艺节目和幕后花絮视频" 
            image="/assets/zjy.jpeg"
            link="/videos" 
            bgColor="bg-blue-50"
          />
          <FeatureCard 
            title="社区讨论" 
            description="与其他粉丝交流，分享你的想法和创意" 
            image="/assets/zjy.jpeg"
            link="/community"
            bgColor="bg-green-50" 
          />
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-4">最新动态</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <NewsCard key={item} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/news" className="inline-block py-2 px-6 border border-black dark:border-white rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition">
            查看更多
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ 
  title, 
  description, 
  image, 
  link,
  bgColor = "bg-gray-50",
  isPriority = false
}: { 
  title: string; 
  description: string; 
  image: string;
  link: string;
  bgColor?: string;
  isPriority?: boolean;
}) {
  return (
    <Link href={link} className={`block rounded-lg overflow-hidden hover:shadow-lg transition ${bgColor}`}>
      <div className="h-48 relative">
        <Image 
          src={image} 
          alt={title}
          fill
          priority={isPriority}
          style={{objectFit: "cover"}}
          className="transition-transform hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
          fetchPriority={isPriority ? "high" : "auto"}
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </Link>
  );
}

function NewsCard() {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-md transition">
      <div className="h-40 bg-gray-200 dark:bg-gray-800 relative">
        <Image 
          src="/assets/zjy.jpeg" 
          alt="新闻图片"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{objectFit: "cover"}}
          priority={true}
        />
      </div>
      <div className="p-4">
        <span className="text-xs text-gray-500 dark:text-gray-400">2023年10月15日</span>
        <h3 className="text-lg font-medium mt-1 mb-2">张婧仪新剧《风起洛阳》将于下月开播</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          据悉，由张婧仪主演的古装剧《风起洛阳》将于11月在卫视和各大平台同步播出...
        </p>
      </div>
    </div>
  );
}
