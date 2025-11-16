# Git Setup & Push Guide

This guide helps you push your SmartHomeCloud code to Git and prepare for AWS deployment.

## Prerequisites

- Git installed locally
- GitHub/GitLab/Bitbucket account
- SSH key configured (recommended) or HTTPS credentials

## Initial Git Setup

### 1. Create Remote Repository

**On GitHub:**
1. Go to https://github.com
2. Click "+" → "New repository"
3. Repository name: `smarthomecloud` (or your preferred name)
4. Description: "Intelligent Cloud Platform for Smart Homes & Senior Care"
5. Privacy: Private (recommended for production code)
6. **Do NOT** initialize with README, .gitignore, or license
7. Click "Create repository"

**On GitLab:**
1. Go to https://gitlab.com
2. Click "New project" → "Create blank project"
3. Project name: `smarthomecloud`
4. Visibility: Private
5. **Uncheck** "Initialize repository with a README"
6. Click "Create project"

### 2. Download Your Code from Replit

Since Git operations are managed by Replit, you'll need to download your code:

**Option A: Using Replit Download**
1. In Replit, click the three dots (⋮) menu
2. Select "Download as zip"
3. Extract the zip file to your local machine
4. Navigate to the extracted folder in terminal

**Option B: Using Git Clone (if you have Git access)**
```bash
# This will download from Replit's backup repository
git clone gitsafe-backup:git://gitsafe:5418/backup.git smarthomecloud-local
cd smarthomecloud-local
```

### 3. Initialize Git Repository Locally

```bash
# Navigate to your project directory
cd smarthomecloud

# Initialize git (if not already initialized)
git init

# Verify .gitignore exists and is correct
cat .gitignore

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: SmartHomeCloud Platform"
```

### 4. Add Remote Repository

Replace `<your-username>` and `<repository-name>` with your actual values:

**For GitHub:**
```bash
git remote add origin git@github.com:<your-username>/<repository-name>.git
# Or using HTTPS:
# git remote add origin https://github.com/<your-username>/<repository-name>.git
```

**For GitLab:**
```bash
git remote add origin git@gitlab.com:<your-username>/<repository-name>.git
# Or using HTTPS:
# git remote add origin https://gitlab.com/<your-username>/<repository-name>.git
```

**For Bitbucket:**
```bash
git remote add origin git@bitbucket.org:<your-username>/<repository-name>.git
```

### 5. Verify Remote

```bash
git remote -v
```

You should see:
```
origin  git@github.com:<your-username>/<repository-name>.git (fetch)
origin  git@github.com:<your-username>/<repository-name>.git (push)
```

### 6. Push to Remote

```bash
# Push to main branch
git push -u origin main

# If your default branch is 'master':
# git push -u origin master
```

If you get an error about branch names:
```bash
# Rename branch to main
git branch -M main
git push -u origin main
```

## SSH Key Setup (Recommended)

If you haven't set up SSH keys:

### 1. Generate SSH Key

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location
# Enter passphrase (optional but recommended)
```

### 2. Add SSH Key to SSH Agent

```bash
# Start ssh-agent
eval "$(ssh-agent -s)"

# Add your key
ssh-add ~/.ssh/id_ed25519
```

### 3. Add SSH Key to GitHub/GitLab

```bash
# Copy your public key to clipboard
cat ~/.ssh/id_ed25519.pub
```

**On GitHub:**
1. Go to Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste your public key
4. Click "Add SSH key"

**On GitLab:**
1. Go to Preferences → SSH Keys
2. Paste your public key
3. Click "Add key"

### 4. Test SSH Connection

```bash
# For GitHub
ssh -T git@github.com

# For GitLab
ssh -T git@gitlab.com

# You should see a success message
```

## Branch Strategy

### Main Branch (Production)

```bash
# Main branch for production-ready code
git checkout main
```

### Development Branch

```bash
# Create and switch to development branch
git checkout -b development

# Push development branch
git push -u origin development
```

### Feature Branches

```bash
# Create feature branch
git checkout -b feature/user-authentication

# Make changes, then commit
git add .
git commit -m "Add user authentication feature"

# Push feature branch
git push -u origin feature/user-authentication
```

## Common Git Workflows

### Making Changes

```bash
# Check status
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "Fix: IoT dashboard device health trends now show real data"

# Push to remote
git push
```

### Pulling Latest Changes

```bash
# Pull latest changes from remote
git pull origin main

# Or fetch and merge separately
git fetch origin
git merge origin/main
```

### Creating a Release Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags to remote
git push origin --tags
```

### Viewing History

```bash
# View commit history
git log --oneline

# View changes in last commit
git show

# View changes between branches
git diff main development
```

## Commit Message Conventions

Use semantic commit messages:

