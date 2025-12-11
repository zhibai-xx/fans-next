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
            title="支持我们" 
            description="了解如何在不涉及交易的前提下，自愿支持站点运营" 
            image="/assets/zjy.jpeg"
            link="/shop"
            bgColor="bg-green-50" 
          />
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
