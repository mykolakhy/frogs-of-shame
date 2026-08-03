pipeline {
  agent any

  environment {
    GH_PAGES_BRANCH = 'gh-pages'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Build') {
      steps {
        // Calls vite directly (not "npm run build") — that npm script goes through
        // scripts/with-secrets.sh, which reads macOS Keychain and doesn't exist on
        // this (Linux) agent. Here, bws run injects the secrets itself, sourced
        // from Jenkins Credentials instead of Keychain.
        withCredentials([
          string(credentialsId: 'THEY_ARE_FROGS_BWS_ACCESS_TOKEN', variable: 'BWS_ACCESS_TOKEN'),
          string(credentialsId: 'THEY_ARE_FROGS_BWS_PROJECT_ID', variable: 'BWS_PROJECT_ID')
        ]) {
          sh 'bws run --project-id "$BWS_PROJECT_ID" -- npx vite build'
        }
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'github-pages-deploy-token',
          usernameVariable: 'GH_USER',
          passwordVariable: 'GH_TOKEN'
        )]) {
          // Assumes an https:// origin remote (this repo's origin is
          // https://github.com/mykolakhy/they-are-frogs.git) — an ssh-style
          // origin would need different URL handling below.
          sh '''
            set -euo pipefail

            REPO_URL=$(git config --get remote.origin.url | sed -E "s#https://##")
            WORKTREE_DIR=$(mktemp -d)

            git fetch origin "${GH_PAGES_BRANCH}" || true

            # Detached checkout either way: pushing "HEAD:${GH_PAGES_BRANCH}" below
            # doesn't need a local branch name, which avoids "branch already
            # exists" failures across repeated Jenkins runs on a reused workspace.
            if git show-ref --verify --quiet "refs/remotes/origin/${GH_PAGES_BRANCH}"; then
              git worktree add --detach "$WORKTREE_DIR" "origin/${GH_PAGES_BRANCH}"
            else
              git worktree add --detach "$WORKTREE_DIR" HEAD
              git -C "$WORKTREE_DIR" checkout --orphan "${GH_PAGES_BRANCH}"
              git -C "$WORKTREE_DIR" reset --hard
            fi

            find "$WORKTREE_DIR" -mindepth 1 -maxdepth 1 -not -name '.git' -exec rm -rf {} +
            cp -r dist/. "$WORKTREE_DIR"/

            cd "$WORKTREE_DIR"
            git config user.name "jenkins-deploy"
            git config user.email "jenkins-deploy@users.noreply.github.com"
            git add -A
            if ! git diff --cached --quiet; then
              git commit -m "Deploy ${GIT_COMMIT}"
              git push "https://${GH_USER}:${GH_TOKEN}@${REPO_URL}" "HEAD:${GH_PAGES_BRANCH}"
            else
              echo "No changes to deploy"
            fi

            cd - > /dev/null
            git worktree remove "$WORKTREE_DIR" --force
          '''
        }
      }
    }
  }
}
