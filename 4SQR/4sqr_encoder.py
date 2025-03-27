import sys
import numpy as np
from PIL import Image, ImageDraw

SHAPE_MAP = {
    '00': 'WSB',   # White Square (for reference)
    '01': 'BSB',   # Black Square
    '10': 'TRI',   # Triangle
    '11': 'CIR'    # Circle
}

def encode_4sqr(url, output_file="4sqr.png", cell_size=50):
    # Convert URL to binary with padding
    binary = ''.join(f"{byte:08b}" for byte in url.encode('utf-8'))
    padding = (16 - (len(binary) % 16)) % 16  # Pad to 16-bit boundary
    binary += '0' * padding
    
    # Compute data length (number of 2-bit pairs) for the payload
    data_length = len(binary) // 2

    # Metadata: 8 bits for cell_size and 16 bits for data_length => 24 bits (12 pairs)
    meta_pairs = 12  
    required_pairs = data_length + meta_pairs
    
    # Calculate matrix size: inner grid must be large enough to store all required pairs.
    matrix_size = int(np.ceil(np.sqrt(required_pairs))) + 2
    
    # Create matrix with default value "00" (white)
    matrix = [['00' for _ in range(matrix_size)] for _ in range(matrix_size)]
    
    # Add position markers (L-shape): first 3 cells of first row and first column become "01" (black)
    for i in range(3):
        matrix[i][0] = '01'
        matrix[0][i] = '01'
    
    # Build metadata: 8 bits for cell_size + 16 bits for data_length
    meta = f"{cell_size:08b}{data_length:016b}"
    full_binary = meta + binary
    
    # Fill inner grid with 2-bit chunks from full_binary
    index = 0
    for row in range(1, matrix_size - 1):
        for col in range(1, matrix_size - 1):
            if index < len(full_binary) // 2:
                matrix[row][col] = full_binary[index*2:(index+1)*2]
                index += 1
    
    # Draw image
    img_size = matrix_size * cell_size
    img = Image.new('RGB', (img_size, img_size), 'white')
    draw = ImageDraw.Draw(img)
    
    for row in range(matrix_size):
        for col in range(matrix_size):
            x0 = col * cell_size
            y0 = row * cell_size
            x1 = x0 + cell_size
            y1 = y0 + cell_size
            chunk = matrix[row][col]
            
            if chunk == '01':  # Black Square
                draw.rectangle([x0, y0, x1, y1], fill='black')
            elif chunk == '10':  # Triangle
                draw.polygon([(x0, y1), (x1, y1), ((x0+x1)//2, y0)], fill='black')
            elif chunk == '11':  # Circle
                draw.ellipse([x0, y0, x1, y1], fill='black')
    
    img.save(output_file)
    print(f"Encoded 4SQR saved to {output_file}")

# Main block for command-line integration (for local testing)
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python 4sqr_encoder.py <patientUrl> <outputFile> [cell_size]")
        sys.exit(1)
    patientUrl = sys.argv[1]
    output_file = sys.argv[2]
    cell_size = int(sys.argv[3]) if len(sys.argv) > 3 else 50
    encode_4sqr(patientUrl, output_file=output_file, cell_size=cell_size)
