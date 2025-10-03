from PIL import Image, ImageDraw
import os

def create_default_avatar():
    img = Image.new('RGB', (200, 200), color='#4A90E2')
    d = ImageDraw.Draw(img)
    

    d.ellipse([50, 50, 150, 150], fill='#FFFFFF')

    os.makedirs('static', exist_ok=True)
    img.save('static/default_avatar.png', 'PNG')

if __name__ == "__main__":
    create_default_avatar()