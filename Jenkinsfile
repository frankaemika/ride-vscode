#!groovy

pipeline {
    libraries {
        lib('fe-pipeline-steps@1.5.0')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '30'))
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    agent {
        label 'docker'
    }

    environment {
        // Name the build according to its commit
        BUILD_VERSION = feDetermineVersionFromGit()
    }

    stages {
        stage('Build') {
            agent {
                docker {
                    image 'franka/build/node-16:0.16.3'
                    reuseNode true
                }
            }
            steps {
                script {
                    notifyBitbucket()
                }
                feSetupNpm('playground')
                sshagent(['git_ssh']) {
                    feCiNpm()
                }
                sh "npx vsce package ${env.BUILD_VERSION} --no-git-tag-version"
                archiveArtifacts "ride-vscode-${env.BUILD_VERSION}.vsix"
            }
        }
    }

    post {
        always {
            fePublishBuildInfo()

            script {
                notifyBitbucket()
            }

            cleanWs()
        }
    }
}
