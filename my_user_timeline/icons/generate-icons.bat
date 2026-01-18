@echo off
chcp 65001 >nul
echo ========================================
echo AI Conversation Timeline 图标生成器
echo ========================================
echo.

REM 检查 ImageMagick 是否安装
where magick >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 ImageMagick
    echo.
    echo 请使用以下方法之一：
    echo 1. 在浏览器中打开 generate-icons.html 文件
    echo 2. 安装 ImageMagick: https://imagemagick.org/script/download.php
    echo.
    pause
    exit /b 1
)

echo [信息] 检测到 ImageMagick，开始生成图标...
echo.

REM 生成不同尺寸的图标
echo [生成] 16x16 图标...
magick icon.svg -resize 16x16 icon16.png
if %errorlevel% equ 0 (echo [成功] icon16.png) else (echo [失败] icon16.png)

echo [生成] 32x32 图标...
magick icon.svg -resize 32x32 icon32.png
if %errorlevel% equ 0 (echo [成功] icon32.png) else (echo [失败] icon32.png)

echo [生成] 48x48 图标...
magick icon.svg -resize 48x48 icon48.png
if %errorlevel% equ 0 (echo [成功] icon48.png) else (echo [失败] icon48.png)

echo [生成] 128x128 图标...
magick icon.svg -resize 128x128 icon128.png
if %errorlevel% equ 0 (echo [成功] icon128.png) else (echo [失败] icon128.png)

echo.
echo ========================================
echo 图标生成完成！
echo ========================================
echo.
echo 请确保以下文件已生成：
dir /b icon*.png
echo.
pause
