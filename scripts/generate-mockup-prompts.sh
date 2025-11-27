#!/bin/bash

# AI Image Generation Script for Product Mockups
# This script uses AI to generate high-quality product mockup images

echo "🎨 Generating AI Product Mockups..."
echo ""

# Create mockups directory if it doesn't exist
mkdir -p public/mockups

# T-Shirt Mockups
echo "📦 Generating T-Shirt mockups..."

# Front view - clean white t-shirt on mannequin, studio lighting
echo "  → T-Shirt Front View"
cat > /tmp/tshirt-front-prompt.txt << 'EOF'
Professional product photography of a clean white t-shirt on invisible mannequin, front view, studio lighting with soft shadows, 4:5 aspect ratio, high resolution, minimalist background with subtle gradient from light gray to white, centered composition, wrinkle-free fabric, perfect for DTF print placement visualization, commercial photography quality
EOF

# Back view - white t-shirt back
echo "  → T-Shirt Back View"
cat > /tmp/tshirt-back-prompt.txt << 'EOF'
Professional product photography of a clean white t-shirt on invisible mannequin, back view, studio lighting with soft shadows, 4:5 aspect ratio, high resolution, minimalist background with subtle gradient, centered composition, wrinkle-free fabric, neck tag visible, perfect for print placement visualization
EOF

# Left sleeve view
echo "  → T-Shirt Left Sleeve View"
cat > /tmp/tshirt-left-prompt.txt << 'EOF'
Professional product photography of a white t-shirt on invisible mannequin, left side view focusing on sleeve, studio lighting, 2:5 aspect ratio, high resolution, clean background, sleeve in focus for print placement
EOF

# Right sleeve view
echo "  → T-Shirt Right Sleeve View"
cat > /tmp/tshirt-right-prompt.txt << 'EOF'
Professional product photography of a white t-shirt on invisible mannequin, right side view focusing on sleeve, studio lighting, 2:5 aspect ratio, high resolution, clean background, sleeve in focus for print placement
EOF

# Hoodie Mockups
echo "📦 Generating Hoodie mockups..."

echo "  → Hoodie Front View"
cat > /tmp/hoodie-front-prompt.txt << 'EOF'
Professional product photography of a clean white pullover hoodie on invisible mannequin, front view, studio lighting, 4:5 aspect ratio, drawstrings visible, kangaroo pocket, hood laid flat, minimalist background, perfect for DTF print visualization, commercial quality
EOF

echo "  → Hoodie Back View"
cat > /tmp/hoodie-back-prompt.txt << 'EOF'
Professional product photography of a clean white pullover hoodie on invisible mannequin, back view, studio lighting, 4:5 aspect ratio, hood visible, minimalist background, wrinkle-free fabric
EOF

# Long Sleeve Mockups
echo "📦 Generating Long Sleeve mockups..."

echo "  → Long Sleeve Front View"
cat > /tmp/longsleeve-front-prompt.txt << 'EOF'
Professional product photography of a clean white long sleeve t-shirt on invisible mannequin, front view, studio lighting, 4:5 aspect ratio, sleeves extended naturally, minimalist background with soft gradient
EOF

# Tank Top Mockups
echo "📦 Generating Tank Top mockups..."

echo "  → Tank Top Front View"
cat > /tmp/tank-front-prompt.txt << 'EOF'
Professional product photography of a clean white tank top on invisible mannequin, front view, studio lighting, 4:5 aspect ratio, athletic fit, minimalist background, ribbed neckline and arm holes visible
EOF

# Tote Bag Mockups
echo "📦 Generating Tote Bag mockups..."

echo "  → Tote Bag Front View"
cat > /tmp/tote-front-prompt.txt << 'EOF'
Professional product photography of a natural canvas tote bag, front view centered, studio lighting, 4:5 aspect ratio, handles visible at top, flat lay style, minimalist background, perfect for print placement visualization on bag surface
EOF

# Hat Mockups
echo "📦 Generating Hat mockups..."

echo "  → Hat Front View"
cat > /tmp/hat-front-prompt.txt << 'EOF'
Professional product photography of a clean white baseball cap, front view showing bill and front panels, studio lighting, 4:3 aspect ratio, structured crown, minimalist background, perfect for front panel embroidery visualization
EOF

echo ""
echo "✅ Prompt files created in /tmp/"
echo ""
echo "📝 Next Steps:"
echo "1. Use these prompts with an AI image generator (DALL-E, Midjourney, Stable Diffusion)"
echo "2. Generate images at high resolution (1200x1500px minimum for 4:5 ratio)"
echo "3. Save images to public/mockups/ directory:"
echo "   - tshirt-front.png"
echo "   - tshirt-back.png"
echo "   - tshirt-left.png"
echo "   - tshirt-right.png"
echo "   - hoodie-front.png"
echo "   - hoodie-back.png"
echo "   - hoodie-left.png"
echo "   - hoodie-right.png"
echo "   - longsleeve-front.png"
echo "   - longsleeve-back.png"
echo "   - longsleeve-left.png"
echo "   - longsleeve-right.png"
echo "   - tank-front.png"
echo "   - tank-back.png"
echo "   - tote-front.png"
echo "   - hat-front.png"
echo ""
echo "🔧 Then run: npm run update-mockup-paths"
echo ""
