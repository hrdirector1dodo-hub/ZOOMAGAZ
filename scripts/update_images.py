# update_images.py
import json, os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
products_path = os.path.join(BASE_DIR, 'src', 'data', 'products.json')
articles_path = os.path.join(BASE_DIR, 'src', 'data', 'articles.json')

placeholder = 'https://via.placeholder.com/600x400?text=Image+not+available'

def replace_unsplash(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    modified = False
    # handle list of objects
    if isinstance(data, list):
        for item in data:
            # products have 'images' list
            if 'images' in item and isinstance(item['images'], list):
                new_images = []
                for url in item['images']:
                    if isinstance(url, str) and 'images.unsplash.com' in url:
                        new_images.append(placeholder)
                        modified = True
                    else:
                        new_images.append(url)
                item['images'] = new_images
            # articles have single 'image'
            if 'image' in item and isinstance(item['image'], str):
                if 'images.unsplash.com' in item['image']:
                    item['image'] = placeholder
                    modified = True
    # write back if changed
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'Updated {os.path.basename(file_path)}')
    else:
        print(f'No changes needed for {os.path.basename(file_path)}')

replace_unsplash(products_path)
replace_unsplash(articles_path)
