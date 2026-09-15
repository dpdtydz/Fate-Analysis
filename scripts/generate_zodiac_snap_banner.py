import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZODIAC_DIR = os.path.join(BASE_DIR, "public", "zodiac")
OUTPUT_PATH = os.path.join(BASE_DIR, "public", "gateway_snap_fate.jpg")

WIDTH = 1600
HEIGHT = 920

def create_banner():
    # 1. Base Canvas with smooth warm pastel gradient
    img = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Warm gradient from top-left (#FFFBF5) to bottom-right (#FFE4E6)
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        # Smooth interpolation: Warm ivory to peach-pink
        r = int(255 * (1 - ratio) + 255 * ratio)
        g = int(250 * (1 - ratio) + 230 * ratio)
        b = int(242 * (1 - ratio) + 235 * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b, 255))

    # Add subtle soft pastel circles for cozy studio depth
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    
    # Center cozy rug / spotlight
    glow_draw.ellipse([WIDTH * 0.15, HEIGHT * 0.35, WIDTH * 0.85, HEIGHT * 0.95], fill=(255, 255, 255, 140))
    # Soft warm accents
    glow_draw.ellipse([WIDTH * 0.25, HEIGHT * 0.1, WIDTH * 0.75, HEIGHT * 0.8], fill=(255, 240, 245, 100))
    glow_draw.ellipse([WIDTH * 0.05, HEIGHT * 0.05, WIDTH * 0.35, HEIGHT * 0.55], fill=(254, 243, 199, 90))
    glow_draw.ellipse([WIDTH * 0.65, HEIGHT * 0.05, WIDTH * 0.95, HEIGHT * 0.55], fill=(254, 226, 226, 90))
    
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # 2. Helper to load and scale zodiac image
    def load_zodiac(filename, target_width):
        path = os.path.join(ZODIAC_DIR, filename)
        if not os.path.exists(path):
            print(f"Warning: {filename} not found!")
            return None
        im = Image.open(path).convert("RGBA")
        aspect = im.height / im.width
        target_height = int(target_width * aspect)
        return im.resize((target_width, target_height), Image.Resampling.LANCZOS)

    # 3. Define 12 Zodiac Characters with our ACTUAL base assets
    # Main Stars: Dog (with scarf) & Rabbit (with sunglasses)
    dog_img = load_zodiac("zodiac_dog_item_scarf.png", 350)
    rabbit_img = load_zodiac("zodiac_rabbit_item_sunglasses.png", 350)

    # 10 Surrounding Friends
    friends = [
        # Left side friends (Upper to Lower)
        ("zodiac_rat_item_bowtie.png", 170, 100, 220, -10),
        ("zodiac_ox_item_glasses.png", 200, 180, 410, -5),
        ("zodiac_tiger_item_headphones.png", 210, 80, 580, 8),
        ("zodiac_dragon_item_bowtie.png", 190, 270, 640, -4),
        ("zodiac_snake_item_sunglasses.png", 180, 420, 710, 6),
        
        # Right side friends (Upper to Lower)
        ("zodiac_horse_item_bowtie.png", 190, 1340, 220, 10),
        ("zodiac_sheep_item_scarf.png", 200, 1220, 400, 5),
        ("zodiac_monkey_item_headphones.png", 200, 1330, 580, -8),
        ("zodiac_rooster_item_bowtie.png", 180, 1140, 650, 6),
        ("zodiac_pig_item_bowtie.png", 200, 990, 710, -5),
    ]

    # Paste background friends with soft shadows
    for fname, size, cx, cy, rot in friends:
        char_img = load_zodiac(fname, size)
        if char_img:
            if rot != 0:
                char_img = char_img.rotate(rot, expand=True, resample=Image.Resampling.BICUBIC)
            
            # Subtle drop shadow
            sh_w, sh_h = int(size * 0.65), int(size * 0.18)
            shadow = Image.new("RGBA", (sh_w, sh_h), (0, 0, 0, 0))
            sh_draw = ImageDraw.Draw(shadow)
            sh_draw.ellipse([4, 2, sh_w - 4, sh_h - 2], fill=(160, 110, 110, 45))
            shadow = shadow.filter(ImageFilter.GaussianBlur(10))
            img.paste(shadow, (cx + (char_img.width - sh_w) // 2, cy + char_img.height - sh_h // 2 - 10), shadow)

            # Paste friend character
            img.paste(char_img, (cx, cy), char_img)

    # 4. Paste Main Stars: Dog & Rabbit
    dog_x, dog_y = 510, 310
    rabbit_x, rabbit_y = 780, 310

    # Main Stars Shadows (Soft rounded oval)
    for (mx, my, mw) in [(dog_x, dog_y, 350), (rabbit_x, rabbit_y, 350)]:
        sh_w, sh_h = 240, 45
        shadow = Image.new("RGBA", (sh_w, sh_h), (0, 0, 0, 0))
        sh_draw = ImageDraw.Draw(shadow)
        sh_draw.ellipse([4, 2, sh_w - 4, sh_h - 2], fill=(150, 90, 90, 60))
        shadow = shadow.filter(ImageFilter.GaussianBlur(12))
        img.paste(shadow, (mx + (350 - sh_w) // 2, my + 305), shadow)

    img.paste(dog_img, (dog_x, dog_y), dog_img)
    img.paste(rabbit_img, (rabbit_x, rabbit_y), rabbit_img)

    # 5. Draw Paper Cup Telephone (종이컵 전화기 & 붉은 실)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    o_draw = ImageDraw.Draw(overlay)

    # Dog's paper cup (held near paw/mouth)
    cup_dog_x, cup_dog_y = dog_x + 245, dog_y + 205
    cup_rab_x, cup_rab_y = rabbit_x + 85, rabbit_y + 205

    # Curved Red String connecting the two cups (Red Ribbon of Fate)
    string_points = []
    steps = 100
    for i in range(steps + 1):
        t = i / steps
        px = (1 - t) * cup_dog_x + t * cup_rab_x
        # Sag downwards with a cheerful bounce in middle
        sag = math.sin(t * math.pi) * 85
        py = (1 - t) * cup_dog_y + t * cup_rab_y + sag
        string_points.append((px, py))

    # Draw String Glow & Line
    for offset in range(3, 0, -1):
        o_draw.line(string_points, fill=(244, 63, 94, 60), width=offset * 4)
    o_draw.line(string_points, fill=(235, 30, 75, 255), width=5)

    # Draw Little fluttering Hearts & Sparkles along the string
    mid_t = 0.5
    mid_x = (1 - mid_t) * cup_dog_x + mid_t * cup_rab_x
    mid_y = (1 - mid_t) * cup_dog_y + mid_t * cup_rab_y + math.sin(mid_t * math.pi) * 85

    # Center Heart Badge on String
    heart_radius = 26
    o_draw.ellipse([mid_x - heart_radius, mid_y - heart_radius - 8, mid_x + heart_radius, mid_y + heart_radius - 8], fill=(255, 255, 255, 250), outline=(244, 63, 94, 255), width=3)
    
    # Draw simple Heart polygon
    def draw_heart(d, cx, cy, sz, col):
        pts = [
            (cx, cy + sz * 0.7),
            (cx - sz * 0.85, cy),
            (cx - sz * 0.65, cy - sz * 0.75),
            (cx - sz * 0.2, cy - sz * 0.55),
            (cx, cy - sz * 0.25),
            (cx + sz * 0.2, cy - sz * 0.55),
            (cx + sz * 0.65, cy - sz * 0.75),
            (cx + sz * 0.85, cy),
        ]
        d.polygon(pts, fill=col)

    draw_heart(o_draw, mid_x, mid_y - 8, 13, (244, 63, 94, 255))

    # Helper to draw cute retro paper cup
    def draw_paper_cup(target_im, cx, cy, angle_deg, color_top, color_body, color_rim):
        cup_w, cup_h = 65, 80
        cup_im = Image.new("RGBA", (cup_w, cup_h), (0, 0, 0, 0))
        cd = ImageDraw.Draw(cup_im)
        
        pts = [
            (14, 14),
            (cup_w - 14, 14),
            (cup_w - 20, cup_h - 10),
            (20, cup_h - 10)
        ]
        cd.polygon(pts, fill=color_body, outline=color_rim, width=3)
        cd.ellipse([18, cup_h - 18, cup_w - 18, cup_h - 2], fill=color_body, outline=color_rim, width=3)
        cd.ellipse([11, 4, cup_w - 11, 24], fill=color_top, outline=color_rim, width=3)

        # Little stripes on paper cup for vintage retro cuteness
        cd.line([(18, 38), (cup_w - 18, 38)], fill=(255, 255, 255, 190), width=4)
        cd.line([(20, 50), (cup_w - 20, 50)], fill=(255, 255, 255, 190), width=3)

        rot_cup = cup_im.rotate(angle_deg, expand=True, resample=Image.Resampling.BICUBIC)
        target_im.paste(rot_cup, (int(cx - rot_cup.width / 2), int(cy - rot_cup.height / 2)), rot_cup)

    # Draw Dog's Cup (facing right towards string, pastel sky blue)
    draw_paper_cup(overlay, cup_dog_x, cup_dog_y + 12, -75, (186, 230, 253, 255), (56, 189, 248, 255), (14, 116, 144, 255))
    
    # Draw Rabbit's Cup (facing left towards string, pastel coral pink)
    draw_paper_cup(overlay, cup_rab_x, cup_rab_y + 12, 75, (254, 205, 211, 255), (251, 113, 133, 255), (190, 18, 60, 255))

    # 6. Little Cute Speech Bubbles above Dog & Rabbit
    def draw_bubble(d, x, y, w, h, is_left=True):
        d.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=(255, 255, 255, 245), outline=(254, 205, 211, 255), width=2)
        tail_x = x + 45 if is_left else x + w - 45
        d.polygon([(tail_x - 7, y + h), (tail_x + 7, y + h), (tail_x, y + h + 8)], fill=(255, 255, 255, 245))

    draw_bubble(o_draw, dog_x + 65, dog_y - 45, 190, 44, True)
    draw_bubble(o_draw, rabbit_x + 85, rabbit_y - 45, 190, 44, False)

    try:
        font_path = "C:/Windows/Fonts/malgunbd.ttf"
        if not os.path.exists(font_path):
            font_path = "C:/Windows/Fonts/malgun.ttf"
        font_bold = ImageFont.truetype(font_path, 20)
        o_draw.text((dog_x + 88, dog_y - 34), "우리 인연일까?", fill=(30, 41, 59, 255), font=font_bold)
        o_draw.text((rabbit_x + 108, rabbit_y - 34), "비밀 궁합 볼래?", fill=(30, 41, 59, 255), font=font_bold)
        
        # Subtle playful title banner at bottom center
        title_font = ImageFont.truetype(font_path, 22)
        subtitle = "12지신이 함께하는 1:1 비밀 인연 궁합"
        bbox = o_draw.textbbox((0, 0), subtitle, font=title_font)
        tw = bbox[2] - bbox[0]
        tx = (WIDTH - tw) // 2
        o_draw.rounded_rectangle([tx - 20, HEIGHT - 70, tx + tw + 20, HEIGHT - 25], radius=14, fill=(255, 255, 255, 230), outline=(254, 226, 226, 255), width=2)
        o_draw.text((tx, HEIGHT - 60), subtitle, fill=(159, 18, 57, 255), font=title_font)
    except Exception as e:
        print("Font notice:", e)

    # Add sparkles / stars
    sparkles = [
        (WIDTH * 0.5, HEIGHT * 0.22, 16),
        (WIDTH * 0.42, HEIGHT * 0.28, 10),
        (WIDTH * 0.58, HEIGHT * 0.26, 12),
        (dog_x + 10, dog_y + 120, 14),
        (rabbit_x + 330, rabbit_y + 120, 14),
        (WIDTH * 0.25, HEIGHT * 0.15, 12),
        (WIDTH * 0.75, HEIGHT * 0.15, 12),
    ]
    for sx, sy, sz in sparkles:
        # Four-point star
        pts = [
            (sx, sy - sz),
            (sx + sz * 0.28, sy - sz * 0.28),
            (sx + sz, sy),
            (sx + sz * 0.28, sy + sz * 0.28),
            (sx, sy + sz),
            (sx - sz * 0.28, sy + sz * 0.28),
            (sx - sz, sy),
            (sx - sz * 0.28, sy - sz * 0.28),
        ]
        o_draw.polygon(pts, fill=(251, 191, 36, 220))

    img = Image.alpha_composite(img, overlay)

    # Convert to RGB and save as high-quality JPG
    rgb_img = img.convert("RGB")
    rgb_img.save(OUTPUT_PATH, "JPEG", quality=96)
    print(f"Successfully generated 12 Zodiac Banner at: {OUTPUT_PATH}")

if __name__ == "__main__":
    create_banner()
