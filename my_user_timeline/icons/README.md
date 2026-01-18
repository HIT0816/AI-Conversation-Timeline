# AI Conversation Timeline 图标生成说明

## 🎨 图标设计

本插件使用现代化的渐变色彩图标，设计理念：
- **渐变背景**：紫色到粉色的渐变，体现 AI 的科技感
- **时间轴线条**：垂直的时间轴，代表对话历史
- **对话节点**：白色圆点，表示不同的对话轮次
- **高亮节点**：当前活跃的对话节点有光晕效果

## 📥 生成图标文件

### 方法一：使用 HTML 生成器（推荐）

1. 在浏览器中打开 `generate-icons.html` 文件
2. 点击"生成所有尺寸图标"按钮
3. 图标会自动下载到您的下载文件夹
4. 将下载的图标文件移动到 `user_timeline/icons/` 目录
5. 确保文件名为：`icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

### 方法二：使用在线工具转换 SVG

1. 打开 `icon.svg` 文件
2. 使用在线 SVG 转 PNG 工具（如 https://svgtopng.com/）
3. 分别生成 16x16, 32x32, 48x48, 128x128 尺寸的 PNG 文件
4. 保存到 `user_timeline/icons/` 目录

### 方法三：使用 ImageMagick（命令行）

如果您安装了 ImageMagick，可以运行：

```bash
magick icon.svg -resize 16x16 icon16.png
magick icon.svg -resize 32x32 icon32.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 128x128 icon128.png
```

## ✅ 验证

生成图标后，确保以下文件存在：
- `icons/icon16.png` (16x16 像素)
- `icons/icon32.png` (32x32 像素)
- `icons/icon48.png` (48x48 像素)
- `icons/icon128.png` (128x128 像素)

然后重新加载 Chrome 扩展程序，图标就会显示在扩展程序管理页面中。
