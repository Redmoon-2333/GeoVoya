export interface IntroVideo {
  id: string
  title: string
  description: string
  poster: string
  src?: string
  duration?: string
}

export const introVideos: IntroVideo[] = [
  { id: 'course', title: '课程介绍', description: '从望闻问切到成果交流，先了解整条研学路线怎样走。', poster: '/media/forest-floor.webp' },
  { id: 'tianmu-tour', title: '西天目山考察导览', description: '沿着样带看林下、树干与林冠，知道每一步观察在哪里发生。', poster: '/media/forest-canopy.webp' },
]
