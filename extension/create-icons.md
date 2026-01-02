# Creating Extension Icons

The Chrome extension requires three icon files. You can create them using any of these methods:

## Option 1: Online Icon Generator
1. Visit https://www.favicon-generator.org/ or similar
2. Upload or create a simple icon design
3. Download the generated icons in different sizes
4. Rename and place them in the `icons/` directory:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)

## Option 2: Using ImageMagick (if installed)
```bash
# Create a simple colored square icon
convert -size 128x128 xc:#1976d2 -pointsize 72 -fill white -gravity center -annotate +0+0 "T&C" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

## Option 3: Using Python PIL/Pillow
```python
from PIL import Image, ImageDraw, ImageFont

# Create 128x128 icon
img = Image.new('RGB', (128, 128), color='#1976d2')
draw = ImageDraw.Draw(img)
# Add text or shapes as needed
img.save('icon128.png')

# Resize for other sizes
img48 = img.resize((48, 48))
img48.save('icon48.png')
img16 = img.resize((16, 16))
img16.save('icon16.png')
```

## Suggested Design
- Background: Blue (#1976d2) or Maroon
- Icon: Document/contract symbol or magnifying glass
- Text: "T&C" or "T&CA"
- Style: Simple, clean, recognizable at small sizes

## Quick Placeholder (Temporary)
For testing, you can use any 16x16, 48x48, and 128x128 PNG images. The extension will work with placeholder icons.




