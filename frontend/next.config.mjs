/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    typescript: {
        ignoreBuildErrors: true,
    },
    // Важно для CSS из src/app/
    sassOptions: {
        includePaths: ['./src'],
    },
    // Для изображений
    images: {
        unoptimized: true, // временно, пока нет оптимизации
    },
}

export default nextConfig