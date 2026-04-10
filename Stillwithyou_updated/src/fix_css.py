import sys

file_path = r'd:\stillwithyou\Stillwithyou_updated\src\index.css'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Define ranges to remove (1-indexed, inclusive)
    # 1. First shop block: 1418-2161
    # 2. Responsive shop block: 2603-2679 (note: some other styles might be inside media query, be careful)
    # 3. New broken shop block: 5081 to the end
    ranges_to_remove = [
        (1418, 2161),
        (2603, 2679),
        (5082, 5325)
    ]

    # Sort backwards to avoid index shifting
    for start, end in sorted(ranges_to_remove, reverse=True):
        print(f"Removing lines {start} to {end}")
        del lines[start-1:end]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Cleanup successful.")

except Exception as e:
    print(f"Error: {e}")
