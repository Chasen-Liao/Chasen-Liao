# Chasen GitHub 短开场

**2026-10-29 用户已确认：「这个开场可以」。** 当前开场为已接受版本；后续主页版式迭代保留该动画。此确认仅覆盖开场。

从个人站 `chasen-intro/intro/src/Intro.tsx` 改编，保留原有开场扫描、字母入场、圆点与说明文字动画。

- 96 帧，30fps，3.2 秒完整入场。
- 字标始终居中，完成后保持稳定。
- 完全移除 3D 头像卡片、侧移、粒子翻卡和淡出。
- 桌面 1600 × 640，手机 1080 × 640；GitHub 封面采用紧凑比例。
- 原个人站源码与视频未修改。

使用 Node 24：

```sh
npm ci
npm run render
npm run still
```

需要选择本机浏览器时，在 Remotion 命令后加 `--browser-executable`。手机合成的 ID 是 `ProfileOpeningMobile`。

README 使用从渲染视频导出的动画 WebP，动态帧维持 30fps，播放一次，停在完整结尾；系统减少动态效果时使用完整结尾的静态画面。生产文件在 `assets/profile-v3`，原始渲染 MP4 在 `assets/profile-v2/opening*.mp4`。
