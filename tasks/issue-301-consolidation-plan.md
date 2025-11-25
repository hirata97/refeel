# Issue #301: CI/CD Documentation Consolidation Plan

## Analysis Results

### Current Issues
1. **Heavy duplication**: Troubleshooting, operations, and command references scattered across multiple files
2. **Unclear directory roles**: CI/ and INFRASTRUCTURE/ have overlapping purposes
3. **CI_CD_TESTING.md location**: Sits in DEVELOPMENT/ but covers broader CI/CD workflows

### Proposed Directory Roles

#### CI/ Directory - **Daily Operations & Best Practices**
**Purpose**: Documentation developers use daily for CI/CD operations
**Target audience**: Developers working with PRs and CI/CD pipelines
**Content focus**:
- Operational guides (running CI/CD, checking results)
- Best practices for development workflow
- Type generation system (developer-facing)
- Quick troubleshooting tips

**Files to keep**:
- `CI_CD_GUIDE.md` - **Simplified** to daily operations guide
- `CI_CD_BEST_PRACTICES.md` - Keep as-is (already focused)
- `TYPE_GENERATION.md` - Keep as-is (specific system)
- `README.md` - Update to reflect new structure

#### INFRASTRUCTURE/ Directory - **Architecture & Advanced Operations**
**Purpose**: Deep-dive documentation for infrastructure, architecture, and advanced operations
**Target audience**: DevOps, infrastructure engineers, project maintainers
**Content focus**:
- Architecture and technical design
- Configuration change procedures
- Advanced operations (monitoring, cost management)
- Comprehensive troubleshooting
- Performance optimization

**Files to keep**:
- `CI_CD_OVERVIEW.md` - Keep architecture details
- `CI_CD_CONFIGURATION.md` - Keep advanced configuration
- `CI_CD_OPERATIONS.md` - Keep operations/maintenance
- `CI_CD_QUICK_REFERENCE.md` - **Move to CI/** (developer-facing)
- `CI_CD_TROUBLESHOOTING.md` - Keep detailed troubleshooting

#### CI/ Directory (New home)
- `CI_CD_TESTING.md` - **Move from DEVELOPMENT/** - Comprehensive workflow guide belongs with operations

## Consolidation Actions

### 1. Simplify CI_CD_GUIDE.md
- Remove detailed troubleshooting → Reference CI_CD_TROUBLESHOOTING.md
- Remove architecture details → Reference CI_CD_OVERVIEW.md
- Keep: Daily operations, job overview, basic commands
- Add: Cross-references to INFRASTRUCTURE/ for deep-dives

### 2. Move files
- `docs/INFRASTRUCTURE/CI_CD_QUICK_REFERENCE.md` → `docs/CI/CI_CD_QUICK_REFERENCE.md`
- `docs/DEVELOPMENT/CI_CD_TESTING.md` → `docs/CI/CI_CD_TESTING.md`

### 3. Update cross-references
- All moved/changed files need updated internal links
- Update `docs/README.md` structure
- Update `docs/CI/README.md`
- Update references in CLAUDE.md if any

### 4. Deduplicate content
- Remove troubleshooting duplications in CI_CD_GUIDE.md
- Remove command duplications, reference CI_CD_QUICK_REFERENCE.md instead
- Add cross-reference comments in each file header

## Expected Benefits

1. **Clear separation**: Daily ops (CI/) vs Infrastructure/Architecture (INFRASTRUCTURE/)
2. **Reduced maintenance**: Single source of truth for each topic
3. **Easier navigation**: Developers know to check CI/ first, INFRASTRUCTURE/ for deep-dives
4. **No information loss**: All content preserved, better organized
