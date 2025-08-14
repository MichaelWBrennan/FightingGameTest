#!/bin/bash
# Sprite Generator CLI Wrapper
# ===========================
# 
# Simple command-line interface for the Fighting Game Sprite Generator
# Provides easy access to common sprite generation tasks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Show help
show_help() {
    echo "🎮 Fighting Game Sprite Generator CLI"
    echo "===================================="
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  single <character>     Generate sprites for single character"
    echo "  batch [characters...]  Generate sprites for multiple characters"
    echo "  all                    Generate sprites for all existing characters"  
    echo "  new <characters...>    Generate sprites for new characters"
    echo "  example                Run integration example"
    echo "  help                   Show this help message"
    echo ""
    echo "Options for single/batch/new:"
    echo "  --poses idle,walk,attack,jump    Poses to generate (comma-separated)"
    echo "  --enhanced-only                  Generate only enhanced resolution"
    echo "  --dithering                      Apply retro dithering"
    echo "  --palette <name>                 Use specific color palette"
    echo "  --archetype <type>               Use specific archetype"
    echo ""
    echo "Examples:"
    echo "  $0 single ryu"
    echo "  $0 batch ryu ken chun_li"
    echo "  $0 all --enhanced-only"
    echo "  $0 new akuma cammy --poses idle,attack --dithering"
    echo ""
}

# Check if Python and dependencies are available
check_dependencies() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed"
        return 1
    fi

    if ! python3 -c "import PIL" 2>/dev/null; then
        print_error "PIL/Pillow is required. Install with: pip install Pillow"
        return 1
    fi

    if ! python3 -c "import numpy" 2>/dev/null; then
        print_error "NumPy is required. Install with: pip install numpy"
        return 1
    fi

    return 0
}

# Parse pose options
parse_poses() {
    local poses_arg="$1"
    if [[ -n "$poses_arg" ]]; then
        echo "${poses_arg//,/ }"
    else
        echo "idle walk attack jump"
    fi
}

# Generate single character
generate_single() {
    local character="$1"
    shift
    
    if [[ -z "$character" ]]; then
        print_error "Character name required for single generation"
        echo "Usage: $0 single <character> [options]"
        return 1
    fi

    print_info "Generating sprites for character: $character"
    
    # Parse additional options
    local poses="idle walk punch kick jump special"
    local extra_args=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --poses)
                poses=$(parse_poses "$2")
                shift 2
                ;;
            --enhanced-only)
                extra_args+=(--enhanced-only)
                shift
                ;;
            --dithering)
                extra_args+=(--dithering)
                shift
                ;;
            --palette)
                extra_args+=(--palette "$2")
                shift 2
                ;;
            --archetype)
                extra_args+=(--archetype "$2")
                shift 2
                ;;
            *)
                print_warning "Unknown option: $1"
                shift
                ;;
        esac
    done
    
    # Run the generator
    cd "$PROJECT_ROOT"
    python3 tools/sprite_generator/sprite_generator.py \
        --character "$character" \
        --poses $poses \
        "${extra_args[@]}"
        
    if [[ $? -eq 0 ]]; then
        print_success "Successfully generated sprites for $character"
        return 0
    else
        print_error "Failed to generate sprites for $character"
        return 1
    fi
}

# Generate batch characters
generate_batch() {
    local characters=("$@")
    
    if [[ ${#characters[@]} -eq 0 ]]; then
        print_error "At least one character required for batch generation"
        echo "Usage: $0 batch <character1> [character2] ... [options]"
        return 1
    fi

    # Separate characters from options
    local char_list=()
    local extra_args=()
    local in_options=false
    
    for arg in "${characters[@]}"; do
        if [[ "$arg" == --* ]]; then
            in_options=true
        fi
        
        if [[ "$in_options" == true ]]; then
            extra_args+=("$arg")
        else
            char_list+=("$arg")
        fi
    done

    print_info "Generating sprites for characters: ${char_list[*]}"
    
    # Run the batch generator
    cd "$PROJECT_ROOT"
    python3 tools/sprite_generator/batch_generator.py \
        --characters "${char_list[@]}" \
        "${extra_args[@]}"
        
    if [[ $? -eq 0 ]]; then
        print_success "Successfully generated sprites for ${#char_list[@]} characters"
        return 0
    else
        print_error "Failed to generate some sprites"
        return 1
    fi
}

# Generate all existing characters
generate_all() {
    print_info "Generating sprites for all existing characters"
    
    cd "$PROJECT_ROOT"
    python3 tools/sprite_generator/batch_generator.py --all-existing "$@"
    
    if [[ $? -eq 0 ]]; then
        print_success "Successfully generated sprites for all existing characters"
        return 0
    else
        print_error "Failed to generate some sprites"
        return 1
    fi
}

# Generate new characters
generate_new() {
    local characters=("$@")
    
    if [[ ${#characters[@]} -eq 0 ]]; then
        print_error "At least one character required for new character generation"
        echo "Usage: $0 new <character1> [character2] ... [options]"
        return 1
    fi

    # Separate characters from options (same logic as batch)
    local char_list=()
    local extra_args=()
    local in_options=false
    
    for arg in "${characters[@]}"; do
        if [[ "$arg" == --* ]]; then
            in_options=true
        fi
        
        if [[ "$in_options" == true ]]; then
            extra_args+=("$arg")
        else
            char_list+=("$arg")
        fi
    done

    print_info "Generating sprites for new characters: ${char_list[*]}"
    
    cd "$PROJECT_ROOT"
    python3 tools/sprite_generator/batch_generator.py \
        --new-characters "${char_list[@]}" \
        "${extra_args[@]}"
        
    if [[ $? -eq 0 ]]; then
        print_success "Successfully generated sprites for ${#char_list[@]} new characters"
        return 0
    else
        print_error "Failed to generate some sprites"
        return 1
    fi
}

# Run integration example
run_example() {
    print_info "Running integration example"
    
    cd "$PROJECT_ROOT"
    python3 tools/sprite_generator/integration_example.py
    
    if [[ $? -eq 0 ]]; then
        print_success "Integration example completed successfully"
        return 0
    else
        print_error "Integration example failed"
        return 1
    fi
}

# Main command processing
main() {
    # Check dependencies first
    if ! check_dependencies; then
        exit 1
    fi
    
    # Show help if no arguments
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        single)
            generate_single "$@"
            ;;
        batch)
            generate_batch "$@"
            ;;
        all)
            generate_all "$@"
            ;;
        new)
            generate_new "$@"
            ;;
        example)
            run_example
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"