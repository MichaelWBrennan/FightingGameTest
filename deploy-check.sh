#!/bin/bash
# Vercel Deployment Verification Script

echo "🚀 Fighting Game Platform - Vercel Deployment Check"
echo "=================================================="

# Check required files
echo "✅ Checking required Vercel files..."
FILES=("vercel.json" "package.json" ".vercelignore" "index.html")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file exists"
    else
        echo "   ✗ $file missing"
        exit 1
    fi
done

# Check HTML demos
echo ""
echo "🎮 Checking demo files..."
HTML_FILES=(
    "index.html"
    "character_select_demo.html" 
    "pseudo_2d5_demo.html"
    "enhanced_sprite_demo.html"
    "gothic_stage_showcase.html"
    "graphics_upgrade_showcase.html"
    "sf2_character_select_demo.html"
    "demo_preview.html"
)

for file in "${HTML_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file ready for deployment"
    else
        echo "   ⚠ $file not found"
    fi
done

# Check assets
echo ""
echo "🎨 Checking assets..."
if [ -d "assets" ]; then
    echo "   ✓ Assets directory exists"
    echo "   📊 Asset summary:"
    echo "      - Folders: $(find assets -type d | wc -l)"
    echo "      - Files: $(find assets -type f | wc -l)"
else
    echo "   ⚠ Assets directory not found"
fi

# Validate JSON files
echo ""
echo "🔧 Validating configuration files..."
if command -v python3 &> /dev/null; then
    if python3 -m json.tool vercel.json > /dev/null 2>&1; then
        echo "   ✓ vercel.json is valid JSON"
    else
        echo "   ✗ vercel.json has JSON errors"
        exit 1
    fi
    
    if python3 -m json.tool package.json > /dev/null 2>&1; then
        echo "   ✓ package.json is valid JSON"
    else
        echo "   ✗ package.json has JSON errors" 
        exit 1
    fi
else
    echo "   ⚠ Python3 not available for JSON validation"
fi

# Check file sizes
echo ""
echo "📏 Checking file sizes for web optimization..."
LARGE_FILES=$(find . -name "*.html" -o -name "*.js" -o -name "*.css" | xargs ls -la | awk '$5 > 500000 {print $9 " (" $5 " bytes)"}')
if [ -n "$LARGE_FILES" ]; then
    echo "   ⚠ Large files detected (>500KB):"
    echo "$LARGE_FILES" | sed 's/^/      /'
else
    echo "   ✓ All web files are optimally sized"
fi

echo ""
echo "✅ Deployment verification complete!"
echo ""
echo "🌐 Ready for Vercel deployment!"
echo "   Run: vercel --prod"
echo "   Or connect to Vercel dashboard for automatic deployment"