```bash
# Features
git commit -m "feat: Add IoT device management dashboard"

# Bug fixes
git commit -m "fix: Resolve device health trends data mismatch"

# Documentation
git commit -m "docs: Add AWS deployment guide"

# Refactoring
git commit -m "refactor: Improve authentication middleware"

# Performance
git commit -m "perf: Optimize database queries for alerts"

# Tests
git commit -m "test: Add e2e tests for system configuration"

# Security
git commit -m "security: Implement privilege escalation prevention"
```

## .gitignore Configuration

The project includes a comprehensive `.gitignore` file that excludes:

- `node_modules/` - Dependencies
- `dist/` - Build outputs
- `.env*` - Environment variables
- `*.log` - Log files
- `.DS_Store` - macOS files
- `*.pem`, `*.key` - Security files

**Important:** Never commit sensitive data like:
- Database credentials
- API keys
- Session secrets
- OAuth secrets
- Private keys

## Pre-Push Checklist

Before pushing to Git, verify:

- [ ] `.env` files are in `.gitignore`
- [ ] No sensitive data in code
- [ ] Code builds successfully (`npm run build`)
- [ ] All tests pass
- [ ] Code is formatted and linted
- [ ] Commit messages are descriptive
- [ ] Large files are excluded
- [ ] Build artifacts are ignored

## File Size Considerations

**GitHub Limits:**
- File size: 100 MB maximum
- Repository size: 5 GB recommended

**Large Files:**
If you have large files (videos, datasets), use Git LFS:

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.mp4"
git lfs track "*.zip"

# Add .gitattributes
git add .gitattributes
git commit -m "Configure Git LFS"
```

## Syncing with Replit

To keep your Git repository in sync with Replit:

### 1. Make Changes in Replit

Work on your code in Replit as normal

### 2. Download Updated Code

Download the latest version from Replit when ready to push

### 3. Update Local Repository

```bash
# Copy new/updated files to your local git repo
# Then commit and push
git add .
git commit -m "Update from Replit: [describe changes]"
git push
```

### 4. Automate with Script (Optional)

Create a sync script:

```bash
#!/bin/bash
# sync-from-replit.sh

echo "Downloading from Replit..."
# Download code from Replit (manual step)

echo "Committing changes..."
git add .
git commit -m "Sync from Replit - $(date +%Y-%m-%d)"

echo "Pushing to remote..."
git push

echo "Sync complete!"
```

## Collaboration Workflow

### Pull Request Process

1. Create feature branch
2. Make changes and commit
3. Push branch to remote
4. Create pull request on GitHub/GitLab
5. Request code review
6. Address feedback
7. Merge to main branch

### Protecting Main Branch

On GitHub:
1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators

## Troubleshooting

### Error: Permission Denied (SSH)

```bash
# Check SSH key is added
ssh-add -l

# Add SSH key if needed
ssh-add ~/.ssh/id_ed25519
```

### Error: Authentication Failed (HTTPS)

```bash
# Update remote to use SSH
git remote set-url origin git@github.com:<username>/<repo>.git
```

### Error: Merge Conflict

```bash
# View conflicts
git status

# Edit conflicted files, then:
git add .
git commit -m "Resolve merge conflicts"
```

### Error: Large File Rejected

```bash
# Remove file from commit
git rm --cached large-file.zip

# Add to .gitignore
echo "large-file.zip" >> .gitignore

# Commit the change
git commit --amend
```

## Next Steps

After pushing to Git:

1. ✅ Code is version controlled
2. ✅ Ready for team collaboration
3. ✅ Ready for CI/CD pipeline
4. ✅ Ready for AWS deployment

See **DEPLOYMENT.md** for AWS deployment instructions.

## Useful Git Commands Reference

```bash
# Status and info
git status                    # Show working tree status
git log --oneline            # Show commit history
git branch                   # List branches
git remote -v                # Show remotes

# Making changes
git add .                    # Stage all changes
git commit -m "message"      # Commit changes
git push                     # Push to remote

# Branching
git checkout -b new-branch   # Create and switch to new branch
git checkout main            # Switch to main branch
git merge feature-branch     # Merge feature into current branch

# Undoing changes
git reset HEAD~1             # Undo last commit (keep changes)
git reset --hard HEAD~1      # Undo last commit (discard changes)
git checkout -- file.txt     # Discard changes to file

# Syncing
git fetch origin             # Download changes (don't merge)
git pull origin main         # Download and merge changes
git push origin main         # Upload changes

# Cleanup
git clean -fd                # Remove untracked files
git branch -d branch-name    # Delete local branch
git push origin --delete br  # Delete remote branch
```

---

**Security Reminder:** Always review files before committing to ensure no secrets or sensitive data are included!
